// =============================================================================
// FILE: controllers/itemController.js
// =============================================================================
// INSTRUCTIONS: 
// 1. At the TOP of the file (after all your imports), ADD this helper function:

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

// =============================================================================
// 2. FIND the searchItems function (exports.searchItems or searchItems = async...)
// 3. FIND where it returns items (usually near the end, something like res.json({...}))
// 4. REPLACE the final response with this code:
// =============================================================================

// Calculate distance for each item
const itemsWithDistance = items.map(item => {
  const distance = calculateDistance(
    parseFloat(lat),
    parseFloat(lng),
    item.location.lat,
    item.location.lng
  );
  
  return {
    ...item.toObject(),
    distance: distance
  };
});

res.json({
  count: itemsWithDistance.length,
  radius: parseFloat(radius),
  items: itemsWithDistance
});

// =============================================================================
// EXAMPLE BEFORE (what you currently have):
// =============================================================================
/*
exports.searchItems = async (req, res) => {
  try {
    const { lat, lng, radius, keyword, category, tags } = req.query;
    
    // ... your existing query logic ...
    
    const items = await Item.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // OLD CODE - REPLACE THIS:
    res.json({
      count: items.length,
      radius: parseFloat(radius),
      items: items
    });
  } catch (error) {
    // error handling
  }
};
*/

// =============================================================================
// EXAMPLE AFTER (what it should look like):
// =============================================================================
/*
exports.searchItems = async (req, res) => {
  try {
    const { lat, lng, radius, keyword, category, tags } = req.query;
    
    // ... your existing query logic ...
    
    const items = await Item.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // NEW CODE - ADD THIS:
    const itemsWithDistance = items.map(item => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        item.location.lat,
        item.location.lng
      );
      
      return {
        ...item.toObject(),
        distance: distance
      };
    });

    res.json({
      count: itemsWithDistance.length,
      radius: parseFloat(radius),
      items: itemsWithDistance
    });
  } catch (error) {
    // error handling
  }
};
*/
