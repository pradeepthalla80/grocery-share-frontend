/**
 * Legacy Data Migration Script
 * Run once to fix old Item records with invalid enum values
 * 
 * Usage:
 * 1. Upload this file to your backend root directory
 * 2. SSH into Render or run locally: node migrate_legacy_data.js
 * 3. Delete this file after successful migration
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

async function migrateLegacyData() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database');

    // Get direct access to Item collection (bypass schema validation)
    const db = mongoose.connection.db;
    const itemsCollection = db.collection('items');

    console.log('\n📊 Checking for items with legacy values...\n');

    // Fix 1: Update status 'picked_up' → 'completed'
    const statusResult = await itemsCollection.updateMany(
      { status: 'picked_up' },
      { $set: { status: 'completed' } }
    );
    console.log(`✅ Updated ${statusResult.modifiedCount} items with status 'picked_up' → 'completed'`);

    // Fix 2: Update category 'Spices' → 'Oils & Spices'
    const spicesResult = await itemsCollection.updateMany(
      { category: 'Spices' },
      { $set: { category: 'Oils & Spices' } }
    );
    console.log(`✅ Updated ${spicesResult.modifiedCount} items with category 'Spices' → 'Oils & Spices'`);

    // Fix 3: Update category 'milk' → 'Dairy'
    const milkResult = await itemsCollection.updateMany(
      { category: 'milk' },
      { $set: { category: 'Dairy' } }
    );
    console.log(`✅ Updated ${milkResult.modifiedCount} items with category 'milk' → 'Dairy'`);

    // Fix 4: Update other common legacy categories (add more as needed)
    const categoryMappings = [
      { old: 'Meat & Poultry', new: 'Meat' },
      { old: 'Bread', new: 'Bakery' },
      { old: 'Cheese', new: 'Dairy' },
      { old: 'Yogurt', new: 'Dairy' },
      { old: 'Spices', new: 'Oils & Spices' },
      { old: 'spices', new: 'Oils & Spices' }
    ];

    for (const mapping of categoryMappings) {
      const result = await itemsCollection.updateMany(
        { category: mapping.old },
        { $set: { category: mapping.new } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} items with category '${mapping.old}' → '${mapping.new}'`);
      }
    }

    // Verify: Check for any remaining invalid values
    console.log('\n🔍 Verifying migration...\n');
    
    const validStatuses = ['available', 'sold', 'refunded', 'expired', 'awaiting_pickup', 'completed'];
    const invalidStatusCount = await itemsCollection.countDocuments({
      status: { $nin: validStatuses }
    });
    
    if (invalidStatusCount > 0) {
      console.warn(`⚠️  Warning: ${invalidStatusCount} items still have invalid status values`);
      const invalidItems = await itemsCollection.find(
        { status: { $nin: validStatuses } },
        { projection: { _id: 1, name: 1, status: 1 } }
      ).limit(5).toArray();
      console.log('Sample invalid items:', invalidItems);
    } else {
      console.log('✅ All item statuses are valid');
    }

    const validCategories = [
      'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Snacks', 
      'Beverages', 'Pantry', 'Oils & Spices', 'Condiments & Sauces',
      'Frozen Foods', 'Canned Goods', 'Grains & Pasta', 'Seafood',
      'Desserts', 'Baby Food', 'Pet Food', 'Other'
    ];
    
    const invalidCategoryCount = await itemsCollection.countDocuments({
      category: { $nin: validCategories }
    });
    
    if (invalidCategoryCount > 0) {
      console.warn(`⚠️  Warning: ${invalidCategoryCount} items have invalid categories`);
      const invalidItems = await itemsCollection.find(
        { category: { $nin: validCategories } },
        { projection: { _id: 1, name: 1, category: 1 } }
      ).limit(10).toArray();
      console.log('Sample invalid categories:', invalidItems);
      console.log('\n💡 Tip: Add these categories to the mapping above and run again');
    } else {
      console.log('✅ All item categories are valid');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Status updates: ${statusResult.modifiedCount}`);
    console.log(`   - Category updates: ${spicesResult.modifiedCount + milkResult.modifiedCount}`);
    console.log(`   - Total items migrated: ${statusResult.modifiedCount + spicesResult.modifiedCount + milkResult.modifiedCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateLegacyData();
