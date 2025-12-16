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

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadUserAddress();
  }

  void _loadUserAddress() {
    final locationProvider = context.read<LocationProvider>();
    if (locationProvider.currentAddress != null) {
      _addressController.text = locationProvider.currentAddress!;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _quantityController.dispose();
    _addressController.dispose();
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one image')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    
    if (!_isFree && !auth.hasStripeAccount) {
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

    final itemsProvider = context.read<ItemsProvider>();
    final locationProvider = context.read<LocationProvider>();

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
      address: _addressController.text.trim(),
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
      zipCode: locationProvider.zipCode,
      isStoreItem: _isStoreItem,
      offersDelivery: _offersDelivery,
      deliveryFee: _offersDelivery ? _deliveryFee : null,
      validUntil: _validUntil,
      pickupTimeStart: _pickupTimeStart,
      pickupTimeEnd: _pickupTimeEnd,
    );

    if (!mounted) return;

    if (item != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item listed successfully!')),
      );
      Navigator.pop(context);
    } else {
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
                            const Icon(Icons.add_photo_alternate, size: 32),
                            Text(
                              '${_images.length}/${AppConfig.maxImagesPerItem}',
                              style: const TextStyle(fontSize: 12),
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
              items: AppConfig.itemCategories.map((category) {
                return DropdownMenuItem(value: category, child: Text(category));
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedCategory = value);
                }
              },
            ),
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
                          hintText: DateFormat('MMM d, yyyy').format(_expiryDate),
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
                  ),
                  ...AppConfig.deliveryFeePresets.map((fee) {
                    return ChoiceChip(
                      label: Text('\$$fee'),
                      selected: _deliveryFee == fee,
                      onSelected: (selected) {
                        setState(() => _deliveryFee = selected ? fee : null);
                      },
                    );
                  }),
                ],
              ),
              const SizedBox(height: 16),
            ],

            TextFormField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: 'Pickup Address',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.my_location),
                  onPressed: () async {
                    final locationProvider = context.read<LocationProvider>();
                    await locationProvider.getCurrentLocation();
                    if (locationProvider.currentAddress != null) {
                      _addressController.text = locationProvider.currentAddress!;
                    }
                  },
                ),
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
