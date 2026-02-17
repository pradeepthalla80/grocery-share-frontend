import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { aiAPI } from '../api/ai';
import { getNearbyRequests, type ItemRequest } from '../api/itemRequests';
import { getRecommendations } from '../api/recommendations';
import { AddressInput } from '../components/AddressInput';
import { useAuth } from '../hooks/useAuth';
import { Search, Plus, Sparkles, Calendar, MapPin, Package, MessageCircle, ArrowUpDown, X, SlidersHorizontal, ChevronDown, Store, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '../utils/date';

type TabType = 'available' | 'requested';
type SortOption = 'distance' | 'price' | 'expiry' | 'newest';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [recommendations, setRecommendations] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [searchLocation, setSearchLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState('10');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [smartSearchEnabled, setSmartSearchEnabled] = useState(false);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchLocation) {
      setError('Please select a location to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'available') {
        if (smartSearchEnabled && keyword.trim()) {
          setSmartSearchLoading(true);
          try {
            const response = await aiAPI.smartSearch({
              query: keyword.trim(),
              lat: searchLocation.lat,
              lng: searchLocation.lng,
              radius: parseFloat(radius) * 1000,
            });
            const mappedItems: Item[] = response.items.map((item: any) => ({
              ...item,
              id: item.id || item._id,
              location: item.location?.coordinates 
                ? { lat: item.location.coordinates[1], lng: item.location.coordinates[0], address: item.address }
                : item.location,
              user: item.user?._id ? { id: item.user._id, name: item.user.name, email: '' } : item.user,
              similarityScore: item.similarityScore,
            }));
            setItems(mappedItems);
          } catch {
            const response = await itemsAPI.search({
              lat: searchLocation.lat,
              lng: searchLocation.lng,
              radius: parseFloat(radius),
              keyword: keyword || undefined,
              category: category || undefined,
              tags: tags || undefined,
            });
            setItems(response.items);
          } finally {
            setSmartSearchLoading(false);
          }
        } else {
          const response = await itemsAPI.search({
            lat: searchLocation.lat,
            lng: searchLocation.lng,
            radius: parseFloat(radius),
            keyword: keyword || undefined,
            category: category || undefined,
            tags: tags || undefined,
          });
          setItems(response.items);
        }
      } else {
        const response = await getNearbyRequests(
          searchLocation.lat,
          searchLocation.lng,
          parseFloat(radius)
        );
        setRequests(response.requests || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setSearchLocation(location);
  };

  // Sorting function for items
  const sortItems = (itemsToSort: Item[]) => {
    const sorted = [...itemsToSort];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'price':
        return sorted.sort((a, b) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return (a.price || 0) - (b.price || 0);
        });
      case 'expiry':
        return sorted.sort((a, b) => 
          parseLocalDate(a.expiryDate).getTime() - parseLocalDate(b.expiryDate).getTime()
        );
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  // Sorting function for requests
  const sortRequests = (requestsToSort: ItemRequest[]) => {
    const sorted = [...requestsToSort];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  const sortedItems = sortItems(items);
  const sortedRequests = sortRequests(requests);

  const fetchRecommendations = async () => {
    if (!searchLocation) return;
    
    try {
      const response = await getRecommendations(searchLocation.lat, searchLocation.lng, 6);
      setRecommendations(response.items);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  useEffect(() => {
    // Auto-search when location is selected or tab changes
    if (searchLocation) {
      handleSearch();
      if (activeTab === 'available') {
        fetchRecommendations();
      }
    }
  }, [searchLocation, activeTab]);

  // Auto-load items on page load using browser geolocation
  useEffect(() => {
    if ('geolocation' in navigator && !searchLocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Set location and trigger auto-search
          setSearchLocation({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback: use a default location (e.g., New York City)
          setSearchLocation({
            address: 'Default Location',
            lat: 40.7128,
            lng: -74.0060
          });
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Discover Nearby</h1>
            <p className="text-gray-500 text-xs md:text-base mt-0.5 md:mt-2">Find great deals on groceries</p>
          </div>
          <button
            onClick={() => navigate('/add-item')}
            className="hidden md:flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Add Item</span>
          </button>
        </div>

        {!user?.isStoreOwner && (
          <div className="mb-4 md:mb-6 bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-4 md:p-5 text-white relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold">Become a Store Owner</h3>
                <p className="text-green-100 text-xs md:text-sm mt-0.5">List products, manage inventory & grow your business on BaskMate</p>
              </div>
              <button
                onClick={() => navigate('/store-setup')}
                className="bg-white text-green-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold active:scale-95 transition flex-shrink-0"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-lg shadow-sm md:shadow-md border border-gray-100 md:border-0 mb-4 md:mb-8 overflow-hidden">
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between p-4 md:hidden active:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">Search & Filters</span>
              {(keyword || category || tags) && (
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {[keyword, category, tags].filter(Boolean).length}
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block p-4 md:p-6 border-t border-gray-100 md:border-0`}>
            <h2 className="text-lg font-semibold mb-4 hidden md:flex items-center">
              <Search className="h-5 w-5 mr-2 text-green-600" />
              Search Filters
            </h2>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs md:text-sm font-medium text-gray-600">Keyword</label>
                  <button
                    type="button"
                    onClick={() => setSmartSearchEnabled(!smartSearchEnabled)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                      smartSearchEnabled
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    <Brain className="h-3 w-3" />
                    AI Search {smartSearchEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={smartSearchEnabled ? 'Try "healthy breakfast" or "snacks for kids"...' : 'Search items...'}
                  className={`w-full px-3 py-2.5 border rounded-xl md:rounded-md focus:outline-none focus:ring-2 text-sm ${
                    smartSearchEnabled
                      ? 'border-purple-200 focus:ring-purple-500 bg-purple-50/30 md:bg-purple-50/30'
                      : 'border-gray-200 focus:ring-green-500 bg-gray-50 md:bg-white'
                  }`}
                />
                {smartSearchLoading && (
                  <p className="text-[10px] text-purple-600 mt-1 flex items-center gap-1">
                    <Brain className="h-3 w-3 animate-pulse" /> AI is finding relevant items...
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl md:rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50 md:bg-white appearance-none"
                >
                  <option value="">All Categories</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Canned Goods">Canned Goods</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="organic, fresh..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl md:rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50 md:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <AddressInput
                  onLocationSelect={handleLocationSelect}
                  defaultAddress={searchLocation?.address}
                  defaultLat={searchLocation?.lat}
                  defaultLng={searchLocation?.lng}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">Radius</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl md:rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50 md:bg-white appearance-none"
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                  <option value="100">100 miles</option>
                </select>
              </div>
            </div>
            <div className="mt-3 md:mt-4">
              <button
                onClick={() => { handleSearch(); setFiltersOpen(false); }}
                disabled={loading || !searchLocation}
                className="w-full md:w-auto flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-2.5 rounded-xl md:rounded-md font-medium hover:bg-green-700 transition disabled:opacity-50 active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-scale-in">
            {error}
          </div>
        )}

        {(keyword || category || tags) && (
          <div className="mb-3 md:mb-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 pb-1">
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition"
                >
                  <span>{keyword}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              {category && (
                <button
                  onClick={() => setCategory('')}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition"
                >
                  <span>{category}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              {tags && (
                <button
                  onClick={() => setTags('')}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition"
                >
                  <span>{tags}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => { setKeyword(''); setCategory(''); setTags(''); }}
                className="text-xs text-gray-500 font-medium whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-6 sticky top-12 md:top-16 z-30 bg-gray-50 -mx-4 px-4 md:mx-0 md:px-0 py-2 md:py-0">
          <div className="flex bg-gray-100 md:bg-transparent rounded-xl md:rounded-none p-1 md:p-0 md:border-b md:border-gray-200">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-1.5 md:space-x-2 py-2.5 md:pb-4 px-3 md:px-1 rounded-lg md:rounded-none text-sm font-medium transition ${
                activeTab === 'available'
                  ? 'bg-white md:bg-transparent text-green-600 shadow-sm md:shadow-none md:border-b-2 md:border-green-600'
                  : 'text-gray-500'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Available</span>
              {items.length > 0 && activeTab === 'available' && (
                <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('requested')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-1.5 md:space-x-2 py-2.5 md:pb-4 px-3 md:px-1 rounded-lg md:rounded-none text-sm font-medium transition ${
                activeTab === 'requested'
                  ? 'bg-white md:bg-transparent text-green-600 shadow-sm md:shadow-none md:border-b-2 md:border-green-600'
                  : 'text-gray-500'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Requested</span>
              {requests.length > 0 && activeTab === 'requested' && (
                <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'available' && (
          <>
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <p className="text-gray-500 text-xs md:text-sm">
                <span className="font-semibold text-gray-700">{items.length}</span> items within {radius} mi
              </p>
              <div className="flex items-center space-x-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                >
                  <option value="distance">Distance</option>
                  <option value="price">Price</option>
                  <option value="expiry">Expiry</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {sortedItems.map((item) => {
            const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.imageURL;
            const handleItemClick = () => {
              navigate(`/item/${item.id}`);
            };
            const isExpired = parseLocalDate(item.expiryDate) < new Date();
            const daysUntilExpiry = Math.ceil((parseLocalDate(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div 
                key={item.id} 
                onClick={handleItemClick}
                className="bg-white rounded-xl md:rounded-lg shadow-sm md:shadow-md border border-gray-100 md:border-0 overflow-hidden mobile-card cursor-pointer animate-fade-in"
              >
                <div className="relative w-full h-28 md:h-32 bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-28 md:h-32 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                  {isExpired ? (
                    <div className="absolute top-1.5 right-1.5 bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[10px] font-semibold">
                      Expired
                    </div>
                  ) : daysUntilExpiry <= 2 ? (
                    <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-md text-[10px] font-semibold">
                      Urgent
                    </div>
                  ) : (
                    <div className="absolute top-1.5 right-1.5 bg-green-600/90 text-white px-1.5 py-0.5 rounded-md text-[10px] font-semibold">
                      Active
                    </div>
                  )}
                  {item.isFree ? (
                    <div className="absolute bottom-1.5 left-1.5 bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                      FREE
                    </div>
                  ) : (
                    <div className="absolute bottom-1.5 left-1.5 bg-white/90 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                      ${item.price.toFixed(2)}
                    </div>
                  )}
                  {item.isStoreItem && (
                    <div className="absolute top-1.5 left-1.5 bg-purple-600/90 text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                      <Store className="h-2.5 w-2.5" />
                      Store
                    </div>
                  )}
                </div>
                <div className="p-2.5 md:p-3">
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                  <div className="mt-1.5 space-y-1 text-[10px] md:text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{format(parseLocalDate(item.expiryDate), 'MMM dd')}</span>
                    </div>
                    {item.location?.address && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{item.location.address.split(',')[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading && items.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="skeleton h-28 md:h-32" />
                <div className="p-2.5">
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="text-center py-16 md:py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No items found</p>
            <p className="text-gray-400 text-sm mt-1">Try expanding your search radius</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-8 md:mt-12">
            <div className="flex items-center space-x-2 mb-4 md:mb-6">
              <Sparkles className="h-5 w-5 text-green-600" />
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">You Might Also Like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {recommendations.map((item) => {
                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.imageURL;
                const handleItemClick = () => {
                  navigate(`/item/${item.id}`);
                };
                return (
                  <div 
                    key={item.id} 
                    onClick={handleItemClick}
                    className="bg-white rounded-xl md:rounded-lg shadow-sm md:shadow-md border border-gray-100 md:border-0 overflow-hidden mobile-card cursor-pointer"
                  >
                    <div className="relative w-full h-28 md:h-32 bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-28 md:h-32 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                      {item.isFree ? (
                        <div className="absolute bottom-1.5 left-1.5 bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                          FREE
                        </div>
                      ) : (
                        <div className="absolute bottom-1.5 left-1.5 bg-white/90 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 md:p-3">
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      <div className="mt-1.5 space-y-1 text-[10px] md:text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{format(parseLocalDate(item.expiryDate), 'MMM dd')}</span>
                        </div>
                        {item.location?.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">{item.location.address.split(',')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'requested' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Found <span className="font-semibold">{requests.length}</span> requests within {radius} miles
              </p>
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="newest">Sort by Newest</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRequests.map((request) => (
                <div key={request._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.itemName}</h3>
                      <p className="text-sm text-gray-600">{request.quantity}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {request.category}
                    </span>
                  </div>

                  {request.notes && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{request.notes}</p>
                  )}

                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {request.approximateLocation || 'Nearby'}
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    Requested by <span className="font-medium">{request.user.name}</span>
                  </div>

                  {request.responses && request.responses.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        {request.responses.length} {request.responses.length === 1 ? 'person has' : 'people have'} responded
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/request/${request._id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/chat?receiverId=${request.user.id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Offer to Help
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {requests.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No requests found in this area</p>
                <p className="text-gray-400 mt-2">Try expanding your search radius</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
