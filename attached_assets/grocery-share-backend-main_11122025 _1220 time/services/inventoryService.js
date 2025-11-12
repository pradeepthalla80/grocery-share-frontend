const Item = require('../models/Item');

/**
 * Centralized Inventory Management Service
 * Handles atomic stock adjustments for store items with race condition protection
 */

/**
 * Decrement item quantity (when sold/exchanged)
 * Uses atomic operation to prevent race conditions
 * @param {String} itemId - The item ID
 * @param {Number} quantity - Amount to decrement (default: 1)
 * @returns {Object} { success: boolean, item: Item|null, message: string }
 */
exports.decrementStock = async (itemId, quantity = 1) => {
  try {
    // Fetch the item first to check if it's a store item
    const item = await Item.findById(itemId);
    
    if (!item) {
      return {
        success: false,
        item: null,
        message: 'Item not found'
      };
    }
    
    // Regular items: Just mark as completed/sold
    if (!item.isStoreItem || item.quantity === null) {
      return {
        success: true,
        item,
        message: 'Regular item - no quantity adjustment needed',
        skipQuantity: true
      };
    }
    
    // Store items: Atomic quantity decrement with stock check
    const updatedItem = await Item.findOneAndUpdate(
      {
        _id: itemId,
        isStoreItem: true,
        quantity: { $gte: quantity } // Ensure enough stock exists
      },
      {
        $inc: { quantity: -quantity }, // Atomic decrement
        $set: {
          stockStatus: null, // Will be recalculated below
          status: 'available' // Keep available (unless out of stock)
        }
      },
      {
        new: true, // Return updated document
        runValidators: true
      }
    );
    
    if (!updatedItem) {
      return {
        success: false,
        item: null,
        message: 'Out of stock or insufficient quantity',
        outOfStock: true
      };
    }
    
    // Recalculate stock status based on new quantity
    if (updatedItem.quantity === 0) {
      updatedItem.stockStatus = 'out_of_stock';
      updatedItem.status = 'available'; // Still available for viewing but can't be purchased
    } else if (updatedItem.quantity <= 5) {
      updatedItem.stockStatus = 'low_stock';
      updatedItem.status = 'available';
    } else {
      updatedItem.stockStatus = 'in_stock';
      updatedItem.status = 'available';
    }
    
    await updatedItem.save();
    
    return {
      success: true,
      item: updatedItem,
      message: `Stock decremented successfully. New quantity: ${updatedItem.quantity}`,
      remainingStock: updatedItem.quantity
    };
    
  } catch (error) {
    console.error('Error decrementing stock:', error);
    return {
      success: false,
      item: null,
      message: error.message || 'Failed to decrement stock'
    };
  }
};

/**
 * Increment item quantity (when refunded/canceled)
 * @param {String} itemId - The item ID
 * @param {Number} quantity - Amount to increment (default: 1)
 * @returns {Object} { success: boolean, item: Item|null, message: string }
 */
exports.incrementStock = async (itemId, quantity = 1) => {
  try {
    // Fetch the item first
    const item = await Item.findById(itemId);
    
    if (!item) {
      return {
        success: false,
        item: null,
        message: 'Item not found'
      };
    }
    
    // Only increment for store items
    if (!item.isStoreItem || item.quantity === null) {
      return {
        success: true,
        item,
        message: 'Regular item - no quantity adjustment needed',
        skipQuantity: true
      };
    }
    
    // Atomic increment
    const updatedItem = await Item.findOneAndUpdate(
      {
        _id: itemId,
        isStoreItem: true
      },
      {
        $inc: { quantity: quantity }, // Atomic increment
        $set: {
          status: 'available' // Restore to available
        }
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedItem) {
      return {
        success: false,
        item: null,
        message: 'Failed to restore stock'
      };
    }
    
    // Recalculate stock status
    if (updatedItem.quantity === 0) {
      updatedItem.stockStatus = 'out_of_stock';
    } else if (updatedItem.quantity <= 5) {
      updatedItem.stockStatus = 'low_stock';
    } else {
      updatedItem.stockStatus = 'in_stock';
    }
    
    await updatedItem.save();
    
    return {
      success: true,
      item: updatedItem,
      message: `Stock restored successfully. New quantity: ${updatedItem.quantity}`,
      remainingStock: updatedItem.quantity
    };
    
  } catch (error) {
    console.error('Error incrementing stock:', error);
    return {
      success: false,
      item: null,
      message: error.message || 'Failed to restore stock'
    };
  }
};

/**
 * Check if item has sufficient stock
 * @param {String} itemId - The item ID
 * @param {Number} requestedQuantity - Quantity needed (default: 1)
 * @returns {Object} { available: boolean, currentStock: number, message: string }
 */
exports.checkStock = async (itemId, requestedQuantity = 1) => {
  try {
    const item = await Item.findById(itemId);
    
    if (!item) {
      return {
        available: false,
        currentStock: 0,
        message: 'Item not found'
      };
    }
    
    // Regular items are always "in stock" (single-use)
    if (!item.isStoreItem || item.quantity === null) {
      return {
        available: item.status === 'available',
        currentStock: 1,
        message: item.status === 'available' ? 'Item available' : 'Item not available'
      };
    }
    
    // Store items: Check quantity
    const hasStock = item.quantity >= requestedQuantity && item.status === 'available';
    
    return {
      available: hasStock,
      currentStock: item.quantity,
      stockStatus: item.stockStatus,
      message: hasStock 
        ? `${item.quantity} units available` 
        : `Insufficient stock (${item.quantity} available, ${requestedQuantity} requested)`
    };
    
  } catch (error) {
    console.error('Error checking stock:', error);
    return {
      available: false,
      currentStock: 0,
      message: error.message || 'Failed to check stock'
    };
  }
};

module.exports = exports;
