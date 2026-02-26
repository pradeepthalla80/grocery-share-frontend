import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { itemsAPI } from '../api/items';
import { getAccountStatus } from '../api/stripeConnect';
import { lookupBarcode, type ProductInfo } from '../api/openFoodFacts';
import { aiAPI } from '../api/ai';
import { FormInput } from '../components/FormInput';
import { ImageUpload } from '../components/ImageUpload';
import { AddressInput } from '../components/AddressInput';
import { LocationMap } from '../components/LocationMap';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, AlertTriangle, ScanLine, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle, Sparkles, Brain, Leaf } from 'lucide-react';

const addItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  price: z.string().optional(),
  isFree: z.boolean().optional(),
  pickupTimeStart: z.string().optional(),
  pickupTimeEnd: z.string().optional(),
  flexiblePickup: z.boolean().optional(),
  validityPeriod: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
}).refine((data) => {
  if (!data.isFree && (!data.price || Number(data.price) <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Price must be a positive number when item is not free',
  path: ['price'],
}).refine((data) => {
  if (!data.flexiblePickup && data.pickupTimeStart && data.pickupTimeEnd) {
    return new Date(data.pickupTimeEnd) > new Date(data.pickupTimeStart);
  }
  return true;
}, {
  message: 'Pickup end time must be after start time',
  path: ['pickupTimeEnd'],
});

type AddItemFormData = z.infer<typeof addItemSchema>;

export const AddItem = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [flexiblePickup, setFlexiblePickup] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [stripeStatus, setStripeStatus] = useState<'loading' | 'active' | 'pending' | 'incomplete' | 'none'>('loading');
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'not_found' | 'error'; product?: ProductInfo } | null>(null);
  const [showNutrition, setShowNutrition] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string | null; category: string | null; confidence: number } | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [freshnessResult, setFreshnessResult] = useState<{ score: number | null; label: string } | null>(null);

  useEffect(() => {
    const checkStripe = async () => {
      try {
        const data = await getAccountStatus();
        if (data.hasAccount) {
          if (data.chargesEnabled && data.payoutsEnabled) {
            setStripeStatus('active');
          } else if (data.detailsSubmitted) {
            setStripeStatus('pending');
          } else {
            setStripeStatus('incomplete');
          }
        } else {
          setStripeStatus('none');
        }
      } catch {
        setStripeStatus('none');
      }
    };
    checkStripe();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      address: '',
      lat: 41.881832,
      lng: -87.623177,
      isFree: false,
      flexiblePickup: true,
      expiryDate: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const address = watch('address');

  const getDefaultExpiryDays = (category?: string): number => {
    if (!category) return 14;
    const cat = category.toLowerCase();
    if (cat.includes('dairy') || cat.includes('milk') || cat.includes('yogurt') || cat.includes('cheese')) return 14;
    if (cat.includes('meat') || cat.includes('poultry') || cat.includes('fish') || cat.includes('seafood')) return 7;
    if (cat.includes('bread') || cat.includes('bakery') || cat.includes('pastry')) return 7;
    if (cat.includes('fruit') || cat.includes('vegetable') || cat.includes('produce') || cat.includes('salad')) return 10;
    if (cat.includes('frozen')) return 90;
    if (cat.includes('canned') || cat.includes('preserved') || cat.includes('dry') || cat.includes('pasta') || cat.includes('rice') || cat.includes('cereal')) return 180;
    if (cat.includes('snack') || cat.includes('chips') || cat.includes('cookie') || cat.includes('cracker')) return 90;
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('soda') || cat.includes('water')) return 90;
    if (cat.includes('sauce') || cat.includes('condiment') || cat.includes('spice') || cat.includes('seasoning')) return 180;
    return 30;
  };

  const shortenProductName = (name: string, brand?: string): string => {
    let display = brand ? `${brand} ${name}` : name;

    display = display.replace(/\b(flavored|flavoured)\b/gi, '');
    display = display.replace(/\b(potato|tortilla|corn)\s+chips\b/gi, 'Chips');
    display = display.replace(/\b\d+(\.\d+)?\s*(oz|g|kg|lb|ml|l|fl\s*oz|ct|count|pack|pk)\b/gi, '');
    display = display.replace(/\s*-\s*/g, ' ');
    display = display.replace(/\s{2,}/g, ' ').trim();

    if (display.length <= 40) return display;

    const words = display.split(' ');
    let result = '';
    for (const word of words) {
      const test = result ? `${result} ${word}` : word;
      if (test.length > 40) break;
      result = test;
    }
    return result || words.slice(0, 3).join(' ');
  };

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setScanLoading(true);
    setScanResult(null);
    setShowNutrition(false);
    setScannedBarcode(null);
    try {
      const product = await lookupBarcode(barcode);
      if (product.found) {
        setScannedBarcode(barcode);
        if (product.name) {
          const displayName = shortenProductName(product.name, product.brand);
          setValue('name', displayName);
        }
        if (product.category) {
          setValue('category', product.category);
        }
        if (product.tags && product.tags.length > 0) {
          setValue('tags', product.tags.join(', '));
        }
        const days = getDefaultExpiryDays(product.category);
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);
        setValue('expiryDate', `${expiry.getFullYear()}-${String(expiry.getMonth() + 1).padStart(2, '0')}-${String(expiry.getDate()).padStart(2, '0')}`);
        setScanResult({ status: 'success', product });
      } else {
        setScanResult({ status: 'not_found' });
      }
    } catch {
      setScanResult({ status: 'error' });
    } finally {
      setScanLoading(false);
    }
  }, [setValue]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setValue('address', location.address);
    setValue('lat', location.lat);
    setValue('lng', location.lng);
    setLocationError('');
  };

  const handleImageChange = (files: File[]) => {
    setImageFiles(files);
    if (files.length === 0) {
      setImageError('Please provide at least one image');
    } else {
      setImageError('');
    }
    if (files.length > 0 && !scanResult?.product && !aiDismissed) {
      handleAiRecognize(files[0]);
    }
  };

  const isProduceCategory = (category?: string | null): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase();
    return ['fruit', 'vegetable', 'produce', 'salad', 'herb', 'berry', 'leafy', 'root', 'fresh', 'bakery', 'bread', 'pastry'].some(k => cat.includes(k));
  };

  const handleAiRecognize = async (file: File) => {
    try {
      setAiLoading(true);
      setAiSuggestion(null);
      setFreshnessResult(null);

      const recognitionResult = await aiAPI.recognizeFood(file);

      let detectedCategory: string | null = null;
      if (recognitionResult.success && recognitionResult.suggestions) {
        const { bestName, bestCategory, confidence } = recognitionResult.suggestions;
        detectedCategory = bestCategory;
        if (bestName || bestCategory) {
          setAiSuggestion({ name: bestName, category: bestCategory, confidence });
        }
      }

      if (isProduceCategory(detectedCategory)) {
        try {
          const freshnessRes = await aiAPI.checkFreshness(file);
          if (freshnessRes.success && freshnessRes.freshness) {
            const { score, label } = freshnessRes.freshness;
            if (label && label !== 'unknown') {
              setFreshnessResult({ score, label });
            }
          }
        } catch {
          console.log('Freshness check not available');
        }
      }
    } catch (err) {
      console.log('AI recognition not available:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = (field: 'name' | 'category' | 'both') => {
    if (!aiSuggestion) return;
    if (field === 'name' || field === 'both') {
      if (aiSuggestion.name) setValue('name', aiSuggestion.name);
    }
    if (field === 'category' || field === 'both') {
      if (aiSuggestion.category) setValue('category', aiSuggestion.category);
    }
    setAiSuggestion(null);
  };

  const onSubmit = async (data: AddItemFormData) => {
    try {
      setLoading(true);
      setError('');
      setImageError('');

      if (imageFiles.length === 0) {
        setImageError('Please upload at least one image');
        setLoading(false);
        return;
      }

      if (!data.address || data.lat === undefined || data.lat === null || data.lng === undefined || data.lng === null) {
        setLocationError('Please select a location');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', data.name);
      if (data.category) {
        formData.append('category', data.category);
      }
      formData.append('expiryDate', data.expiryDate);
      formData.append('isFree', isFree.toString());
      formData.append('price', isFree ? '0' : (data.price || '0'));
      formData.append('flexiblePickup', flexiblePickup.toString());
      if (!flexiblePickup && data.pickupTimeStart) {
        formData.append('pickupTimeStart', data.pickupTimeStart);
      }
      if (!flexiblePickup && data.pickupTimeEnd) {
        formData.append('pickupTimeEnd', data.pickupTimeEnd);
      }
      
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      if (scannedBarcode) {
        tags.push(`barcode:${scannedBarcode}`);
      }
      formData.append('tags', JSON.stringify(tags));
      
      formData.append('address', data.address);
      formData.append('location', JSON.stringify({
        lat: data.lat,
        lng: data.lng,
      }));

      if (data.validityPeriod) {
        formData.append('validityPeriod', data.validityPeriod);
      }

      if (freshnessResult) {
        if (freshnessResult.score !== null) {
          formData.append('freshnessScore', freshnessResult.score.toString());
        }
        formData.append('freshnessLabel', freshnessResult.label);
      }

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

            const response = await itemsAPI.create(formData);
      
      console.log('Item created successfully:', response);
      showToast('Item added successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Create item error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to add item';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const onFormError = (formErrors: any) => {
    const firstError = Object.values(formErrors)[0] as any;
    const errorMsg = firstError?.message || 'Please fill in all required fields';
    showToast(errorMsg, 'error');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-5 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 active:text-gray-700 mb-4 md:mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl md:rounded-xl shadow-sm border border-gray-100 p-5 md:p-8">
          <div className="mb-5 md:mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Add New Item</h1>
              <button
                type="button"
                onClick={() => { setScanResult(null); setShowScanner(true); }}
                disabled={scanLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium active:scale-[0.97] transition shadow-sm disabled:opacity-50"
              >
                {scanLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                <span>{scanLoading ? 'Looking up...' : 'Scan Barcode'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Scan barcode for packaged items · Upload photo for fresh produce</p>
          </div>

          {scanLoading && (
            <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium text-sm">Looking up product...</p>
                <p className="text-blue-600 text-xs mt-0.5">Searching product databases, this may take a moment</p>
              </div>
            </div>
          )}

          {scanResult && (
            <div className={`mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
              scanResult.status === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              {scanResult.status === 'success' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-green-800 font-medium">Product found!</p>
                    <p className="text-green-700 mt-0.5">
                      {scanResult.product?.name}
                      {scanResult.product?.brand && ` by ${scanResult.product.brand}`}
                      {scanResult.product?.quantity && ` (${scanResult.product.quantity})`}
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Form fields have been auto-filled{scanResult.product?.source && ` via ${scanResult.product.source}`}. You can still edit them.
                    </p>
                    {scanResult.product?.nutrition && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowNutrition(!showNutrition)}
                          className="mt-2 flex items-center gap-1 text-green-700 text-xs font-medium hover:text-green-900 transition-colors"
                        >
                          {showNutrition ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {showNutrition ? 'Hide' : 'View'} Nutrition Info
                        </button>
                        {showNutrition && (
                          <div className="mt-2 bg-white/60 rounded-lg p-2.5 border border-green-100">
                            {scanResult.product.nutrition.servingSize && (
                              <p className="text-green-600 text-[10px] mb-1.5 uppercase tracking-wide font-medium">
                                {scanResult.product.nutrition.servingSize}
                              </p>
                            )}
                            <div className="grid grid-cols-4 gap-1.5">
                              {scanResult.product.nutrition.calories != null && (
                                <div className="text-center bg-green-50 rounded-md py-1.5 px-1">
                                  <p className="text-green-900 font-bold text-sm">{scanResult.product.nutrition.calories}</p>
                                  <p className="text-green-600 text-[10px]">Cal</p>
                                </div>
                              )}
                              {scanResult.product.nutrition.protein != null && (
                                <div className="text-center bg-blue-50 rounded-md py-1.5 px-1">
                                  <p className="text-blue-900 font-bold text-sm">{scanResult.product.nutrition.protein}g</p>
                                  <p className="text-blue-600 text-[10px]">Protein</p>
                                </div>
                              )}
                              {scanResult.product.nutrition.carbs != null && (
                                <div className="text-center bg-amber-50 rounded-md py-1.5 px-1">
                                  <p className="text-amber-900 font-bold text-sm">{scanResult.product.nutrition.carbs}g</p>
                                  <p className="text-amber-600 text-[10px]">Carbs</p>
                                </div>
                              )}
                              {scanResult.product.nutrition.fat != null && (
                                <div className="text-center bg-orange-50 rounded-md py-1.5 px-1">
                                  <p className="text-orange-900 font-bold text-sm">{scanResult.product.nutrition.fat}g</p>
                                  <p className="text-orange-600 text-[10px]">Fat</p>
                                </div>
                              )}
                            </div>
                            {(scanResult.product.nutrition.fiber != null || scanResult.product.nutrition.sugar != null || scanResult.product.nutrition.sodium != null) && (
                              <div className="flex gap-3 mt-1.5 pt-1.5 border-t border-green-100">
                                {scanResult.product.nutrition.fiber != null && (
                                  <span className="text-green-700 text-[10px]">Fiber: {scanResult.product.nutrition.fiber}g</span>
                                )}
                                {scanResult.product.nutrition.sugar != null && (
                                  <span className="text-green-700 text-[10px]">Sugar: {scanResult.product.nutrition.sugar}g</span>
                                )}
                                {scanResult.product.nutrition.sodium != null && (
                                  <span className="text-green-700 text-[10px]">Sodium: {scanResult.product.nutrition.sodium}mg</span>
                                )}
                              </div>
                            )}
                            {scanResult.product?.allergens && scanResult.product.allergens.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-green-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-red-600 text-[10px] font-semibold uppercase tracking-wide">Allergens</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {scanResult.product.allergens.map((allergen, i) => (
                                    <span key={i} className="inline-block bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 rounded-md border border-red-100">
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {!scanResult.product?.nutrition && scanResult.product?.allergens && scanResult.product.allergens.length > 0 && (
                      <div className="mt-2 bg-white/60 rounded-lg p-2.5 border border-green-100">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 text-[10px] font-semibold uppercase tracking-wide">Allergens</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {scanResult.product.allergens.map((allergen, i) => (
                            <span key={i} className="inline-block bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 rounded-md border border-red-100">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">
                      {scanResult.status === 'not_found' ? 'Product not found in database' : 'Lookup failed'}
                    </p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      Fill in details manually, try scanning again, or upload a photo for AI recognition.
                    </p>
                  </div>
                </>
              )}
              <button
                onClick={() => setScanResult(null)}
                className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-5 md:space-y-6">
            <FormInput
              label="Item Name"
              type="text"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Organic Apples"
            />

            <ImageUpload
              maxImages={5}
              onChange={handleImageChange}
              error={imageError}
            />

            {aiLoading && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
                <Brain className="h-4 w-4 animate-pulse" />
                <span>AI is analyzing your photo...</span>
              </div>
            )}

            {aiSuggestion && !aiDismissed && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Suggestion ({aiSuggestion.confidence}% confidence)</span>
                  </div>
                  <button type="button" onClick={() => { setAiSuggestion(null); setAiDismissed(true); }} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestion.name && (
                    <button type="button" onClick={() => applyAiSuggestion('name')}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-100 text-xs">
                      Use name: <strong>{aiSuggestion.name}</strong>
                    </button>
                  )}
                  {aiSuggestion.category && (
                    <button type="button" onClick={() => applyAiSuggestion('category')}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-100 text-xs">
                      Use category: <strong>{aiSuggestion.category}</strong>
                    </button>
                  )}
                  {aiSuggestion.name && aiSuggestion.category && (
                    <button type="button" onClick={() => applyAiSuggestion('both')}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs">
                      Use both
                    </button>
                  )}
                </div>
              </div>
            )}

            {freshnessResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                freshnessResult.label === 'fresh' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                freshnessResult.label === 'moderate' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <Leaf className="h-4 w-4" />
                <span>
                  Freshness: {freshnessResult.label === 'fresh' ? 'Fresh' : freshnessResult.label === 'moderate' ? 'OK' : 'Needs checking'}
                  {freshnessResult.score !== null ? ` (${freshnessResult.score}%)` : ''}
                </span>
                <span className="text-xs opacity-70 ml-auto">AI detected</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormInput
                label="Category (Optional)"
                type="text"
                {...register('category')}
                error={errors.category?.message}
                placeholder="e.g., Fruits"
              />

              <FormInput
                label="Tags (comma-separated)"
                type="text"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., organic, fresh"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <FormInput
                  label="Expiry Date"
                  type="date"
                  {...register('expiryDate')}
                  error={errors.expiryDate?.message}
                />
                {scanResult?.status === 'success' && (
                  <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    Estimated based on product category. Please verify the actual expiry date on the package.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Listing Validity
                </label>
                <select
                  {...register('validityPeriod')}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                >
                  <option value="never">Never expires</option>
                  <option value="2h">2 hours</option>
                  <option value="6h">6 hours</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                </select>
                <p className="text-[10px] text-gray-400">After this period, your listing will be hidden</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${isFree ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => { setIsFree(!isFree); setValue('isFree', !isFree); }}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Give away for free</span>
              </label>
              {!isFree && (
                <>
                  <FormInput
                    label="Price ($)"
                    type="number"
                    step="0.01"
                    {...register('price')}
                    error={errors.price?.message}
                    placeholder="9.99"
                  />
                  <p className="text-[10px] text-gray-400 -mt-3">Minimum $3.00 for paid items (Stripe processing requirement)</p>
                  {stripeStatus !== 'loading' && stripeStatus !== 'active' && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        {stripeStatus === 'none' && (
                          <p className="text-amber-800">
                            To sell paid items, you need a free Stripe account so buyers can pay you directly to your bank account.{' '}
                            <Link to={user?.isStoreOwner ? "/my-store" : "/profile"} className="text-green-600 font-medium underline">
                              Set up Stripe account
                            </Link>
                          </p>
                        )}
                        {stripeStatus === 'incomplete' && (
                          <p className="text-amber-800">
                            Your Stripe setup is incomplete. Buyers won't be able to pay you until it's finished.{' '}
                            <Link to={user?.isStoreOwner ? "/my-store" : "/profile"} className="text-green-600 font-medium underline">
                              Complete Stripe setup
                            </Link>
                          </p>
                        )}
                        {stripeStatus === 'pending' && (
                          <p className="text-amber-800">
                            Your Stripe account is under review. You can list items, but payments may be delayed until verification is complete.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${flexiblePickup ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => { setFlexiblePickup(!flexiblePickup); setValue('flexiblePickup', !flexiblePickup); }}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${flexiblePickup ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Flexible Pickup Time</span>
              </label>
              <input type="hidden" {...register('flexiblePickup')} />

              {!flexiblePickup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Pickup Start"
                    type="datetime-local"
                    {...register('pickupTimeStart')}
                    error={errors.pickupTimeStart?.message}
                  />
                  <FormInput
                    label="Pickup End"
                    type="datetime-local"
                    {...register('pickupTimeEnd')}
                    error={errors.pickupTimeEnd?.message}
                  />
                </div>
              )}
            </div>

            <AddressInput
              onLocationSelect={handleLocationSelect}
              defaultAddress={address}
              defaultLat={lat}
              defaultLng={lng}
              error={locationError || errors.address?.message}
            />

            {lat !== undefined && lat !== null && lng !== undefined && lng !== null && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Map Preview
                </label>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <LocationMap
                    lat={lat}
                    lng={lng}
                    address={address}
                    height="250px"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium active:scale-[0.98]"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
