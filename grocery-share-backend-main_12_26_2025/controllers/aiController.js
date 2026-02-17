const fetch = require('node-fetch');
const { recognizeFood, checkFreshness, semanticSearch } = require('../services/aiService');
const Item = require('../models/Item');

const recognizeFoodImage = async (req, res) => {
  try {
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ error: 'Please provide an image file or imageUrl' });
    }

    let imageBuffer;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageUrl) {
      const response = await fetch(req.body.imageUrl);
      if (!response.ok) {
        return res.status(400).json({ error: 'Could not fetch image from URL' });
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const suggestions = await recognizeFood(imageBuffer);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Food recognition endpoint error:', error.message);
    if (error.message.includes('unavailable') || error.message.includes('loading')) {
      return res.status(503).json({
        error: 'AI model is warming up. Please try again in a few seconds.',
        retryAfter: 15,
      });
    }
    res.status(500).json({ error: 'Failed to analyze image' });
  }
};

const smartSearch = async (req, res) => {
  try {
    const { query, lat, lng, radius = 10000, limit = 50 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location (lat, lng) is required' });
    }

    const dbQuery = {
      status: 'available',
      expiryDate: { $gte: new Date() },
    };

    if (lat && lng) {
      dbQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const items = await Item.find(dbQuery)
      .populate('user', 'name')
      .limit(parseInt(limit))
      .lean();

    const itemsForSearch = items.map(item => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      tags: item.tags || [],
      description: item.description || '',
      price: item.price,
      isFree: item.isFree,
      imageURL: item.imageURL,
      images: item.images,
      expiryDate: item.expiryDate,
      location: item.location,
      address: item.address,
      user: item.user,
      createdAt: item.createdAt,
      distance: item.distance,
    }));

    const rankedItems = await semanticSearch(query, itemsForSearch);

    res.json({
      success: true,
      query,
      count: rankedItems.length,
      items: rankedItems.map(item => ({
        ...item,
        similarityScore: Math.round(item.similarityScore * 100),
      })),
    });
  } catch (error) {
    console.error('Smart search endpoint error:', error.message);
    if (error.message.includes('unavailable') || error.message.includes('loading')) {
      return res.status(503).json({
        error: 'AI search is warming up. Please try again in a few seconds.',
        retryAfter: 15,
      });
    }
    res.status(500).json({ error: 'Smart search failed' });
  }
};

const checkItemFreshness = async (req, res) => {
  try {
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ error: 'Please provide an image file or imageUrl' });
    }

    let imageBuffer;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageUrl) {
      const response = await fetch(req.body.imageUrl);
      if (!response.ok) {
        return res.status(400).json({ error: 'Could not fetch image from URL' });
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const freshness = await checkFreshness(imageBuffer);

    res.json({
      success: true,
      freshness,
    });
  } catch (error) {
    console.error('Freshness check endpoint error:', error.message);
    if (error.message.includes('unavailable') || error.message.includes('loading')) {
      return res.status(503).json({
        error: 'AI model is warming up. Please try again in a few seconds.',
        retryAfter: 15,
      });
    }
    res.status(500).json({ error: 'Freshness check failed' });
  }
};

module.exports = {
  recognizeFoodImage,
  smartSearch,
  checkItemFreshness,
};
