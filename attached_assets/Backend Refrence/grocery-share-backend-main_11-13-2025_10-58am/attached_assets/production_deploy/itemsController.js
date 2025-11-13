const Item = require('../models/Item');
const SearchLog = require('../models/SearchLog');

// Create new item (protected route)
const createItem = async (req, res) => {
  try {
    const { name, imageURL, expiryDate, price, location, address, category, tags, isFree, pickupTimeStart, pickupTimeEnd, flexiblePickup, validityPeriod } = req.body;
    
    // Get uploaded images from Cloudinary (use secure HTTPS URLs)
    const uploadedImages = req.files ? req.files
      .map(file => {
        // Cloudinary multer-storage can provide secure_url, path, or url
        const url = file.secure_url || file.path || file.url;
        if (!url) return null;
        // Ensure HTTPS
        return url.replace('http://', 'https://');
      })
      .filter(url => url !== null) : [];
    
    // Parse isFree (from form-data it comes as string)
    const isItemFree = isFree === true || isFree === 'true';
    
    // Validation
    if (!name || !expiryDate || !location) {
      return res.status(400).json({ 
        error: 'Please provide name, expiryDate, and location' 
      });
    }
    
    // Validate price or isFree
    if (!isItemFree && (!price || parseFloat(price) <= 0)) {
      return res.status(400).json({ 
        error: 'Please provide a valid price or mark the item as free' 
      });
    }
    
    // Determine final price
    const finalPrice = isItemFree ? 0 : parseFloat(price);
    
    // Ensure at least one image (either imageURL or uploaded files)
    if (!imageURL && uploadedImages.length === 0) {
      return res.status(400).json({ 
        error: 'Please provide at least one image (imageURL or upload images)' 
      });
    }
    
    // Parse location if it's a string (from form-data)
    let locationData = location;
    if (typeof location === 'string') {
      try {
        locationData = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid location format' });
      }
    }
    
    // Validate location format (check for undefined/null, not falsy, to allow 0 coordinates)
    if (locationData.lat === undefined || locationData.lat === null || 
        locationData.lng === undefined || locationData.lng === null) {
      return res.status(400).json({ 
        error: 'Location must include lat and lng coordinates' 
      });
    }
    
    // Parse tags if it's a string (from form-data)
    let tagsArray = tags || [];
    if (typeof tags === 'string') {
      try {
        tagsArray = JSON.parse(tags);
      } catch (e) {
        tagsArray = tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Set imageURL: use provided imageURL or first uploaded image
    const finalImageURL = imageURL || (uploadedImages.length > 0 ? uploadedImages[0] : null);
    
    // Parse pickup times and validate
    let pickupStart = null;
    let pickupEnd = null;
    const isFlexible = flexiblePickup === true || flexiblePickup === 'true';
    
    if (pickupTimeStart && !isFlexible) {
      pickupStart = new Date(pickupTimeStart);
      if (pickupStart < new Date()) {
        return res.status(400).json({ error: 'Pickup start time must be in the future' });
      }
    }
    
    if (pickupTimeEnd && !isFlexible) {
      pickupEnd = new Date(pickupTimeEnd);
      if (pickupStart && pickupEnd <= pickupStart) {
        return res.status(400).json({ error: 'Pickup end time must be after start time' });
      }
    }
    
    // Calculate expiresAt based on validityPeriod
    let expiresAt = null;
    if (validityPeriod && validityPeriod !== 'never') {
      const now = new Date();
      if (validityPeriod === '2h') {
        expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      } else if (validityPeriod === '6h') {
        expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      } else if (validityPeriod === '12h') {
        expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      } else if (validityPeriod === '24h') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Assume custom timestamp - validate it
        expiresAt = new Date(validityPeriod);
        if (isNaN(expiresAt.getTime()) || expiresAt <= now) {
          return res.status(400).json({ error: 'Invalid validity period: must be a future date' });
        }
      }
    }
    
    // Create item with GeoJSON format (MongoDB expects [longitude, latitude])
    const item = new Item({
      name,
      imageURL: finalImageURL,
      images: uploadedImages,
      address: address || null,
      category: category || null,
      tags: tagsArray,
      expiryDate: new Date(expiryDate),
      price: finalPrice,
      isFree: isItemFree,
      pickupTimeStart: pickupStart,
      pickupTimeEnd: pickupEnd,
      flexiblePickup: isFlexible,
      expiresAt: expiresAt,
      location: {
        type: 'Point',
        coordinates: [parseFloat(locationData.lng), parseFloat(locationData.lat)] // [longitude, latitude]
      },
      user: req.user.userId
    });
    
    await item.save();
    
    res.status(201).json({
      message: 'Item created successfully',
      item: {
        id: item._id,
        name: item.name,
        imageURL: item.imageURL,
        images: item.images,
        category: item.category,
        tags: item.tags,
        expiryDate: item.expiryDate,
        price: item.price,
        isFree: item.isFree,
        pickupTimeStart: item.pickupTimeStart,
        pickupTimeEnd: item.pickupTimeEnd,
        flexiblePickup: item.flexiblePickup,
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
    console.error('Create item error:', error);
    res.status(500).json({ 
      error: 'Error creating item',
      details: error.message 
    });
  }
};

// Get items within radius with enhanced search filters
const getItemsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius, keyword, category, tags } = req.query;
    
    // Validation
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Please provide lat and lng query parameters' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid coordinates' 
      });
    }
    
    // Parse and validate radius (default 10 miles)
    const radiusMiles = radius ? parseFloat(radius) : 10;
    
    if (isNaN(radiusMiles) || !isFinite(radiusMiles) || radiusMiles <= 0) {
      return res.status(400).json({ 
        error: 'Invalid radius. Must be a positive number' 
      });
    }
    
    const radiusInMeters = radiusMiles * 1609.34;
    
    // Build query filters
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    };
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add tags filter (matches any tag in the array)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }
    
    // Add keyword filter (searches in name, category, and tags)
    // Uses case-insensitive regex for partial/fuzzy matching
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // Find items within radius using MongoDB geospatial query
    // Note: Cannot use .sort() with $near query, so we'll sort in application code
    const items = await Item.find(query).populate('user', 'name email');
    
    // Sort by newest first (createdAt descending) in application code
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Log search for AI recommendations (async, don't wait)
    if (req.user) {
      const searchLog = new SearchLog({
        user: req.user.userId,
        keyword: keyword || null,
        category: category || null,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        location: { lat: latitude, lng: longitude },
        radius: radiusMiles,
        resultsCount: items.length
      });
      searchLog.save().catch(err => console.error('Search log error:', err));
    }
    
    // Format response
    const formattedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      imageURL: item.imageURL,
      images: item.images || [],
      category: item.category,
      tags: item.tags,
      expiryDate: item.expiryDate,
      price: item.price,
      isFree: item.isFree || false,
      pickupTimeStart: item.pickupTimeStart,
      pickupTimeEnd: item.pickupTimeEnd,
      flexiblePickup: item.flexiblePickup,
      location: {
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        address: item.address
      },
      user: {
        id: item.user._id,
        name: item.user.name,
        email: item.user.email
      },
      notified: item.notified,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      count: formattedItems.length,
      radius: radiusMiles,
      items: formattedItems
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ 
      error: 'Error fetching items',
      details: error.message 
    });
  }
};

// Get all items for logged-in user (protected route)
const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.userId })
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      imageURL: item.imageURL,
      images: item.images || [],
      category: item.category,
      tags: item.tags,
      expiryDate: item.expiryDate,
      price: item.price,
      isFree: item.isFree || false,
      pickupTimeStart: item.pickupTimeStart,
      pickupTimeEnd: item.pickupTimeEnd,
      flexiblePickup: item.flexiblePickup,
      location: {
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        address: item.address
      },
      notified: item.notified,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      count: formattedItems.length,
      items: formattedItems
    });
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({ 
      error: 'Error fetching your items',
      details: error.message 
    });
  }
};

// Update an item (protected route - only owner can update)
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageURL, category, tags, expiryDate, price, location, isFree, pickupTimeStart, pickupTimeEnd, flexiblePickup } = req.body;
    
    // Get uploaded images from Cloudinary (use secure HTTPS URLs)
    const uploadedImages = req.files ? req.files
      .map(file => {
        // Cloudinary multer-storage can provide secure_url, path, or url
        const url = file.secure_url || file.path || file.url;
        if (!url) return null;
        // Ensure HTTPS
        return url.replace('http://', 'https://');
      })
      .filter(url => url !== null) : [];
    
    // Find item
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check ownership
    if (item.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own items' });
    }
    
    // Update fields if provided
    if (name) item.name = name;
    if (imageURL) item.imageURL = imageURL;
    if (category !== undefined) item.category = category;
    
    // If new images uploaded and no imageURL in body, update imageURL to first uploaded image
    if (uploadedImages.length > 0 && !imageURL && !item.imageURL) {
      item.imageURL = uploadedImages[0];
    }
    
    // Handle tags parsing for form-data
    if (tags) {
      if (typeof tags === 'string') {
        try {
          item.tags = JSON.parse(tags);
        } catch (e) {
          item.tags = tags.split(',').map(tag => tag.trim());
        }
      } else {
        item.tags = tags;
      }
    }
    
    if (expiryDate) item.expiryDate = new Date(expiryDate);
    
    // Handle isFree and price logic
    if (isFree !== undefined) {
      const isItemFree = isFree === true || isFree === 'true';
      item.isFree = isItemFree;
      if (isItemFree) {
        item.price = 0;
      }
    }
    
    // Only update price if not free
    if (price !== undefined && !item.isFree) {
      item.price = parseFloat(price);
    }
    
    // Handle pickup time updates
    if (flexiblePickup !== undefined) {
      const isFlexible = flexiblePickup === true || flexiblePickup === 'true';
      item.flexiblePickup = isFlexible;
      
      if (isFlexible) {
        // Clear pickup times when flexible
        item.pickupTimeStart = null;
        item.pickupTimeEnd = null;
      }
    }
    
    if (pickupTimeStart !== undefined && !item.flexiblePickup) {
      const pickupStart = new Date(pickupTimeStart);
      if (pickupStart < new Date()) {
        return res.status(400).json({ error: 'Pickup start time must be in the future' });
      }
      item.pickupTimeStart = pickupStart;
    }
    
    if (pickupTimeEnd !== undefined && !item.flexiblePickup) {
      const pickupEnd = new Date(pickupTimeEnd);
      if (item.pickupTimeStart && pickupEnd <= item.pickupTimeStart) {
        return res.status(400).json({ error: 'Pickup end time must be after start time' });
      }
      item.pickupTimeEnd = pickupEnd;
    }
    
    // Add new uploaded images to existing images
    if (uploadedImages.length > 0) {
      item.images = [...(item.images || []), ...uploadedImages];
      if (item.images.length > 5) {
        item.images = item.images.slice(-5);
      }
    }
    
    if (location) {
      let locationData = location;
      if (typeof location === 'string') {
        try {
          locationData = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid location format' });
        }
      }
      
      if (locationData.lat === undefined || locationData.lat === null || 
          locationData.lng === undefined || locationData.lng === null) {
        return res.status(400).json({ 
          error: 'Location must include lat and lng coordinates' 
        });
      }
      item.location = {
        type: 'Point',
        coordinates: [parseFloat(locationData.lng), parseFloat(locationData.lat)]
      };
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
        tags: item.tags,
        expiryDate: item.expiryDate,
        price: item.price,
        isFree: item.isFree,
        pickupTimeStart: item.pickupTimeStart,
        pickupTimeEnd: item.pickupTimeEnd,
        flexiblePickup: item.flexiblePickup,
        location: {
          lat: item.location.coordinates[1],
          lng: item.location.coordinates[0]
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

// Delete an item (protected route - only owner can delete)
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find item
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check ownership
    if (item.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }
    
    await Item.findByIdAndDelete(id);
    
    res.json({
      message: 'Item deleted successfully',
      item: {
        id: item._id,
        name: item.name
      }
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      error: 'Error deleting item',
      details: error.message 
    });
  }
};

// Schedule a pickup
const schedulePickup = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { dateTime } = req.body;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Validation: user cannot schedule pickup for their own item
    if (item.user.toString() === req.user.userId) {
      return res.status(400).json({ error: 'You cannot schedule a pickup for your own item' });
    }
    
    // Check if user already has a pending/confirmed pickup for this item
    const existingPickup = item.scheduledPickups.find(
      p => p.user.toString() === req.user.userId && (p.status === 'pending' || p.status === 'confirmed')
    );
    if (existingPickup) {
      return res.status(400).json({ error: 'You already have a scheduled pickup for this item' });
    }
    
    // Validate dateTime is in the future
    const requestedDate = new Date(dateTime);
    if (requestedDate <= new Date()) {
      return res.status(400).json({ error: 'Pickup time must be in the future' });
    }
    
    // Add scheduled pickup
    item.scheduledPickups.push({
      user: req.user.userId,
      dateTime: requestedDate,
      status: 'pending'
    });
    
    await item.save();
    res.json({ message: 'Pickup scheduled successfully', item });
  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({ error: 'Failed to schedule pickup' });
  }
};

// Update pickup status
const updatePickupStatus = async (req, res) => {
  try {
    const { itemId, pickupId } = req.params;
    const { status } = req.body;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const pickup = item.scheduledPickups.id(pickupId);
    if (!pickup) {
      return res.status(404).json({ error: 'Pickup not found' });
    }
    
    // Authorization: only item owner or pickup requester can update status
    const isOwner = item.user.toString() === req.user.userId;
    const isRequester = pickup.user.toString() === req.user.userId;
    
    if (!isOwner && !isRequester) {
      return res.status(403).json({ error: 'You are not authorized to update this pickup' });
    }
    
    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    pickup.status = status;
    await item.save();
    
    res.json({ message: 'Pickup status updated', item });
  } catch (error) {
    console.error('Update pickup status error:', error);
    res.status(500).json({ error: 'Failed to update pickup status' });
  }
};

module.exports = {
  createItem,
  getItemsByLocation,
  getMyItems,
  updateItem,
  deleteItem,
  schedulePickup,
  updatePickupStatus
};
