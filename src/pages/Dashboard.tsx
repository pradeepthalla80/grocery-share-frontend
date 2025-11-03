import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { getRecommendations } from '../api/recommendations';
import { ItemCard } from '../components/ItemCard';
import { Search, MapPin, Plus, Sparkles } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [recommendations, setRecommendations] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [lat, setLat] = useState('41.881832');
  const [lng, setLng] = useState('-87.623177');
  const [radius, setRadius] = useState('10');
  const [keyword, setKeyword] = useState('');

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.search({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseFloat(radius),
        keyword: keyword || undefined,
      });
      setItems(response.items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
        },
        (error) => {
          alert('Could not get your location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await getRecommendations(parseFloat(lat), parseFloat(lng), 6);
      setRecommendations(response.items);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  useEffect(() => {
    handleSearch();
    fetchRecommendations();
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
          <h2 className="text-lg font-semibold mb-4">Search Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (miles)
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by name or tags"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
            <button
              onClick={getCurrentLocation}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <MapPin className="h-5 w-5" />
              <span>Use My Location</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-600">
            Found <span className="font-semibold">{items.length}</span> items within {radius} miles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
