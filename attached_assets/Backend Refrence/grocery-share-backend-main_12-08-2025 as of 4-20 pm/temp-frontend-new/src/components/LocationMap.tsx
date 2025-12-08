import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  lat: number;
  lng: number;
  address?: string;
  height?: string;
}

// Component to update map center when coordinates change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  lat,
  lng,
  address,
  height = '300px',
}) => {
  const [mapKey, setMapKey] = useState(0);

  // Force re-render when coordinates change significantly
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [lat, lng]);

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div 
        className="w-full bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">Enter an address to see the map</p>
      </div>
    );
  }

  const position: [number, number] = [lat, lng];

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm" style={{ height }}>
      <MapContainer
        key={mapKey}
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <ChangeView center={position} zoom={15} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            {address || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
