import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { getNearbyRequests, type ItemRequest } from '../api/itemRequests';
import { getRecommendations } from '../api/recommendations';
import { AddressInput } from '../components/AddressInput';
import { StoreFilterToggle } from '../components/StoreFilterToggle';
import { Search, Plus, Sparkles, Calendar, DollarSign, MapPin, Package, MessageCircle, ArrowUpDown, X } from 'lucide-react';
import { format } from 'date-fns';

type TabType = 'available' | 'requested';
type SortOption = 'distance' | 'price' | 'expiry' | 'newest';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [recommendations, setRecommendations] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [showOnlyStoreItems, setShowOnlyStoreItems] = useState(false);
  
  // Search location state (address-based, not coordinates)
  const [searchLocation, setSearchLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState('10');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  // Fetch both items and requests on initial load
  const fetchAllData = async () => {
    if (!searchLocation) return;

    try {
      setLoading(true);
      setError('');
      
      // Fetch items and requests in parallel with expanding radius
      const [itemsResponse, requestsResponse] = await Promise.all([
        itemsAPI.search({
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          radius: 50, // Fetch all within 50 miles for proximity sorting
          keyword: keyword || undefined,
          category: category || undefined,
          tags: tags || undefined,
          onlyStoreItems: showOnlyStoreItems ? 'true' : undefined,
        }),
        getNearbyRequests(searchLocation.lat, searchLocation.lng, 50)
      ]);

      setItems(itemsResponse.items);
      setRequests(requestsResponse.requests || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchLocation) {
      setError('Please select a location to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // If showing default combined list (no filters), fetch both items and requests
      if (!keyword && !category && !tags && activeTab === 'available') {
        const [itemsResponse, requestsResponse] = await Promise.all([
          itemsAPI.search({
            lat: searchLocation.lat,
            lng: searchLocation.lng,
            radius: parseFloat(radius),
            keyword: undefined,
            category: undefined,
            tags: undefined,
            onlyStoreItems: showOnlyStoreItems ? 'true' : undefined,
          }),
          getNearbyRequests(searchLocation.lat, searchLocation.lng, parseFloat(radius))
        ]);
        setItems(itemsResponse.items);
        setRequests(requestsResponse.requests || []);
      } else if (activeTab === 'available') {
        const response = await itemsAPI.search({
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          radius: parseFloat(radius),
          keyword: keyword || undefined,
          category: category || undefined,
          tags: tags || undefined,
          onlyStoreItems: showOnlyStoreItems ? 'true' : undefined,
        });
        setItems(response.items);
      } else {
        const response = await getNearbyRequests(
          searchLocation.lat,
          searchLocation.lng,
          parseFloat(radius)
        );
        setRequests(response.requests || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setSearchLocation(location);
  };

  // No longer using combined list - always show items and requests separately

  // Sorting function for items
  const sortItems = (itemsToSort: Item[]) => {
    const sorted = [...itemsToSort];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'price':
        return sorted.sort((a, b) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return (a.price || 0) - (b.price || 0);
        });
      case 'expiry':
        return sorted.sort((a, b) => 
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  // Sorting function for requests
  const sortRequests = (requestsToSort: ItemRequest[]) => {
    const sorted = [...requestsToSort];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  const sortedItems = sortItems(items);
  const sortedRequests = sortRequests(requests);

  const fetchRecommendations = async () => {
    if (!searchLocation) return;
    
    try {
      const response = await getRecommendations(searchLocation.lat, searchLocation.lng, 6);
      setRecommendations(response.items);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  useEffect(() => {
    // Auto-load data when location is selected
    if (searchLocation && !keyword && !category && !tags) {
      fetchAllData();
      if (activeTab === 'available') {
        fetchRecommendations();
      }
    } else if (searchLocation) {
      handleSearch();
      if (activeTab === 'available') {
        fetchRecommendations();
      }
    }
  }, [searchLocation, activeTab, showOnlyStoreItems]);

  // Auto-load items on page load using browser geolocation
  useEffect(() => {
    if ('geolocation' in navigator && !searchLocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Set location and trigger auto-search
          setSearchLocation({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback: use a default location (e.g., New York City)
          setSearchLocation({
            address: 'Default Location',
            lat: 40.7128,
            lng: -74.0060
          });
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Items Nearby</h1>
            <p className="text-gray-600 mt-2">Find great deals on groceries expiring soon</p>
          </div>
          <button
            onClick={() => navigate('/add-item')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-green-600" />
            Search Filters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Type
              </label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="available">Available Items</option>
                <option value="requested">Requested Items</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search items by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                <option value="Fruits">Fruits</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Dairy">Dairy</option>
                <option value="Meat">Meat</option>
                <option value="Bakery">Bakery</option>
                <option value="Canned Goods">Canned Goods</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="organic, fresh, gluten-free..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AddressInput
                onLocationSelect={handleLocationSelect}
                defaultAddress={searchLocation?.address}
                defaultLat={searchLocation?.lat}
                defaultLng={searchLocation?.lng}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>
          </div>
          
          {/* Store Items Filter */}
          {activeTab === 'available' && (
            <div className="mt-4">
              <StoreFilterToggle
                enabled={showOnlyStoreItems}
                onChange={setShowOnlyStoreItems}
                count={showOnlyStoreItems ? items.length : undefined}
              />
            </div>
          )}
          
          <div className="mt-4">
            <button
              onClick={handleSearch}
              disabled={loading || !searchLocation}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {(keyword || category || tags) && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-700 font-medium">Active Filters:</span>
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50 transition"
                >
                  <span>Keyword: {keyword}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              {category && (
                <button
                  onClick={() => setCategory('')}
                  className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50 transition"
                >
                  <span>Category: {category}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              {tags && (
                <button
                  onClick={() => setTags('')}
                  className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50 transition"
                >
                  <span>Tags: {tags}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => {
                  setKeyword('');
                  setCategory('');
                  setTags('');
                }}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-4 px-1 relative ${
                activeTab === 'available'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Available Items</span>
                {items.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    {items.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requested')}
              className={`pb-4 px-1 relative ${
                activeTab === 'requested'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Requested Items</span>
                {requests.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Available Items Tab */}
        {activeTab === 'available' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Found <span className="font-semibold">{items.length}</span> items within {radius} miles
              </p>
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="price">Sort by Price</option>
                  <option value="expiry">Sort by Expiry Date</option>
                  <option value="newest">Sort by Newest</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {sortedItems.map((item) => {
                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.imageURL;
                const handleClick = () => {
                  navigate(`/item/${item.id}`);
                };
                
                return (
                  <div
                    key={item.id}
                    onClick={handleClick}
                    className="flex items-center gap-4 p-3 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                        <span className="text-sm text-gray-600">{item.category || 'Uncategorized'}</span>
                      </div>
                    </div>

                    {/* Price/Distance */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-gray-700 font-semibold">
                        {item.isFree ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <span>${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{(item.distance || 0).toFixed(1)} mi</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No items found in this area</p>
                <p className="text-gray-400 mt-2">Try expanding your search radius</p>
              </div>
            )}

        {recommendations.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recommendations.map((item) => {
                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.imageURL;
                const handleItemClick = () => {
                  navigate(`/item/${item.id}`);
                };
                return (
                  <div 
                    key={item.id} 
                    onClick={handleItemClick}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="relative w-full h-32 bg-gray-200">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1">{item.name}</h3>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          {item.isFree ? (
                            <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded text-xs">
                              🆓 FREE
                            </span>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3" />
                              <span className="font-semibold text-green-600">${item.price.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="line-clamp-1">{format(new Date(item.expiryDate), 'MMM dd')}</span>
                        </div>
                        {item.location?.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1 text-xs">{item.location.address.split(',')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'requested' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                Found <span className="font-semibold">{requests.length}</span> requests within {radius} miles
              </p>
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="newest">Sort by Newest</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {sortedRequests.map((request) => {
                const handleClick = () => {
                  navigate(`/request/${request._id}`);
                };

                return (
                  <div
                    key={request._id}
                    onClick={handleClick}
                    className="flex items-center gap-4 p-3 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer"
                  >
                    {/* Icon placeholder */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{request.itemName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Requested
                        </span>
                        <span className="text-sm text-gray-600">{request.category || 'Uncategorized'}</span>
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{(request.distance || 0).toFixed(1)} mi</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {requests.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No requests found in this area</p>
                <p className="text-gray-400 mt-2">Try expanding your search radius</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
