import 'dart:developer' as developer;
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../providers/items_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/location_provider.dart';
import '../../services/places_service.dart';
import '../../widgets/common/loading_button.dart';

class AddItemScreen extends StatefulWidget {
  const AddItemScreen({super.key});

  @override
  State<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends State<AddItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _addressController = TextEditingController();
  final _tagController = TextEditingController();
  
  List<XFile> _images = [];
  String _selectedCategory = AppConfig.itemCategories.first;
  List<String> _selectedTags = [];
  DateTime _expiryDate = DateTime.now().add(const Duration(days: 7));
  bool _isFree = true;
  bool _isStoreItem = false;
  bool _offersDelivery = false;
  double? _deliveryFee;
  DateTime? _validUntil;
  String? _pickupTimeStart;
  String? _pickupTimeEnd;
  bool _isLocatingAddress = false;

  final ImagePicker _picker = ImagePicker();
  final PlacesService _placesService = PlacesService();
  
  List<PlacePrediction> _addressPredictions = [];
  bool _showAddressSuggestions = false;
  bool _isLoadingPredictions = false;
  PlaceDetails? _selectedPlaceDetails;
  double? _selectedLat;
  double? _selectedLng;
  String? _selectedZipCode;

  @override
  void initState() {
    super.initState();
    _loadUserAddress();
  }

  void _loadUserAddress() {
    final locationProvider = context.read<LocationProvider>();
    if (locationProvider.currentAddress != null) {
      _addressController.text = locationProvider.currentAddress!;
      _selectedLat = locationProvider.latitude;
      _selectedLng = locationProvider.longitude;
      _selectedZipCode = locationProvider.zipCode;
    }
    _addressController.addListener(_onAddressChanged);
  }

  void _onAddressChanged() {
    final query = _addressController.text;
    if (query.length >= 3 && _selectedPlaceDetails == null) {
      _fetchAddressPredictions(query);
    } else if (query.length < 3) {
      setState(() {
        _addressPredictions = [];
        _showAddressSuggestions = false;
      });
    }
  }

  Future<void> _fetchAddressPredictions(String query) async {
    if (_isLoadingPredictions) return;
    
    setState(() => _isLoadingPredictions = true);
    
    final predictions = await _placesService.getAutocompletePredictions(query);
    
    if (mounted) {
      setState(() {
        _addressPredictions = predictions;
        _showAddressSuggestions = predictions.isNotEmpty;
        _isLoadingPredictions = false;
      });
    }
  }

  Future<void> _selectAddressPrediction(PlacePrediction prediction) async {
    developer.log('[AddItemScreen] Selected prediction: ${prediction.description}');
    
    setState(() {
      _showAddressSuggestions = false;
      _isLoadingPredictions = true;
    });
    
    final details = await _placesService.getPlaceDetails(prediction.placeId);
    
    if (details != null && mounted) {
      setState(() {
        _addressController.text = details.formattedAddress;
        _selectedPlaceDetails = details;
        _selectedLat = details.latitude;
        _selectedLng = details.longitude;
        _selectedZipCode = details.zipCode;
        _isLoadingPredictions = false;
      });
      developer.log('[AddItemScreen] Selected address: ${details.formattedAddress} (${details.latitude}, ${details.longitude})');
    } else {
      setState(() {
        _addressController.text = prediction.description;
        _isLoadingPredictions = false;
      });
    }
  }

  @override
  void dispose() {
    _addressController.removeListener(_onAddressChanged);
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _quantityController.dispose();
    _addressController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_images.length >= AppConfig.maxImagesPerItem) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Maximum ${AppConfig.maxImagesPerItem} images allowed')),
      );
      return;
    }

    final remaining = AppConfig.maxImagesPerItem - _images.length;

    final images = await _picker.pickMultiImage(
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );

    if (images.isNotEmpty) {
      setState(() {
        _images.addAll(images.take(remaining));
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
    });
  }

  Future<void> _selectExpiryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _expiryDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      setState(() {
        _expiryDate = date;
      });
    }
  }

  Future<void> _selectValidUntil() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _validUntil ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      setState(() {
        _validUntil = date;
      });
    }
  }

  Future<void> _selectPickupTime() async {
    final startTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      helpText: 'Select pickup start time',
    );
    
    if (startTime != null && mounted) {
      final endTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay(
          hour: (startTime.hour + 2) % 24,
          minute: startTime.minute,
        ),
        helpText: 'Select pickup end time',
      );
      
      if (endTime != null) {
        setState(() {
          _pickupTimeStart = startTime.format(context);
          _pickupTimeEnd = endTime.format(context);
        });
      }
    }
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_selectedTags.contains(tag)) {
      setState(() {
        _selectedTags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _selectedTags.remove(tag);
    });
  }

  Future<void> _useCurrentLocation() async {
    developer.log('[AddItemScreen] _useCurrentLocation() called');
    setState(() => _isLocatingAddress = true);
    
    final locationProvider = context.read<LocationProvider>();
    developer.log('[AddItemScreen] Calling locationProvider.getCurrentLocation()...');
    final success = await locationProvider.getCurrentLocation();
    
    developer.log('[AddItemScreen] getCurrentLocation() returned: $success');
    developer.log('[AddItemScreen] Address: ${locationProvider.currentAddress}');
    developer.log('[AddItemScreen] Coordinates: ${locationProvider.latitude}, ${locationProvider.longitude}');
    developer.log('[AddItemScreen] Error: ${locationProvider.error}');
    
    setState(() => _isLocatingAddress = false);
    
    if (success && locationProvider.currentAddress != null) {
      setState(() {
        _addressController.removeListener(_onAddressChanged);
        _addressController.text = locationProvider.currentAddress!;
        _selectedLat = locationProvider.latitude;
        _selectedLng = locationProvider.longitude;
        _selectedZipCode = locationProvider.zipCode;
        _selectedPlaceDetails = null;
        _showAddressSuggestions = false;
        _addressPredictions = [];
        _addressController.addListener(_onAddressChanged);
      });
      developer.log('[AddItemScreen] Address field updated successfully');
    } else if (mounted) {
      final errorMsg = locationProvider.error ?? 'Could not get current location';
      developer.log('[AddItemScreen] Showing error: $errorMsg');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg)),
      );
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one image')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    
    if (!_isFree) {
      if (!auth.hasStripeAccount) {
        final goToOnboarding = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Stripe Account Required'),
            content: const Text(
              'To sell items, you need to set up a Stripe account to receive payments. Would you like to set it up now?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Set Up'),
              ),
            ],
          ),
        );

        if (goToOnboarding == true && mounted) {
          Navigator.pushNamed(context, AppRoutes.sellerOnboarding);
        }
        return;
      }
      
      final user = auth.user;
      if (user != null && !user.hasActiveStripeAccount) {
        final goToOnboarding = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Complete Stripe Setup'),
            content: const Text(
              'Your Stripe account setup is not complete. Please finish setting up your account to sell items.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Complete Setup'),
              ),
            ],
          ),
        );

        if (goToOnboarding == true && mounted) {
          Navigator.pushNamed(context, AppRoutes.sellerOnboarding);
        }
        return;
      }
    }

    final itemsProvider = context.read<ItemsProvider>();

    double? lat = _selectedLat;
    double? lng = _selectedLng;
    String? zip = _selectedZipCode;
    final address = _addressController.text.trim();

    developer.log('[AddItemScreen] Starting item submission');
    developer.log('[AddItemScreen] Selected location: lat=$lat, lng=$lng, zip=$zip');
    developer.log('[AddItemScreen] Address: $address');

    if ((lat == null || lng == null) && address.isNotEmpty) {
      developer.log('[AddItemScreen] No coordinates from selection, attempting to geocode address...');
      
      final details = await _placesService.geocodeAddress(address);
      
      if (details != null) {
        lat = details.latitude;
        lng = details.longitude;
        zip = details.zipCode ?? zip;
        developer.log('[AddItemScreen] Geocoded: lat=$lat, lng=$lng, zip=$zip');
      } else {
        developer.log('[AddItemScreen] Geocoding failed, submitting without coordinates');
      }
    }

    developer.log('[AddItemScreen] Submitting item with:');
    developer.log('[AddItemScreen] - title: ${_titleController.text.trim()}');
    developer.log('[AddItemScreen] - category: $_selectedCategory');
    developer.log('[AddItemScreen] - isFree: $_isFree, price: ${_priceController.text}');
    developer.log('[AddItemScreen] - images: ${_images.length}');
    developer.log('[AddItemScreen] - lat: $lat, lng: $lng');

    final item = await itemsProvider.createItem(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      imagePaths: _images.map((img) => img.path).toList(),
      category: _selectedCategory,
      tags: _selectedTags.isNotEmpty ? _selectedTags : null,
      quantity: int.parse(_quantityController.text),
      expiryDate: _expiryDate,
      isFree: _isFree,
      price: !_isFree ? double.parse(_priceController.text) : null,
      address: address,
      latitude: lat,
      longitude: lng,
      zipCode: zip,
      isStoreItem: _isStoreItem,
      offersDelivery: _offersDelivery,
      deliveryFee: _offersDelivery ? _deliveryFee : null,
      validUntil: _validUntil,
      pickupTimeStart: _pickupTimeStart,
      pickupTimeEnd: _pickupTimeEnd,
    );

    if (!mounted) return;

    if (item != null) {
      developer.log('[AddItemScreen] Item created successfully: ${item.id}');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item listed successfully!')),
      );
      Navigator.pop(context);
    } else {
      developer.log('[AddItemScreen] Item creation failed: ${itemsProvider.error}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(itemsProvider.error ?? 'Failed to list item'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Item'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Photos',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  ..._images.asMap().entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              File(entry.value.path),
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => _removeImage(entry.key),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  if (_images.length < AppConfig.maxImagesPerItem)
                    GestureDetector(
                      onTap: _pickImages,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: AppColors.divider,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate, size: 32, color: AppColors.textSecondary),
                            Text(
                              '${_images.length}/${AppConfig.maxImagesPerItem}',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                hintText: 'e.g., Fresh Organic Apples',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Describe the item condition, quantity, etc.',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a description';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(labelText: 'Category'),
              dropdownColor: AppColors.surface,
              style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
              items: AppConfig.itemCategories.map((category) {
                return DropdownMenuItem(
                  value: category, 
                  child: Text(category, style: TextStyle(color: AppColors.textPrimary)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedCategory = value);
                }
              },
            ),
            const SizedBox(height: 16),

            const Text(
              'Tags (optional)',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _tagController,
                    decoration: InputDecoration(
                      hintText: 'Add a tag...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onSubmitted: (_) => _addTag(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addTag,
                  icon: const Icon(Icons.add_circle),
                  color: AppColors.primary,
                ),
              ],
            ),
            if (_selectedTags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _selectedTags.map((tag) {
                  return Chip(
                    label: Text(tag),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => _removeTag(tag),
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    labelStyle: TextStyle(color: AppColors.primary),
                    deleteIconColor: AppColors.primary,
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity'),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      final qty = int.tryParse(value);
                      if (qty == null || qty < 1) {
                        return 'Invalid';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: GestureDetector(
                    onTap: _selectExpiryDate,
                    child: AbsorbPointer(
                      child: TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Expiry Date',
                          suffixIcon: const Icon(Icons.calendar_today),
                        ),
                        controller: TextEditingController(
                          text: DateFormat('MMM d, yyyy').format(_expiryDate),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            SwitchListTile(
              title: const Text('Free Item'),
              subtitle: const Text('Toggle off to set a price'),
              value: _isFree,
              onChanged: (value) {
                setState(() => _isFree = value);
              },
              activeColor: AppColors.primary,
              contentPadding: EdgeInsets.zero,
            ),

            if (!_isFree) ...[
              TextFormField(
                controller: _priceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Price',
                  prefixText: '\$ ',
                  hintText: 'Minimum \$3.00',
                ),
                validator: (value) {
                  if (!_isFree) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a price';
                    }
                    final price = double.tryParse(value);
                    if (price == null || price < AppConfig.minPaidItemPrice) {
                      return 'Minimum \$${AppConfig.minPaidItemPrice.toStringAsFixed(2)}';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.info.withOpacity(0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, size: 18, color: AppColors.info),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Minimum \$${AppConfig.minPaidItemPrice.toStringAsFixed(2)} for paid items.',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          if (!auth.hasStripeAccount)
                            GestureDetector(
                              onTap: () => Navigator.pushNamed(context, AppRoutes.sellerOnboarding),
                              child: const Text(
                                'Setup seller account to receive payments directly.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            )
                          else
                            Row(
                              children: [
                                const Icon(Icons.check_circle, size: 14, color: AppColors.success),
                                const SizedBox(width: 4),
                                const Text(
                                  'Seller account connected',
                                  style: TextStyle(fontSize: 13, color: AppColors.success),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            if (auth.isStoreOwner) ...[
              SwitchListTile(
                title: const Text('Store Item'),
                subtitle: const Text('List as a store product'),
                value: _isStoreItem,
                onChanged: (value) {
                  setState(() => _isStoreItem = value);
                },
                activeColor: AppColors.store,
                contentPadding: EdgeInsets.zero,
              ),
            ],

            SwitchListTile(
              title: const Text('Offer Delivery'),
              value: _offersDelivery,
              onChanged: (value) {
                setState(() => _offersDelivery = value);
              },
              activeColor: AppColors.primary,
              contentPadding: EdgeInsets.zero,
            ),

            if (_offersDelivery) ...[
              const Text(
                'Delivery Fee',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Free'),
                    selected: _deliveryFee == null,
                    onSelected: (selected) {
                      setState(() => _deliveryFee = null);
                    },
                    selectedColor: AppColors.primary.withOpacity(0.2),
                    labelStyle: TextStyle(
                      color: _deliveryFee == null ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  ...AppConfig.deliveryFeePresets.map((fee) {
                    return ChoiceChip(
                      label: Text('\$$fee'),
                      selected: _deliveryFee == fee,
                      onSelected: (selected) {
                        setState(() => _deliveryFee = selected ? fee : null);
                      },
                      selectedColor: AppColors.primary.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: _deliveryFee == fee ? AppColors.primary : AppColors.textPrimary,
                      ),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 16),
            ],

            const Divider(height: 32),
            const Text(
              'Listing Validity (optional)',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectValidUntil,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.event, color: AppColors.textMuted),
                    const SizedBox(width: 12),
                    Text(
                      _validUntil != null 
                          ? 'Valid until ${DateFormat('MMM d, yyyy').format(_validUntil!)}'
                          : 'Set listing expiration date',
                      style: TextStyle(
                        color: _validUntil != null ? AppColors.textPrimary : AppColors.textMuted,
                      ),
                    ),
                    const Spacer(),
                    if (_validUntil != null)
                      GestureDetector(
                        onTap: () => setState(() => _validUntil = null),
                        child: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'Flexible Pickup Time (optional)',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectPickupTime,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time, color: AppColors.textMuted),
                    const SizedBox(width: 12),
                    Text(
                      _pickupTimeStart != null && _pickupTimeEnd != null
                          ? '$_pickupTimeStart - $_pickupTimeEnd'
                          : 'Set preferred pickup hours',
                      style: TextStyle(
                        color: _pickupTimeStart != null ? AppColors.textPrimary : AppColors.textMuted,
                      ),
                    ),
                    const Spacer(),
                    if (_pickupTimeStart != null)
                      GestureDetector(
                        onTap: () => setState(() {
                          _pickupTimeStart = null;
                          _pickupTimeEnd = null;
                        }),
                        child: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
                      ),
                  ],
                ),
              ),
            ),
            const Divider(height: 32),

            const Text(
              'Pickup Location',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 8),
            
            Container(
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: (_selectedLat != null && _selectedLng != null)
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.location_on, size: 28, color: AppColors.primary),
                          const SizedBox(height: 4),
                          Text(
                            'Location set',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              _addressController.text.isNotEmpty 
                                  ? _addressController.text
                                  : '${_selectedLat!.toStringAsFixed(4)}, ${_selectedLng!.toStringAsFixed(4)}',
                              style: const TextStyle(fontSize: 11),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    )
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.map_outlined, size: 28, color: AppColors.textMuted),
                          const SizedBox(height: 4),
                          Text(
                            'Set your pickup location below',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 12),
            
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _addressController,
                  decoration: InputDecoration(
                    labelText: 'Pickup Address',
                    hintText: 'Start typing to see suggestions...',
                    suffixIcon: _isLocatingAddress || _isLoadingPredictions
                        ? const SizedBox(
                            width: 24, 
                            height: 24, 
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : (_addressController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: () {
                                  setState(() {
                                    _addressController.removeListener(_onAddressChanged);
                                    _addressController.clear();
                                    _selectedLat = null;
                                    _selectedLng = null;
                                    _selectedZipCode = null;
                                    _selectedPlaceDetails = null;
                                    _showAddressSuggestions = false;
                                    _addressPredictions = [];
                                    _addressController.addListener(_onAddressChanged);
                                  });
                                },
                              )
                            : null),
                  ),
                  onTap: () {
                    if (_addressController.text.length >= 3) {
                      _fetchAddressPredictions(_addressController.text);
                    }
                  },
                  onChanged: (value) {
                    if (_selectedPlaceDetails != null) {
                      setState(() {
                        _selectedPlaceDetails = null;
                        _selectedLat = null;
                        _selectedLng = null;
                        _selectedZipCode = null;
                      });
                    }
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a pickup address';
                    }
                    return null;
                  },
                ),
                if (_showAddressSuggestions && _addressPredictions.isNotEmpty)
                  Container(
                    constraints: const BoxConstraints(maxHeight: 200),
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      itemCount: _addressPredictions.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final prediction = _addressPredictions[index];
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on_outlined, size: 20),
                          title: Text(
                            prediction.mainText,
                            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                          ),
                          subtitle: Text(
                            prediction.secondaryText,
                            style: const TextStyle(fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          onTap: () => _selectAddressPrediction(prediction),
                        );
                      },
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _isLocatingAddress ? null : _useCurrentLocation,
              icon: _isLocatingAddress 
                  ? const SizedBox(
                      width: 16, 
                      height: 16, 
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location),
              label: Text(_isLocatingAddress ? 'Getting location...' : 'Use Current Location'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 32),

            Consumer<ItemsProvider>(
              builder: (context, provider, _) {
                return LoadingButton(
                  onPressed: _submit,
                  isLoading: provider.isLoading,
                  label: 'List Item',
                );
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
