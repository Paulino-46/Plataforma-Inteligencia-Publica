'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapLocation, MapStatus } from '@/services/mapService';

const STATUS_COLOR: Record<MapStatus, string> = {
  Online: '#10b981',      // emerald-500
  Manutenção: '#f59e0b',  // amber-500
  Offline: '#ef4444',     // red-500
};

// Marcador customizado (sem depender dos assets padrão do Leaflet, que quebram no bundler).
function buildIcon(status: MapStatus): L.DivIcon {
  const color = STATUS_COLOR[status];
  return L.divIcon({
    className: 'appbit-marker',
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;width:28px;height:28px;border-radius:9999px;background:${color};opacity:.25;animation:appbitPing 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>
        <span style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #0f172a;box-shadow:0 0 10px ${color};"></span>
      </span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Recentra o mapa quando o foco muda (ex.: resultado de pesquisa).
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

interface LeafletMapProps {
  locations: MapLocation[];
  center: [number, number];
  focus?: [number, number] | null;
  zoom?: number;
}

export default function LeafletMap({ locations, center, focus, zoom = 6 }: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <ZoomControl position="bottomright" />
      {focus && <Recenter center={focus} zoom={9} />}
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={buildIcon(loc.status)}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong style={{ display: 'block', fontSize: 13 }}>{loc.name}</strong>
              <span style={{ fontSize: 11, color: STATUS_COLOR[loc.status], fontWeight: 700, textTransform: 'uppercase' }}>
                {loc.status}
              </span>
              {loc.detail && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569' }}>{loc.detail}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
