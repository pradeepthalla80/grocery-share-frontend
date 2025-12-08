import { useState, useRef } from 'react';
import { MapPin, Loader2, Search, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { formatAddressShort } from '../utils/address';

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
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
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
  const [locationHint, setLocationHint] = useState<string>('');
  const debounceTimer = useRef<number | null>(null);
  const { showToast } = useToast();

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Build optimized Nominatim query for better house number matching
      // Use structured query when input looks like an address with number
      const hasNumber = /^\d+/.test(query.trim());
      
      let url: string;
      
      if (hasNumber) {
        // For queries starting with a number (like "123 Main St"), use structured search
        // This helps Nominatim prioritize results with house numbers
        const parts = query.trim().split(/\s+/);
        const streetNum = parts[0];
        const streetName = parts.slice(1).join(' ');
        
        if (streetName.length > 0) {
          // Structured search with street number and name (no country restriction for global support)
          url = `https://nominatim.openstreetmap.org/search?` +
            `street=${encodeURIComponent(streetNum + ' ' + streetName)}` +
            `&format=json` +
            `&limit=8` +
            `&addressdetails=1`;
        } else {
          // Just a number, do regular search
          url = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}` +
            `&format=json` +
            `&limit=8` +
            `&addressdetails=1`;
        }
      } else {
        // Regular search for non-numbered queries
        url = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}` +
          `&format=json` +
          `&limit=8` +
          `&addressdetails=1`;
      }

      const response = await fetch(url);

      if (!response.ok) throw new Error('Geocoding failed');

      let data: GeocodingResult[] = await response.json();
      
      // If user entered a house number but results don't include it,
      // try a second search with the full query
      if (hasNumber && data.length === 0) {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}` +
          `&format=json` +
          `&limit=8` +
          `&addressdetails=1`
        );
        if (fallbackResponse.ok) {
          data = await fallbackResponse.json();
        }
      }
      
      // Sort results to prioritize those with house numbers when user entered a number
      if (hasNumber) {
        data.sort((a, b) => {
          const aHasNumber = a.address?.house_number ? 1 : 0;
          const bHasNumber = b.address?.house_number ? 1 : 0;
          return bHasNumber - aHasNumber;
        });
      }
      
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      showToast('Failed to search address. Please try again.', 'error');
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
    // Use formatAddressShort to clean up the address (removes unnecessary details like "Plato Township")
    const formattedAddress = formatAddressShort(result.display_name, result.address);
    
    const location = {
      address: formattedAddress,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };

    setAddress(formattedAddress);
    setSelectedLocation({ lat: location.lat, lng: location.lng });
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(location);
  };

  const getCurrentLocation = async () => {
    // 1. Check if geolocation is supported
    if (!navigator.geolocation) {
      showToast('Location services are not supported by your browser', 'error');
      setLocationHint('Your browser does not support location services. Please enter your address manually.');
      return;
    }

    // 2. Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
      showToast('Location requires a secure connection (HTTPS)', 'error');
      setLocationHint('For security, location services require HTTPS. Please enter your address manually.');
      return;
    }

    // 3. Check permission status if available
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          showToast('Location access denied', 'error');
          setLocationHint('You have blocked location access. Please enable it in your browser settings and try again.');
          return;
        }
      } catch (err) {
        // Permissions API not fully supported, continue anyway
        console.log('Permissions API not available:', err);
      }
    }

    setLoading(true);
    setLocationHint('');

    // 4. Wrap getCurrentPosition in a Promise with timeout
    const getPositionWithTimeout = (timeout: number = 10000): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, timeout);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: timeout,
            maximumAge: 0,
          }
        );
      });
    };

    try {
      // 5. Get current position with 10-second timeout
      const position = await getPositionWithTimeout(10000);
      const { latitude, longitude } = position.coords;

      try {
        // 6. Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${latitude}` +
          `&lon=${longitude}` +
          `&format=json` +
          `&addressdetails=1`
        );

        if (!response.ok) throw new Error('Reverse geocoding failed');

        const data = await response.json();
        // Use formatAddressShort to clean up the reverse geocoded address
        const formattedAddress = formatAddressShort(data.display_name, data.address);
        
        const location = {
          address: formattedAddress,
          lat: latitude,
          lng: longitude,
        };

        setAddress(formattedAddress);
        setSelectedLocation({ lat: latitude, lng: longitude });
        onLocationSelect(location);
        showToast('Location set successfully!', 'success');
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
        showToast('Location set (coordinates only)', 'info');
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      
      // 7. Provide helpful error messages based on error type
      if (error.code === 1 || error.message?.includes('denied')) {
        showToast('Location access denied', 'error');
        setLocationHint('Please allow location access in your browser and try again.');
      } else if (error.code === 2) {
        showToast('Location unavailable', 'error');
        setLocationHint('Could not determine your location. Please check your device settings.');
      } else if (error.code === 3 || error.message?.includes('timeout')) {
        showToast('Location request timed out', 'error');
        setLocationHint('Location request took too long. Please try again or enter address manually.');
      } else {
        showToast('Could not get your location', 'error');
        setLocationHint('Please try again or enter your address manually.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format suggestion display to show house number prominently
  const formatSuggestionDisplay = (result: GeocodingResult): string => {
    if (result.address?.house_number && result.address?.road) {
      const parts: string[] = [];
      parts.push(`${result.address.house_number} ${result.address.road}`);
      
      const city = result.address.city || result.address.town || result.address.village;
      if (city) parts.push(city);
      if (result.address.state) parts.push(result.address.state);
      if (result.address.postcode) parts.push(result.address.postcode);
      
      return parts.join(', ');
    }
    // Fallback to formatted address
    return formatAddressShort(result.display_name, result.address);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-700">
          Location
        </label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="h-3 w-3" />
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
            placeholder="Enter house number and street name..."
            className="w-full px-2 py-1.5 pl-7 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-transparent h-[30px]"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((result, index) => {
              const displayText = formatSuggestionDisplay(result);
              const hasHouseNumber = !!result.address?.house_number;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(result)}
                  className="w-full px-2 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start space-x-1">
                    <MapPin className={`h-3 w-3 mt-0.5 flex-shrink-0 ${hasHouseNumber ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-900">{displayText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="text-xs text-green-600 flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-md mt-1">
          <MapPin className="h-3 w-3" />
          <span className="font-medium">Location set</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {locationHint && (
        <div className="flex items-start space-x-1 bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-1">
          <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">{locationHint}</p>
        </div>
      )}
    </div>
  );
};
