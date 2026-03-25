import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng;
      onPick({ lat, lng });
    },
  });

  return null;
};

const LocationPickerMap = ({ lat, lng, onPick }) => {
  const hasPosition = Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasPosition ? { lat, lng } : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={hasPosition ? 15 : 5} scrollWheelZoom className="h-80 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onPick={onPick} />

        {hasPosition ? (
          <CircleMarker center={{ lat, lng }} radius={8} pathOptions={{ color: '#0b5cff', fillColor: '#0b5cff', fillOpacity: 0.8 }} />
        ) : null}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;
