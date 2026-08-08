import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const originIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#0F766E;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#D97706;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const vehicleIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:4px;background:#111827;border:2px solid #14B8A6;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions?.length) return;
    if (positions.length === 1) {
      map.setView(positions[0], 11);
      return;
    }
    map.fitBounds(positions, { padding: [40, 40] });
  }, [map, positions]);
  return null;
}

export default function LogisticsMap({
  origin,
  destination,
  vehicleLocation,
  routeCoordinates = [],
  height = '420px',
  className = '',
}) {
  const polyline = routeCoordinates.map(([lng, lat]) => [lat, lng]);
  const markers = [];
  if (origin?.latitude != null) markers.push([origin.latitude, origin.longitude]);
  if (destination?.latitude != null) markers.push([destination.latitude, destination.longitude]);
  if (vehicleLocation?.latitude != null) {
    markers.push([vehicleLocation.latitude, vehicleLocation.longitude]);
  }
  if (polyline.length) markers.push(...polyline);

  const center = markers[0] || [22.9734, 78.6569];

  return (
    <div className={`overflow-hidden rounded-2xl border border-steel-200 ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={markers} />
        {origin?.latitude != null && (
          <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
            <Popup>
              <strong>Origin</strong>
              <div>{origin.city || origin.label || 'Origin'}</div>
            </Popup>
          </Marker>
        )}
        {destination?.latitude != null && (
          <Marker position={[destination.latitude, destination.longitude]} icon={destIcon}>
            <Popup>
              <strong>Destination</strong>
              <div>{destination.city || destination.label || 'Destination'}</div>
            </Popup>
          </Marker>
        )}
        {vehicleLocation?.latitude != null && (
          <Marker
            position={[vehicleLocation.latitude, vehicleLocation.longitude]}
            icon={vehicleIcon}
          >
            <Popup>
              <strong>Vehicle</strong>
              <div>Demo simulation position</div>
            </Popup>
          </Marker>
        )}
        {polyline.length > 1 && <Polyline positions={polyline} pathOptions={{ color: '#0F766E', weight: 4 }} />}
      </MapContainer>
    </div>
  );
}
