class AppConfig {
  static const String appName = 'BaskMate';
  static const String appTagline = 'Your Emergency Pantry Next Door';
  
  static const String apiBaseUrl = 'https://grocery-share-backend.onrender.com/api/v1';
  
  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: '',
  );
  
  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '',
  );
  
  static const int defaultSearchRadius = 10;
  static const int maxSearchRadius = 50;
  
  static const int maxImagesPerItem = 5;
  static const double minPaidItemPrice = 3.0;
  
  static const int chatPollingInterval = 3;
  static const int notificationPollingInterval = 5;
  
  static const double platformFeePercent = 10.0;
  
  static const List<String> itemCategories = [
    'Fruits & Vegetables',
    'Dairy & Eggs',
    'Meat & Seafood',
    'Bakery',
    'Pantry Staples',
    'Snacks',
    'Beverages',
    'Frozen Foods',
    'Condiments & Sauces',
    'Baby & Kids',
    'Pet Food',
    'Other',
  ];
  
  static const List<String> itemTags = [
    'Organic',
    'Gluten-Free',
    'Vegan',
    'Vegetarian',
    'Halal',
    'Kosher',
    'Low-Sugar',
    'Keto',
    'Non-GMO',
  ];
  
  static const List<double> deliveryFeePresets = [1.0, 2.0, 3.0, 4.0, 5.0];
}
