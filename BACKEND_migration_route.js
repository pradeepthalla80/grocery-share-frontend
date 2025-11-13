/**
 * ONE-TIME MIGRATION ENDPOINT
 * 
 * INSTRUCTIONS:
 * 1. Add this file to your backend as: routes/migration.js
 * 2. Add to index.js: app.use('/api/v1/admin', require('./routes/migration'));
 * 3. Deploy to Render
 * 4. Visit: https://grocery-share-backend.onrender.com/api/v1/admin/migrate-legacy-data
 * 5. Wait for response showing migration results
 * 6. DELETE this file and the route from index.js after successful migration
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ONE-TIME MIGRATION ENDPOINT
router.get('/migrate-legacy-data', async (req, res) => {
  try {
    console.log('🔧 Starting legacy data migration...');

    // Get direct access to Item collection (bypass schema validation)
    const db = mongoose.connection.db;
    const itemsCollection = db.collection('items');

    const results = {
      statusUpdates: 0,
      spicesUpdates: 0,
      milkUpdates: 0,
      spiceUpdates: 0,
      otherCategoryUpdates: 0,
      errors: []
    };

    // Fix 1: Update status 'picked_up' → 'completed'
    try {
      const statusResult = await itemsCollection.updateMany(
        { status: 'picked_up' },
        { $set: { status: 'completed' } }
      );
      results.statusUpdates = statusResult.modifiedCount;
      console.log(`✅ Updated ${statusResult.modifiedCount} items with status 'picked_up' → 'completed'`);
    } catch (err) {
      results.errors.push(`Status update failed: ${err.message}`);
    }

    // Fix 2: Update category 'Spices' → 'Oils & Spices'
    try {
      const spicesResult = await itemsCollection.updateMany(
        { category: 'Spices' },
        { $set: { category: 'Oils & Spices' } }
      );
      results.spicesUpdates = spicesResult.modifiedCount;
      console.log(`✅ Updated ${spicesResult.modifiedCount} items with category 'Spices' → 'Oils & Spices'`);
    } catch (err) {
      results.errors.push(`Spices update failed: ${err.message}`);
    }

    // Fix 3: Update category 'milk' → 'Dairy'
    try {
      const milkResult = await itemsCollection.updateMany(
        { category: 'milk' },
        { $set: { category: 'Dairy' } }
      );
      results.milkUpdates = milkResult.modifiedCount;
      console.log(`✅ Updated ${milkResult.modifiedCount} items with category 'milk' → 'Dairy'`);
    } catch (err) {
      results.errors.push(`Milk update failed: ${err.message}`);
    }

    // Fix 4: Update category 'Spice' → 'Oils & Spices'
    try {
      const spiceResult = await itemsCollection.updateMany(
        { category: 'Spice' },
        { $set: { category: 'Oils & Spices' } }
      );
      results.spiceUpdates = spiceResult.modifiedCount;
      console.log(`✅ Updated ${spiceResult.modifiedCount} items with category 'Spice' → 'Oils & Spices'`);
    } catch (err) {
      results.errors.push(`Spice update failed: ${err.message}`);
    }

    // Fix 5: Update other common legacy categories
    const categoryMappings = [
      { old: 'Meat & Poultry', new: 'Meat' },
      { old: 'Bread', new: 'Bakery' },
      { old: 'Cheese', new: 'Dairy' },
      { old: 'Yogurt', new: 'Dairy' },
      { old: 'spices', new: 'Oils & Spices' }
    ];

    for (const mapping of categoryMappings) {
      try {
        const result = await itemsCollection.updateMany(
          { category: mapping.old },
          { $set: { category: mapping.new } }
        );
        if (result.modifiedCount > 0) {
          results.otherCategoryUpdates += result.modifiedCount;
          console.log(`✅ Updated ${result.modifiedCount} items with category '${mapping.old}' → '${mapping.new}'`);
        }
      } catch (err) {
        results.errors.push(`${mapping.old} update failed: ${err.message}`);
      }
    }

    // Verify: Check for remaining invalid values
    const validStatuses = ['available', 'sold', 'refunded', 'expired', 'awaiting_pickup', 'completed'];
    const invalidStatusCount = await itemsCollection.countDocuments({
      status: { $nin: validStatuses }
    });

    const validCategories = [
      'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Snacks', 
      'Beverages', 'Pantry', 'Oils & Spices', 'Condiments & Sauces',
      'Frozen Foods', 'Canned Goods', 'Grains & Pasta', 'Seafood',
      'Desserts', 'Baby Food', 'Pet Food', 'Other'
    ];
    
    const invalidCategoryCount = await itemsCollection.countDocuments({
      category: { $nin: validCategories }
    });

    const totalUpdates = results.statusUpdates + results.spicesUpdates + 
                        results.milkUpdates + results.spiceUpdates + 
                        results.otherCategoryUpdates;

    console.log('✅ Migration completed successfully!');

    res.json({
      success: true,
      message: 'Legacy data migration completed',
      results: {
        totalItemsUpdated: totalUpdates,
        statusUpdates: results.statusUpdates,
        categoryUpdates: {
          spices: results.spicesUpdates,
          milk: results.milkUpdates,
          spice: results.spiceUpdates,
          other: results.otherCategoryUpdates
        },
        validation: {
          remainingInvalidStatuses: invalidStatusCount,
          remainingInvalidCategories: invalidCategoryCount
        },
        errors: results.errors.length > 0 ? results.errors : null
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
});

module.exports = router;
