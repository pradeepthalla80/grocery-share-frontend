import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../config/app_config.dart';
import '../../providers/items_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/location_provider.dart';
import '../../models/item.dart';
import '../../widgets/common/loading_button.dart';

class EditItemScreen extends StatefulWidget {
  final String itemId;

  const EditItemScreen({super.key, required this.itemId});

  @override
  State<EditItemScreen> createState() => _EditItemScreenState();
}

class _EditItemScreenState extends State<EditItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _quantityController = TextEditingController();
  final _addressController = TextEditingController();
  final _tagController = TextEditingController();

  List<String> _existingImages = [];
  List<XFile> _newImages = [];
  String _selectedCategory = AppConfig.itemCategories.first;
  List<String> _selectedTags = [];
  DateTime _expiryDate = DateTime.now().add(const Duration(days: 7));
  bool _isFree = true;
  bool _isStoreItem = false;
  bool _offersDelivery = false;
  double? _deliveryFee;
  String? _pickupTimeStart;
  String? _pickupTimeEnd;
  bool _isLocatingAddress = false;
  bool _isInitialized = false;
  bool _isSubmitting = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadItem();
  }

  Future<void> _loadItem() async {
    final provider = context.read<ItemsProvider>();
    await provider.fetchItem(widget.itemId);
    
    if (!mounted) return;
    
    final item = provider.currentItem;
    if (item != null) {
      _populateForm(item);
    }
  }

  void _populateForm(Item item) {
    setState(() {
      _titleController.text = item.title;
      _descriptionController.text = item.description;
      _quantityController.text = item.quantity.toString();
      _addressController.text = item.address ?? '';
      _existingImages = List<String>.from(item.images);
      _selectedCategory = item.category;
      _selectedTags = List<String>.from(item.tags);
      _expiryDate = item.expiryDate;
      _isFree = item.isFree;
      if (!item.isFree && item.price != null) {
        _priceController.text = item.price!.toStringAsFixed(2);
      }
      _isStoreItem = item.isStoreItem;
      _offersDelivery = item.offersDelivery;
      _deliveryFee = item.deliveryFee;
      _pickupTimeStart = item.pickupTimeStart;
      _pickupTimeEnd = item.pickupTimeEnd;
      _isInitialized = true;
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _quantityController.dispose();
    _addressController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final totalImages = _existingImages.length + _newImages.length;
    if (totalImages >= AppConfig.maxImagesPerItem) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Maximum ${AppConfig.maxImagesPerItem} images allowed')),
      );
      return;
    }

    final images = await _picker.pickMultiImage(
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 80,
    );

    if (images.isNotEmpty) {
      final remaining = AppConfig.maxImagesPerItem - totalImages;
      setState(() {
        _newImages.addAll(images.take(remaining));
      });
    }
  }

  void _removeExistingImage(int index) {
    setState(() {
      _existingImages.removeAt(index);
    });
  }

  void _removeNewImage(int index) {
    setState(() {
      _newImages.removeAt(index);
    });
  }

  void _addTag(String tag) {
    final trimmed = tag.trim();
    if (trimmed.isNotEmpty && !_selectedTags.contains(trimmed)) {
      setState(() {
        _selectedTags.add(trimmed);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _selectedTags.remove(tag);
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
      setState(() => _expiryDate = date);
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocatingAddress = true);

    final locationProvider = context.read<LocationProvider>();
    final success = await locationProvider.getCurrentLocation();

    if (!mounted) return;

    setState(() => _isLocatingAddress = false);

    if (success && locationProvider.currentAddress != null) {
      _addressController.text = locationProvider.currentAddress!;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(locationProvider.error ?? 'Could not get location'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_existingImages.isEmpty && _newImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one image')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final locationProvider = context.read<LocationProvider>();
    final itemsProvider = context.read<ItemsProvider>();

    final updateData = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'category': _selectedCategory,
      'tags': _selectedTags,
      'quantity': int.parse(_quantityController.text),
      'expiryDate': _expiryDate.toIso8601String(),
      'isFree': _isFree,
      'address': _addressController.text.trim(),
      'isStoreItem': _isStoreItem,
      'offersDelivery': _offersDelivery,
      'existingImages': _existingImages,
    };

    if (!_isFree) {
      updateData['price'] = double.parse(_priceController.text);
    }

    if (_offersDelivery && _deliveryFee != null) {
      updateData['deliveryFee'] = _deliveryFee;
    }

    if (_pickupTimeStart != null) {
      updateData['pickupTimeStart'] = _pickupTimeStart;
    }
    if (_pickupTimeEnd != null) {
      updateData['pickupTimeEnd'] = _pickupTimeEnd;
    }

    final coords = locationProvider.coordinates;
    if (coords != null) {
      updateData['latitude'] = coords.latitude;
      updateData['longitude'] = coords.longitude;
    }

    final success = await itemsProvider.updateItem(
      widget.itemId,
      updateData,
      newImages: _newImages,
    );

    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Item updated successfully'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(itemsProvider.error ?? 'Failed to update item'),
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
        title: const Text('Edit Item'),
      ),
      body: Consumer<ItemsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && !_isInitialized) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.currentItem == null && !_isInitialized) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: AppColors.error),
                  const SizedBox(height: 16),
                  const Text('Item not found'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Go Back'),
                  ),
                ],
              ),
            );
          }

          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Images',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 100,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        ..._existingImages.asMap().entries.map((entry) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: entry.value,
                                    width: 100,
                                    height: 100,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => Container(
                                      color: AppColors.divider,
                                      child: const Center(
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () => _removeExistingImage(entry.key),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        size: 14,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        ..._newImages.asMap().entries.map((entry) {
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
                                    onTap: () => _removeNewImage(entry.key),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        size: 14,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        if (_existingImages.length + _newImages.length < AppConfig.maxImagesPerItem)
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
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_photo_alternate, size: 32, color: AppColors.textMuted),
                                  SizedBox(height: 4),
                                  Text('Add', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Title'),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a title';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    maxLines: 3,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a description';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: AppConfig.itemCategories
                        .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                        .toList(),
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
                        child: TextField(
                          controller: _tagController,
                          decoration: const InputDecoration(
                            labelText: 'Tags',
                            hintText: 'Add a tag',
                          ),
                          onSubmitted: _addTag,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: () => _addTag(_tagController.text),
                      ),
                    ],
                  ),
                  if (_selectedTags.isNotEmpty)
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
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _quantityController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Quantity'),
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Required';
                            final qty = int.tryParse(value);
                            if (qty == null || qty < 1) return 'Invalid';
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
                              decoration: const InputDecoration(
                                labelText: 'Expiry Date',
                                suffixIcon: Icon(Icons.calendar_today),
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
                    onChanged: (value) => setState(() => _isFree = value),
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
                      onChanged: (value) => setState(() => _isStoreItem = value),
                      activeColor: AppColors.store,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],

                  SwitchListTile(
                    title: const Text('Offer Delivery'),
                    value: _offersDelivery,
                    onChanged: (value) => setState(() => _offersDelivery = value),
                    activeColor: AppColors.primary,
                    contentPadding: EdgeInsets.zero,
                  ),

                  const Divider(height: 32),

                  const Text(
                    'Pickup Location',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                  ),
                  const SizedBox(height: 12),

                  TextFormField(
                    controller: _addressController,
                    decoration: InputDecoration(
                      labelText: 'Pickup Address',
                      hintText: 'Enter your pickup address',
                      suffixIcon: _isLocatingAddress
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            )
                          : null,
                    ),
                    maxLines: 2,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter a pickup address';
                      }
                      return null;
                    },
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

                  LoadingButton(
                    onPressed: _submit,
                    isLoading: _isSubmitting,
                    label: 'Update Item',
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
