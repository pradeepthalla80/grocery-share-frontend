import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { getNearbyRequests, type ItemRequest } from '../api/itemRequests';
import { getRecommendations } from '../api/recommendations';
import { AddressInput } from '../components/AddressInput';
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
  
  // Search location state (address-based, not coordinates)
  const [searchLocation, setSearchLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState('10');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  const handleSearch = async () => {
    if (!searchLocation) {
      setError('Please select a location to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'available') {
        const response = await itemsAPI.search({
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          radius: parseFloat(radius),
          keyword: keyword || undefined,
          category: category || undefined,
          tags: tags || undefined,
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
    // Auto-search when location is selected or tab changes
    if (searchLocation) {
      handleSearch();
      if (activeTab === 'available') {
        fetchRecommendations();
      }
    }
  }, [searchLocation, activeTab]);

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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                {items.length > 0 && activeTab === 'available' && (
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
                {requests.length > 0 && activeTab === 'requested' && (
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedItems.map((item) => {
            const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.imageURL;
            const handleItemClick = () => {
              navigate(`/item/${item.id}`);
            };
            const isExpired = new Date(item.expiryDate) < new Date();
            const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
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
                  {isExpired ? (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      Expired
                    </div>
                  ) : daysUntilExpiry <= 2 ? (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      Urgent
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      Active
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRequests.map((request) => (
                <div key={request._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.itemName}</h3>
                      <p className="text-sm text-gray-600">{request.quantity}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {request.category}
                    </span>
                  </div>

                  {request.notes && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{request.notes}</p>
                  )}

                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {request.approximateLocation || 'Nearby'}
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    Requested by <span className="font-medium">{request.user.name}</span>
                  </div>

                  {request.responses && request.responses.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        {request.responses.length} {request.responses.length === 1 ? 'person has' : 'people have'} responded
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/request/${request._id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/chat?receiverId=${request.user.id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Offer to Help
                    </button>
                  </div>
                </div>
              ))}
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
