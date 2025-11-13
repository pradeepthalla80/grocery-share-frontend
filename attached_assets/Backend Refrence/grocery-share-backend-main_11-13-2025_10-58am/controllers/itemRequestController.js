const ItemRequest = require('../models/ItemRequest');

exports.createRequest = async (req, res) => {
  try {
    const { itemName, quantity, category, notes, location, address, zipCode, approximateLocation, validityPeriod, pricePreference, maxPrice } = req.body;

    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Valid location coordinates are required' });
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

    const itemRequest = new ItemRequest({
      user: req.user.userId,
      itemName,
      quantity,
      category,
      notes,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
      address,
      zipCode,
      approximateLocation,
      pricePreference: pricePreference || 'free_only',
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      expiresAt: expiresAt
    });

    await itemRequest.save();
    await itemRequest.populate('user', 'name email');

    res.status(201).json({ message: 'Item request created successfully', request: itemRequest });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create item request' });
  }
};

exports.getNearbyRequests = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const radiusInMeters = parseFloat(radius) * 1609.34;

    const requests = await ItemRequest.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'active'
    })
      .populate('user', 'name email')
      .populate('responses.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ requests });
  } catch (error) {
    console.error('Get nearby requests error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby requests' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await ItemRequest.find({ user: req.user.userId })
      .populate('user', 'name email')
      .populate('responses.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    const itemRequest = await ItemRequest.findById(requestId);

    if (!itemRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (itemRequest.user.toString() === req.user.userId) {
      return res.status(400).json({ error: 'Cannot respond to your own request' });
    }

    const existingResponse = itemRequest.responses.find(
      r => r.user.toString() === req.user.userId
    );

    if (existingResponse) {
      return res.status(400).json({ error: 'You have already responded to this request' });
    }

    itemRequest.responses.push({
      user: req.user.userId,
      message: message || 'I can help with this!'
    });

    await itemRequest.save();
    await itemRequest.populate('responses.user', 'name email');

    res.json({ message: 'Response added successfully', request: itemRequest });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const itemRequest = await ItemRequest.findById(requestId)
      .populate('user', 'name email')
      .populate('responses.user', 'name email');

    if (!itemRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(itemRequest);
  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { itemName, quantity, category, notes, location, address, approximateLocation, pricePreference, maxPrice } = req.body;

    const itemRequest = await ItemRequest.findById(requestId);

    if (!itemRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (itemRequest.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own requests' });
    }

    // Update fields
    if (itemName !== undefined) itemRequest.itemName = itemName;
    if (quantity !== undefined) itemRequest.quantity = quantity;
    if (category !== undefined) itemRequest.category = category;
    if (notes !== undefined) itemRequest.notes = notes;
    if (address !== undefined) itemRequest.address = address;
    if (approximateLocation !== undefined) itemRequest.approximateLocation = approximateLocation;
    if (pricePreference !== undefined) itemRequest.pricePreference = pricePreference;
    if (maxPrice !== undefined) itemRequest.maxPrice = maxPrice ? parseFloat(maxPrice) : null;
    
    if (location && location.coordinates && location.coordinates.length === 2) {
      itemRequest.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    await itemRequest.save();
    await itemRequest.populate('user', 'name email');

    res.json({ message: 'Request updated successfully', request: itemRequest });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['active', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const itemRequest = await ItemRequest.findById(requestId);

    if (!itemRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (itemRequest.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own requests' });
    }

    itemRequest.status = status;
    await itemRequest.save();

    res.json({ message: 'Request status updated successfully', request: itemRequest });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const itemRequest = await ItemRequest.findById(requestId);

    if (!itemRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (itemRequest.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own requests' });
    }

    await ItemRequest.findByIdAndDelete(requestId);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
};
