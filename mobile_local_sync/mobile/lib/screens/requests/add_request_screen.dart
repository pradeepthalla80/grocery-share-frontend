import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/app_config.dart';
import '../../providers/requests_provider.dart';
import '../../providers/location_provider.dart';
import '../../services/places_service.dart';
import '../../widgets/common/loading_button.dart';

class AddRequestScreen extends StatefulWidget {
  const AddRequestScreen({super.key});

  @override
  State<AddRequestScreen> createState() => _AddRequestScreenState();
}

class _AddRequestScreenState extends State<AddRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _maxPriceController = TextEditingController();
  final _addressController = TextEditingController();
  final _addressFocusNode = FocusNode();

  String _selectedCategory = AppConfig.itemCategories.first;
  String _pricePreference = 'any';
  String _validityPeriod = 'never';
  
  final PlacesService _placesService = PlacesService();
  List<PlacePrediction> _addressPredictions = [];
  bool _showAddressSuggestions = false;
  bool _isLoadingPredictions = false;
  bool _isLocatingAddress = false;
  bool _isSettingFromCurrentLocation = false;
  bool _addressListenersAttached = false;
  
  PlaceDetails? _selectedPlaceDetails;
  double? _selectedLat;
  double? _selectedLng;
  String? _selectedZipCode;

  static const List<Map<String, String>> _validityOptions = [
    {'value': 'never', 'label': 'Never expires'},
    {'value': '1d', 'label': '1 Day'},
    {'value': '3d', 'label': '3 Days'},
    {'value': '7d', 'label': '1 Week'},
    {'value': '14d', 'label': '2 Weeks'},
    {'value': '30d', 'label': '1 Month'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setupAddressListeners();
      _loadUserAddress();
    });
  }

  void _loadUserAddress() {
    final locationProvider = context.read<LocationProvider>();
    if (_selectedLat == null &&
        _selectedLng == null &&
        locationProvider.currentAddress != null) {
      setState(() {
        _addressController.text = locationProvider.currentAddress!;
        _selectedLat = locationProvider.latitude;
        _selectedLng = locationProvider.longitude;
        _selectedZipCode = locationProvider.zipCode;
      });
      developer.log('[AddRequestScreen] Loaded initial address');
    }
  }

  void _setupAddressListeners() {
    if (_addressListenersAttached) return;
    _addressController.addListener(_onAddressChanged);
    _addressFocusNode.addListener(_onAddressFocusChanged);
    _addressListenersAttached = true;
  }

  void _onAddressFocusChanged() {
    if (!_addressFocusNode.hasFocus) {
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted && !_addressFocusNode.hasFocus) {
          setState(() => _showAddressSuggestions = false);
        }
      });
    }
  }

  void _onAddressChanged() {
    if (_isSettingFromCurrentLocation) return;

    final query = _addressController.text.trim();

    if (_selectedPlaceDetails != null &&
        query != _selectedPlaceDetails!.formattedAddress) {
      setState(() {
        _selectedPlaceDetails = null;
        _selectedLat = null;
        _selectedLng = null;
        _selectedZipCode = null;
      });
    }

    if (query.length >= 3 &&
        _selectedPlaceDetails == null &&
        !_isLocatingAddress) {
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

    if (!mounted) return;

    if (_addressFocusNode.hasFocus) {
      setState(() {
        _addressPredictions = predictions;
        _showAddressSuggestions = predictions.isNotEmpty;
        _isLoadingPredictions = false;
      });
    } else {
      setState(() => _isLoadingPredictions = false);
    }
  }

  Future<void> _selectAddressPrediction(PlacePrediction prediction) async {
    setState(() {
      _showAddressSuggestions = false;
      _isLoadingPredictions = true;
    });

    final details = await _placesService.getPlaceDetails(prediction.placeId);

    if (details != null && mounted) {
      _addressController.removeListener(_onAddressChanged);
      setState(() {
        _selectedPlaceDetails = details;
        _selectedLat = details.latitude;
        _selectedLng = details.longitude;
        _selectedZipCode = details.zipCode;
        _addressController.text = details.formattedAddress;
        _addressPredictions = [];
        _isLoadingPredictions = false;
      });
      _addressController.addListener(_onAddressChanged);
    } else {
      _addressController.removeListener(_onAddressChanged);
      setState(() {
        _addressController.text = prediction.description;
        _isLoadingPredictions = false;
      });
      _addressController.addListener(_onAddressChanged);
    }
  }

  Future<void> _useCurrentLocation() async {
    _isSettingFromCurrentLocation = true;

    final locationProvider = context.read<LocationProvider>();

    if (locationProvider.isPermissionDeniedForever) {
      await locationProvider.openAppSettings();
      _isSettingFromCurrentLocation = false;
      return;
    }

    setState(() => _isLocatingAddress = true);

    final success = await locationProvider.getCurrentLocation();

    setState(() => _isLocatingAddress = false);

    if (!success ||
        locationProvider.latitude == null ||
        locationProvider.longitude == null ||
        locationProvider.currentAddress == null) {
      _isSettingFromCurrentLocation = false;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              locationProvider.error ?? 'Could not get current location',
            ),
          ),
        );
      }
      return;
    }

    _addressController.removeListener(_onAddressChanged);

    setState(() {
      _addressController.text = locationProvider.currentAddress!;
      _selectedLat = locationProvider.latitude;
      _selectedLng = locationProvider.longitude;
      _selectedZipCode = locationProvider.zipCode;
      _selectedPlaceDetails = null;
      _addressPredictions = [];
      _showAddressSuggestions = false;
    });

    _addressController.addListener(_onAddressChanged);
    _isSettingFromCurrentLocation = false;
  }

  DateTime? _getValidUntilDate() {
    final now = DateTime.now();
    switch (_validityPeriod) {
      case '1d':
        return now.add(const Duration(days: 1));
      case '3d':
        return now.add(const Duration(days: 3));
      case '7d':
        return now.add(const Duration(days: 7));
      case '14d':
        return now.add(const Duration(days: 14));
      case '30d':
        return now.add(const Duration(days: 30));
      case 'never':
      default:
        return null;
    }
  }

  @override
  void dispose() {
    _addressController.removeListener(_onAddressChanged);
    _addressFocusNode.removeListener(_onAddressFocusChanged);
    _addressFocusNode.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _quantityController.dispose();
    _maxPriceController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedLat == null || _selectedLng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a location from suggestions or use Current Location.'),
        ),
      );
      return;
    }

    final requestsProvider = context.read<RequestsProvider>();

    final validUntil = _getValidUntilDate();

    final request = await requestsProvider.createRequest(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      category: _selectedCategory,
      quantity: int.parse(_quantityController.text),
      pricePreference: _pricePreference,
      maxPrice: _pricePreference == 'paid' && _maxPriceController.text.isNotEmpty
          ? double.parse(_maxPriceController.text)
          : null,
      address: _addressController.text.trim(),
      latitude: _selectedLat,
      longitude: _selectedLng,
      zipCode: _selectedZipCode,
      validUntil: validUntil,
    );

    if (!mounted) return;

    if (request != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Request posted successfully!')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(requestsProvider.error ?? 'Failed to post request'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Request'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Item Name',
                hintText: 'e.g., Fresh Milk, Eggs',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter what you need';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _quantityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Quantity',
                hintText: 'How many do you need?',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Required';
                }
                final qty = int.tryParse(value);
                if (qty == null || qty < 1) {
                  return 'Invalid quantity';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(labelText: 'Category'),
              items: AppConfig.itemCategories.map((category) {
                return DropdownMenuItem(value: category, child: Text(category));
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedCategory = value);
                }
              },
            ),
            const SizedBox(height: 24),

            const Text(
              'Location',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
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
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 12),

            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _addressController,
                  focusNode: _addressFocusNode,
                  decoration: InputDecoration(
                    labelText: 'Address',
                    hintText: _placesService.isConfigured
                        ? 'Start typing to see suggestions...'
                        : 'Enter your address',
                    helperText: !_placesService.isConfigured
                        ? 'Address autocomplete unavailable (API key not configured)'
                        : null,
                    helperStyle: const TextStyle(color: Colors.orange, fontSize: 11),
                    suffixIcon: _isLoadingPredictions || _isLocatingAddress
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : (_selectedLat != null
                            ? const Icon(Icons.check_circle, color: Colors.green)
                            : null),
                  ),
                  onTap: () {
                    if (_addressController.text.length >= 3 && _selectedPlaceDetails == null) {
                      _fetchAddressPredictions(_addressController.text);
                    }
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter an address';
                    }
                    return null;
                  },
                ),

                if (_showAddressSuggestions && _addressPredictions.isNotEmpty)
                  Material(
                    elevation: 4,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      constraints: const BoxConstraints(maxHeight: 200),
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
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
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            subtitle: Text(
                              prediction.secondaryText,
                              style: const TextStyle(fontSize: 12),
                            ),
                            onTap: () => _selectAddressPrediction(prediction),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),

            const Text(
              'Payment Preference',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Any'),
                  selected: _pricePreference == 'any',
                  onSelected: (selected) {
                    setState(() => _pricePreference = 'any');
                  },
                ),
                ChoiceChip(
                  label: const Text('Free Only'),
                  selected: _pricePreference == 'free',
                  onSelected: (selected) {
                    setState(() => _pricePreference = 'free');
                  },
                ),
                ChoiceChip(
                  label: const Text('Willing to Pay'),
                  selected: _pricePreference == 'paid',
                  onSelected: (selected) {
                    setState(() => _pricePreference = 'paid');
                  },
                ),
              ],
            ),

            if (_pricePreference == 'paid') ...[
              const SizedBox(height: 16),
              TextFormField(
                controller: _maxPriceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Maximum Price (optional)',
                  prefixText: '\$ ',
                ),
              ),
            ],
            const SizedBox(height: 24),

            DropdownButtonFormField<String>(
              value: _validityPeriod,
              decoration: const InputDecoration(
                labelText: 'Request Validity Period',
              ),
              items: _validityOptions.map((option) {
                return DropdownMenuItem(
                  value: option['value'],
                  child: Text(option['label']!),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _validityPeriod = value);
                }
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                hintText: 'Add details about brand preferences, quantity, etc.',
              ),
            ),
            const SizedBox(height: 32),

            Consumer<RequestsProvider>(
              builder: (context, provider, _) {
                return LoadingButton(
                  onPressed: _submit,
                  isLoading: provider.isLoading,
                  label: 'Post Request',
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
