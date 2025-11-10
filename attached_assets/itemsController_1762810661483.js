const Item = require('../models/Item');
const SearchLog = require('../models/SearchLog');

// ============================================================================
// HELPER FUNCTION: Calculate distance between two coordinates (Haversine formula)
// ============================================================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Create new item (protected route)
const createItem = async (req, res) => {
  try {
    const { name, imageURL, expiryDate, price, location, address, category, tags, isFree, pickupTimeStart, pickupTimeEnd, flexiblePickup, validityPeriod, offerDelivery, deliveryFee } = req.body;
    
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
    
    // Ensure at least one image (uploaded files required)
    if (uploadedImages.length === 0 && !imageURL) {
      return res.status(400).json({ 
        error: 'Please upload at least one image' 
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
    
    // Parse delivery options
    const isOfferingDelivery = offerDelivery === true || offerDelivery === 'true';
    const parsedDeliveryFee = deliveryFee ? parseFloat(deliveryFee) : 0;
    
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
      offerDelivery: isOfferingDelivery,
      deliveryFee: parsedDeliveryFee,
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
        offerDelivery: item.offerDelivery,
        deliveryFee: item.deliveryFee,
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
      },
      status: { $in: ['available', 'pending', 'picked_up'] }
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
    
    // ============================================================================
    // CALCULATE DISTANCE for each item and add it to response
    // ============================================================================
    const formattedItems = items.map(item => {
      const distance = calculateDistance(
        latitude,
        longitude,
        item.location.coordinates[1], // lat
        item.location.coordinates[0]  // lng
      );
      
      return {
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
        offerDelivery: item.offerDelivery,
        deliveryFee: item.deliveryFee,
        distance: distance, // ADDED: Distance in miles
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
      };
    });
    
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

// Get single item by ID
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findById(id).populate('user', 'name email');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Format response
    const formattedItem = {
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
      offerDelivery: item.offerDelivery,
      deliveryFee: item.deliveryFee,
      location: {
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        address: item.address
      },
      user: item.user ? {
        id: item.user._id,
        name: item.user.name,
        email: item.user.email
      } : null,
      notified: item.notified,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
    
    res.json(formattedItem);
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({ 
      error: 'Error fetching item',
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
      offerDelivery: item.offerDelivery,
      deliveryFee: item.deliveryFee,
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
    const { name, imageURL, category, tags, expiryDate, price, location, isFree, pickupTimeStart, pickupTimeEnd, flexiblePickup, offerDelivery, deliveryFee } = req.body;
    
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
    
    // Check ownership
    if (item.user.toString() !== req.user.userId) {
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
        offerDelivery: item.offerDelivery,
        deliveryFee: item.deliveryFee,
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

// Delete an item (protected route - only owner can delete)
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check ownership (unless user is admin)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (item.user.toString() !== req.user.userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }
    
    await Item.findByIdAndDelete(id);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      error: 'Error deleting item',
      details: error.message 
    });
  }
};

module.exports = {
  createItem,
  getItemsByLocation,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem
};
