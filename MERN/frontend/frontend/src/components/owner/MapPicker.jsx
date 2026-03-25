import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

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

const RecenterOnLocation = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView({ lat, lng }, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [lat, lng, map]);

  return null;
};

const MapPicker = ({ lat, lng, onPick }) => {
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
        <RecenterOnLocation lat={lat} lng={lng} />

        {hasPosition ? (
          <CircleMarker center={{ lat, lng }} radius={10} pathOptions={{ color: '#0b5cff', fillColor: '#0b5cff', fillOpacity: 0.75 }} />
        ) : null}
      </MapContainer>
    </div>
  );
};

export default MapPicker;