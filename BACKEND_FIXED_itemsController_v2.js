// CRITICAL FIX: Line 279 - Update status filter to exclude invalid 'picked_up' status
// OLD: status: { $in: ['available', 'pending', 'picked_up'] }
// NEW: status: 'available'  (Only show items available for pickup requests)
//
// Copy this file to your backend as: controllers/itemsController.js
// Then deploy to Render
//
// REASON FOR CHANGE:
// 1. 'picked_up' is not a valid status (migrated to 'completed')
// 2. Items in 'awaiting_pickup' or 'completed' should NOT appear in default search
// 3. Only 'available' items should be shown to users
//
// ============================================================================
// UPDATE LINE 279 FROM:
//    status: { $in: ['available', 'pending', 'picked_up'] }
// TO:
//    status: 'available'
// ============================================================================
//
// After this change, items will:
// ✅ Show in default list when status = 'available'
// ❌ Hide from default list when status = 'awaiting_pickup' (being picked up)
// ❌ Hide from default list when status = 'completed' (already picked up)
// ❌ Hide from default list when status = 'sold' (already sold)
// ❌ Hide from default list when status = 'expired'
//
// This ensures users only see items they can actually request for pickup.
