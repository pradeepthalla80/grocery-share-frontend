import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/app_config.dart';
import '../../providers/requests_provider.dart';
import '../../providers/location_provider.dart';
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

  String _selectedCategory = AppConfig.itemCategories.first;
  String _pricePreference = 'any';
  DateTime _validUntil = DateTime.now().add(const Duration(days: 7));

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
    _quantityController.dispose();
    _maxPriceController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _selectValidUntil() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _validUntil,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );

    if (date != null) {
      setState(() {
        _validUntil = date;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final requestsProvider = context.read<RequestsProvider>();
    final locationProvider = context.read<LocationProvider>();
    final coords = locationProvider.coordinates;

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
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      zipCode: locationProvider.zipCode,
      validUntil: _validUntil,
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
        title: const Text('Post Request'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'What do you need?',
                hintText: 'e.g., Fresh Milk',
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
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Add details about brand preferences, quantity, etc.',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please add a description';
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
                    onTap: _selectValidUntil,
                    child: AbsorbPointer(
                      child: TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Valid Until',
                          suffixIcon: const Icon(Icons.calendar_today),
                        ),
                        controller: TextEditingController(
                          text: DateFormat('MMM d, yyyy').format(_validUntil),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            const Text(
              'Price Preference',
              style: TextStyle(fontWeight: FontWeight.w600),
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
            const SizedBox(height: 16),

            TextFormField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: 'Your Location',
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
