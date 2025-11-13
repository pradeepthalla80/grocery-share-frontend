import { useState, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

interface AddressInputProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
  error?: string;
}

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  onLocationSelect,
  defaultAddress = '',
  defaultLat,
  defaultLng,
  error,
}) => {
  const [address, setAddress] = useState(defaultAddress);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    defaultLat !== undefined && defaultLng !== undefined ? { lat: defaultLat, lng: defaultLng } : null
  );
  const debounceTimer = useRef<number | null>(null);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding service - FREE!
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&limit=5` +
        `&addressdetails=1`
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data: GeocodingResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to search address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  const selectSuggestion = (result: GeocodingResult) => {
    const location = {
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };

    setAddress(result.display_name);
    setSelectedLocation({ lat: location.lat, lng: location.lng });
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(location);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${latitude}` +
            `&lon=${longitude}` +
            `&format=json`
          );

          if (!response.ok) throw new Error('Reverse geocoding failed');

          const data = await response.json();
          const location = {
            address: data.display_name,
            lat: latitude,
            lng: longitude,
          };

          setAddress(data.display_name);
          setSelectedLocation({ lat: latitude, lng: longitude });
          onLocationSelect(location);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Still set the location even if reverse geocoding fails
          const location = {
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude,
          };
          setAddress(location.address);
          setSelectedLocation({ lat: latitude, lng: longitude });
          onLocationSelect(location);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        alert('Could not get your location: ' + error.message);
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Address / Location
        </label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span>Use Current Location</span>
        </button>
      </div>

      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter address (e.g., 123 Main St, Naperville, IL)"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <span className="text-sm text-gray-900">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="text-xs text-gray-500 flex items-center space-x-2">
          <MapPin className="h-3 w-3" />
          <span>
            Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Start typing an address or use your current location
      </p>
    </div>
  );
};
