// COMPLETE FIXED updateItem function
// Replace the updateItem function in controllers/itemsController.js (lines 503-649)

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageURL, category, customCategory, tags, expiryDate, price, location, isFree, pickupTimeStart, pickupTimeEnd, flexiblePickup, offerDelivery, deliveryFee } = req.body;
    
    // Get uploaded images from Cloudinary (use secure HTTPS URLs)
    const uploadedImages = req.files ? req.files
      .map(file => {
        const url = file.secure_url || file.path || file.url;
        if (!url) return null;
        return url.replace('http://', 'https://');
      })
      .filter(url => url !== null) : [];
    
    // Find item
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check ownership (convert both to strings for comparison)
    if (item.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }
    
    // Parse isFree (from form-data it comes as string)
    const isItemFree = isFree === true || isFree === 'true';
    
    // Validate price or isFree
    if (!isItemFree && price !== undefined && parseFloat(price) <= 0) {
      return res.status(400).json({ 
        error: 'Please provide a valid price or mark the item as free' 
      });
    }
    
    // Parse delivery options
    const isOfferingDelivery = offerDelivery === true || offerDelivery === 'true';
    const parsedDeliveryFee = deliveryFee !== undefined ? parseFloat(deliveryFee) : item.deliveryFee;
    
    // Update fields
    if (name !== undefined) item.name = name;
    if (imageURL !== undefined) item.imageURL = imageURL;
    if (category !== undefined) item.category = category;
    if (customCategory !== undefined) {
      // Clear customCategory if empty string, otherwise set it
      item.customCategory = customCategory === '' ? null : customCategory;
    }
    if (expiryDate !== undefined) item.expiryDate = new Date(expiryDate);
    if (isFree !== undefined) {
      item.isFree = isItemFree;
      item.price = isItemFree ? 0 : (price !== undefined ? parseFloat(price) : item.price);
    } else if (price !== undefined) {
      item.price = parseFloat(price);
    }
    
    if (offerDelivery !== undefined) item.offerDelivery = isOfferingDelivery;
    if (deliveryFee !== undefined) item.deliveryFee = parsedDeliveryFee;
    
    if (uploadedImages.length > 0) {
      item.images = uploadedImages;
      if (!item.imageURL) item.imageURL = uploadedImages[0];
    }
    
    // Parse tags if provided
    if (tags !== undefined) {
      let tagsArray = tags;
      if (typeof tags === 'string') {
        try {
          tagsArray = JSON.parse(tags);
        } catch (e) {
          tagsArray = tags.split(',').map(tag => tag.trim());
        }
      }
      item.tags = tagsArray;
    }
    
    // Parse and update location if provided
    if (location !== undefined) {
      let locationData = location;
      if (typeof location === 'string') {
        try {
          locationData = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid location format' });
        }
      }
      
      if (locationData.lat !== undefined && locationData.lng !== undefined) {
        item.location = {
          type: 'Point',
          coordinates: [parseFloat(locationData.lng), parseFloat(locationData.lat)]
        };
      }
    }
    
    // Update pickup times
    if (flexiblePickup !== undefined) {
      item.flexiblePickup = flexiblePickup === true || flexiblePickup === 'true';
    }
    
    if (pickupTimeStart !== undefined && !item.flexiblePickup) {
      item.pickupTimeStart = new Date(pickupTimeStart);
    }
    
    if (pickupTimeEnd !== undefined && !item.flexiblePickup) {
      item.pickupTimeEnd = new Date(pickupTimeEnd);
    }
    
    // ============================================================================
    // FIX: Explicitly preserve 'available' status for items not in pickup flow
    // This prevents items from disappearing from search after updates
    // ============================================================================
    if (item.status !== 'awaiting_pickup' && item.status !== 'completed') {
      item.status = 'available';
    }
    
    await item.save();
    
    res.json({
      message: 'Item updated successfully',
      item: {
        id: item._id,
        name: item.name,
        imageURL: item.imageURL,
        images: item.images,
        category: item.category,
        customCategory: item.customCategory,
        tags: item.tags,
        expiryDate: item.expiryDate,
        price: item.price,
        isFree: item.isFree,
        pickupTimeStart: item.pickupTimeStart,
        pickupTimeEnd: item.pickupTimeEnd,
        flexiblePickup: item.flexiblePickup,
        offerDelivery: item.offerDelivery,
        deliveryFee: item.deliveryFee,
        status: item.status, // ADD THIS to return status in response
        location: {
          lat: item.location.coordinates[1],
          lng: item.location.coordinates[0],
          address: item.address
        },
        notified: item.notified,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ 
      error: 'Error updating item',
      details: error.message 
    });
  }
};
