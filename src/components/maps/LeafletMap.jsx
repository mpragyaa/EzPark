/**
 * LeafletMap — Reusable interactive map component for EzPark.
 *
 * Built with react-leaflet v4 + Leaflet + OpenStreetMap tiles.
 * No API key required. All parking facility data comes via props
 * so the parent (ParkingMap) can swap in live Supabase data at any time.
 *
 * Props
 * ─────
 *   markers       {Array}    Parking spot objects. Expected shape:
 *                              { id, name, address?, latitude, longitude,
 *                                availableSlots, totalSlots, pricePerHour,
 *                                rating?, isOpen? }
 *   selectedId    {any}      ID of the currently selected spot.
 *                            The matching marker is highlighted and the map
 *                            pans to it automatically.
 *   onMarkerClick {Function} Called with (spotId) when a marker is clicked.
 *   className     {string}   Optional extra CSS class on the outer wrapper.
 *   style         {Object}   Optional inline style overrides on the wrapper.
 */
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

// ─── Fix Leaflet's broken default icon paths under Vite / Webpack ──────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ─── Constants ───────────────────────────────────────────────────────────────
// Geographic centre of India
const INDIA_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const USER_ZOOM = 13;

// OpenStreetMap tile layer — free, no key required
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

// ─── Custom SVG marker factory ────────────────────────────────────────────────
/**
 * Build a Leaflet DivIcon with a coloured SVG pin that reflects slot availability.
 *   Green  → many slots available  (> 5)
 *   Amber  → limited slots         (1–5)
 *   Red    → full                  (0)
 * Selected markers are larger with a white ring.
 */
function buildMarkerIcon(spot, isSelected) {
  const { availableSlots } = spot;

  let color = '#10b981'; // green
  if (availableSlots === 0) {
    color = '#ef4444'; // red
  } else if (availableSlots <= 5) {
    color = '#f59e0b'; // amber
  }

  const outerR = isSelected ? 14 : 10;
  const innerR = isSelected ? 8 : 6;
  const ringWidth = isSelected ? 3 : 0;
  const size = (outerR + ringWidth) * 2 + 4; // canvas size
  const cx = size / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${isSelected ? `<circle cx="${cx}" cy="${cx}" r="${outerR}" fill="white" />` : ''}
      <circle cx="${cx}" cy="${cx}" r="${innerR}" fill="${color}" />
      <circle cx="${cx}" cy="${cx}" r="${innerR}" fill="${color}" opacity="0.35">
        <animate attributeName="r" values="${innerR};${innerR + 5};${innerR}" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>`;

  return L.divIcon({
    className: '', // suppress leaflet-div-icon default white box
    html: svg,
    iconSize: [size, size],
    iconAnchor: [cx, cx],
    popupAnchor: [0, -(cx + 4)],
  });
}

// ─── Internal: map controller sub-component ──────────────────────────────────
/**
 * MapController sits inside <MapContainer> and reacts to prop changes.
 * It handles:
 *   1. One-time geolocation request after mount.
 *   2. Fly-to animation whenever `selectedId` changes.
 */
function MapController({ markers, selectedId, onGeolocated }) {
  const map = useMap();
  const geolocatedRef = useRef(false);

  // Geolocation — runs once after the map mounts
  useEffect(() => {
    if (geolocatedRef.current) return;
    geolocatedRef.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLatLng = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(userLatLng, USER_ZOOM, { animate: true, duration: 1.5 });
        onGeolocated?.(userLatLng);
      },
      () => {
        // Permission denied or unavailable — stay on India default
      },
      { timeout: 8000 }
    );
  }, [map, onGeolocated]);

  // Pan to selected marker
  useEffect(() => {
    if (selectedId == null) return;
    const spot = markers.find((s) => s.id === selectedId);
    if (!spot) return;
    map.flyTo([spot.latitude, spot.longitude], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 1.0,
    });
  }, [selectedId, markers, map]);

  return null;
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function LeafletMap({
  markers = [],
  selectedId = null,
  onMarkerClick,
  className = '',
  style = {},
}) {
  const [geoError, setGeoError] = useState(false);

  // Geolocation permission check (best-effort, non-blocking)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
    }
  }, []);

  return (
    <div className={`lmap-root ${className}`} style={style}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="lmap-canvas"
        zoomControl={true}
        attributionControl={true}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap tile layer */}
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />

        {/* Pan-to controller + geolocation */}
        <MapController
          markers={markers}
          selectedId={selectedId}
          onGeolocated={null}
        />

        {/* Parking markers */}
        {markers.map((spot) => {
          const isSelected = spot.id === selectedId;
          const icon = buildMarkerIcon(spot, isSelected);
          const slotsLabel =
            spot.availableSlots === 0
              ? 'Full'
              : `${spot.availableSlots} / ${spot.totalSlots ?? '?'} slots free`;

          return (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={icon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onMarkerClick?.(spot.id),
              }}
            >
              <Popup className="lmap-popup" minWidth={220} maxWidth={260}>
                <div className="lmap-popup-card">
                  {/* Header */}
                  <div className="lmap-popup-header">
                    <h4 className="lmap-popup-title">{spot.name}</h4>
                    {spot.isOpen !== undefined && (
                      <span
                        className={`lmap-popup-badge ${spot.isOpen ? 'open' : 'closed'}`}
                      >
                        {spot.isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  {spot.address && (
                    <p className="lmap-popup-address">{spot.address}</p>
                  )}

                  {/* Stats grid */}
                  <div className="lmap-popup-stats">
                    <div className="lmap-popup-stat">
                      <span className="lmap-popup-stat-label">Slots</span>
                      <span
                        className={`lmap-popup-stat-value ${spot.availableSlots === 0 ? 'lmap-stat-red' : 'lmap-stat-green'
                          }`}
                      >
                        {slotsLabel}
                      </span>
                    </div>

                    <div className="lmap-popup-stat">
                      <span className="lmap-popup-stat-label">Price</span>
                      <span className="lmap-popup-stat-value">
                        ₹{spot.pricePerHour?.toFixed(2)}/hr
                      </span>
                    </div>

                    {spot.rating != null && (
                      <div className="lmap-popup-stat">
                        <span className="lmap-popup-stat-label">Rating</span>
                        <span className="lmap-popup-stat-value lmap-rating">
                          ★ {Number(spot.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reserve button */}
                  <a href="#booking" className="lmap-popup-btn">
                    Reserve Space
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Subtle geolocation-unavailable notice (non-blocking) */}
      {geoError && (
        <div className="lmap-geo-notice">
          📍 Geolocation unavailable — showing India
        </div>
      )}
    </div>
  );
}
