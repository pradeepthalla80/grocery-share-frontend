/**
 * FINAL MIGRATION ENDPOINT - Handles NULL values
 * 
 * Save this file as: routes/migration.js (REPLACE existing)
 * 
 * After successful migration, DELETE this file and remove the route from index.js
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// DIAGNOSTIC ENDPOINT - View all invalid values
router.get('/check-invalid-data', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const itemsCollection = db.collection('items');

    const validStatuses = ['available', 'sold', 'refunded', 'expired', 'awaiting_pickup', 'completed'];
    const validCategories = [
      'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Snacks', 
      'Beverages', 'Pantry', 'Oils & Spices', 'Condiments & Sauces',
      'Frozen Foods', 'Canned Goods', 'Grains & Pasta', 'Seafood',
      'Desserts', 'Baby Food', 'Pet Food', 'Other'
    ];

    // Find all items with invalid statuses (including null)
    const invalidStatusItems = await itemsCollection.find({
      $or: [
        { status: { $nin: validStatuses } },
        { status: null },
        { status: { $exists: false } }
      ]
    }).project({ _id: 1, title: 1, status: 1 }).toArray();

    // Find all items with invalid categories (including null)
    const invalidCategoryItems = await itemsCollection.find({
      $or: [
        { category: { $nin: validCategories } },
        { category: null },
        { category: { $exists: false } }
      ]
    }).project({ _id: 1, title: 1, category: 1 }).toArray();

    // Get unique invalid values
    const uniqueInvalidStatuses = [...new Set(invalidStatusItems.map(item => item.status))];
    const uniqueInvalidCategories = [...new Set(invalidCategoryItems.map(item => item.category))];

    res.json({
      success: true,
      invalidStatuses: {
        count: invalidStatusItems.length,
        uniqueValues: uniqueInvalidStatuses,
        items: invalidStatusItems
      },
      invalidCategories: {
        count: invalidCategoryItems.length,
        uniqueValues: uniqueInvalidCategories,
        items: invalidCategoryItems
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// FINAL COMPREHENSIVE MIGRATION ENDPOINT
router.get('/migrate-legacy-data', async (req, res) => {
  try {
    console.log('🔧 Starting FINAL comprehensive legacy data migration...');

    const db = mongoose.connection.db;
    const itemsCollection = db.collection('items');

    const results = {
      statusUpdates: 0,
      categoryUpdates: 0,
      nullStatusFixes: 0,
      nullCategoryFixes: 0,
      errors: []
    };

    // =================================================================
    // FIX NULL/MISSING STATUS - Set to 'available' as safe default
    // =================================================================
    try {
      const nullStatusResult = await itemsCollection.updateMany(
        {
          $or: [
            { status: null },
            { status: { $exists: false } }
          ]
        },
        { $set: { status: 'available' } }
      );
      results.nullStatusFixes = nullStatusResult.modifiedCount;
      console.log(`✅ Fixed ${nullStatusResult.modifiedCount} items with NULL/missing status → 'available'`);
    } catch (err) {
      results.errors.push(`NULL status fix failed: ${err.message}`);
    }

    // =================================================================
    // FIX NULL/MISSING CATEGORY - Set to 'Other' as safe default
    // =================================================================
    try {
      const nullCategoryResult = await itemsCollection.updateMany(
        {
          $or: [
            { category: null },
            { category: { $exists: false } }
          ]
        },
        { $set: { category: 'Other' } }
      );
      results.nullCategoryFixes = nullCategoryResult.modifiedCount;
      console.log(`✅ Fixed ${nullCategoryResult.modifiedCount} items with NULL/missing category → 'Other'`);
    } catch (err) {
      results.errors.push(`NULL category fix failed: ${err.message}`);
    }

    // =================================================================
    // STATUS FIXES - Map all possible invalid statuses to valid ones
    // =================================================================
    const statusMappings = [
      { old: 'picked_up', new: 'completed' },
      { old: 'pending', new: 'available' },
      { old: 'reserved', new: 'awaiting_pickup' },
      { old: 'active', new: 'available' },
      { old: 'inactive', new: 'expired' },
      { old: 'delivered', new: 'completed' },
      { old: 'cancelled', new: 'available' }
    ];

    for (const mapping of statusMappings) {
      try {
        const result = await itemsCollection.updateMany(
          { status: mapping.old },
          { $set: { status: mapping.new } }
        );
        if (result.modifiedCount > 0) {
          results.statusUpdates += result.modifiedCount;
          console.log(`✅ Updated ${result.modifiedCount} items: status '${mapping.old}' → '${mapping.new}'`);
        }
      } catch (err) {
        results.errors.push(`Status '${mapping.old}' update failed: ${err.message}`);
      }
    }

    // =================================================================
    // CATEGORY FIXES - Map all possible invalid categories to valid ones
    // =================================================================
    const categoryMappings = [
      // Oil variations - CRITICAL FIX
      { old: 'oil', new: 'Oils & Spices' },
      { old: 'Oil', new: 'Oils & Spices' },
      { old: 'oils', new: 'Oils & Spices' },
      { old: 'Oils', new: 'Oils & Spices' },
      
      // Spices variations
      { old: 'Spices', new: 'Oils & Spices' },
      { old: 'Spice', new: 'Oils & Spices' },
      { old: 'spices', new: 'Oils & Spices' },
      { old: 'spice', new: 'Oils & Spices' },
      
      // Dairy variations
      { old: 'milk', new: 'Dairy' },
      { old: 'Milk', new: 'Dairy' },
      { old: 'Cheese', new: 'Dairy' },
      { old: 'Yogurt', new: 'Dairy' },
      { old: 'cheese', new: 'Dairy' },
      { old: 'yogurt', new: 'Dairy' },
      
      // Meat variations
      { old: 'Meat & Poultry', new: 'Meat' },
      { old: 'Poultry', new: 'Meat' },
      { old: 'meat', new: 'Meat' },
      
      // Bakery variations
      { old: 'Bread', new: 'Bakery' },
      { old: 'bread', new: 'Bakery' },
      { old: 'Baked Goods', new: 'Bakery' },
      
      // Produce variations
      { old: 'Produce', new: 'Vegetables' },
      { old: 'Veggies', new: 'Vegetables' },
      { old: 'vegetables', new: 'Vegetables' },
      { old: 'fruits', new: 'Fruits' },
      
      // Drinks variations
      { old: 'Drinks', new: 'Beverages' },
      { old: 'drinks', new: 'Beverages' },
      { old: 'beverages', new: 'Beverages' },
      
      // Pantry variations
      { old: 'pantry', new: 'Pantry' },
      { old: 'Dry Goods', new: 'Pantry' },
      
      // Snacks variations
      { old: 'snacks', new: 'Snacks' },
      { old: 'Chips', new: 'Snacks' },
      
      // Frozen variations
      { old: 'Frozen', new: 'Frozen Foods' },
      { old: 'frozen', new: 'Frozen Foods' },
      
      // Canned variations
      { old: 'Canned', new: 'Canned Goods' },
      { old: 'canned', new: 'Canned Goods' },
      
      // Grains variations
      { old: 'Grains', new: 'Grains & Pasta' },
      { old: 'Pasta', new: 'Grains & Pasta' },
      { old: 'Rice', new: 'Grains & Pasta' },
      
      // Condiments variations
      { old: 'Condiments', new: 'Condiments & Sauces' },
      { old: 'Sauces', new: 'Condiments & Sauces' },
      
      // Seafood variations
      { old: 'Fish', new: 'Seafood' },
      { old: 'seafood', new: 'Seafood' },
      
      // Other variations
      { old: 'other', new: 'Other' },
      { old: 'Misc', new: 'Other' },
      { old: 'Miscellaneous', new: 'Other' }
    ];

    for (const mapping of categoryMappings) {
      try {
        const result = await itemsCollection.updateMany(
          { category: mapping.old },
          { $set: { category: mapping.new } }
        );
        if (result.modifiedCount > 0) {
          results.categoryUpdates += result.modifiedCount;
          console.log(`✅ Updated ${result.modifiedCount} items: category '${mapping.old}' → '${mapping.new}'`);
        }
      } catch (err) {
        results.errors.push(`Category '${mapping.old}' update failed: ${err.message}`);
      }
    }

    // =================================================================
    // VALIDATION - Check for remaining invalid values
    // =================================================================
    const validStatuses = ['available', 'sold', 'refunded', 'expired', 'awaiting_pickup', 'completed'];
    const validCategories = [
      'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Snacks', 
      'Beverages', 'Pantry', 'Oils & Spices', 'Condiments & Sauces',
      'Frozen Foods', 'Canned Goods', 'Grains & Pasta', 'Seafood',
      'Desserts', 'Baby Food', 'Pet Food', 'Other'
    ];
    
    const invalidStatusCount = await itemsCollection.countDocuments({
      $or: [
        { status: { $nin: validStatuses } },
        { status: null },
        { status: { $exists: false } }
      ]
    });
    
    const invalidCategoryCount = await itemsCollection.countDocuments({
      $or: [
        { category: { $nin: validCategories } },
        { category: null },
        { category: { $exists: false } }
      ]
    });

    // Get the actual invalid values for reporting
    const remainingInvalidStatuses = await itemsCollection.distinct('status', {
      $or: [
        { status: { $nin: validStatuses } },
        { status: null }
      ]
    });
    
    const remainingInvalidCategories = await itemsCollection.distinct('category', {
      $or: [
        { category: { $nin: validCategories } },
        { category: null }
      ]
    });

    const totalUpdates = results.statusUpdates + results.categoryUpdates + 
                        results.nullStatusFixes + results.nullCategoryFixes;

    console.log('✅ Migration completed!');

    res.json({
      success: true,
      message: totalUpdates > 0 
        ? `Migration completed successfully! Fixed ${totalUpdates} items. 🎉`
        : 'Migration completed - no updates needed! ✅',
      results: {
        totalItemsUpdated: totalUpdates,
        breakdown: {
          nullStatusFixes: results.nullStatusFixes,
          nullCategoryFixes: results.nullCategoryFixes,
          statusUpdates: results.statusUpdates,
          categoryUpdates: results.categoryUpdates
        },
        validation: {
          remainingInvalidStatuses: invalidStatusCount,
          remainingInvalidCategories: invalidCategoryCount,
          invalidStatusValues: remainingInvalidStatuses.length > 0 ? remainingInvalidStatuses : null,
          invalidCategoryValues: remainingInvalidCategories.length > 0 ? remainingInvalidCategories : null
        },
        errors: results.errors.length > 0 ? results.errors : null
      },
      nextSteps: invalidStatusCount === 0 && invalidCategoryCount === 0
        ? [
            '1. ✅ All data migrated successfully!',
            '2. 🗑️ DELETE routes/migration.js from your backend',
            '3. 🗑️ REMOVE the migration route lines from index.js',
            '4. 📤 Commit and push to close this endpoint',
            '5. ✅ Test editing items - should work perfectly now!'
          ]
        : [
            '1. ⚠️ Some invalid values still remain',
            '2. 📊 Check /api/v1/migration/check-invalid-data to see them',
            '3. 🔧 Contact developer with the invalid values to add them to migration'
          ]
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
