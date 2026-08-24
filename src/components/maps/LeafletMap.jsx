/**
 * LeafletMap.jsx
 *
 * Interactive Leaflet + OpenStreetMap map.
 * Contains markers, popups, auto-pans, and Geolocation checks.
 * Optimized to prevent zero-height collapse and marker redraw lag.
 */

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Constants ───────────────────────────────────────────────────────────────
// Fallback city center (Delhi, India)
const DELHI_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM = 11;
const USER_ZOOM = 14;

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

// ─── Custom SVG marker factory ────────────────────────────────────────────────
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
  const size = (outerR + ringWidth) * 2 + 4;
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
    className: 'custom-map-marker-svg',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [cx, cx],
    popupAnchor: [0, -(cx + 4)],
  });
}

// ─── Memory-efficient Marker Icon Cache ──────────────────────────────────────
const iconCache = new Map();

function getCachedMarkerIcon(spot, isSelected) {
  const key = `${spot.id}-${isSelected}-${spot.availableSlots}`;
  if (iconCache.has(key)) {
    return iconCache.get(key);
  }
  const icon = buildMarkerIcon(spot, isSelected);
  iconCache.set(key, icon);
  return icon;
}

// ─── Destination marker icon (teardrop pin) ──────────────────────────────────
const DEST_ICON = L.divIcon({
  className: 'custom-destination-marker-svg',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0 C6.268 0 0 6.268 0 14 C0 24.5 14 36 14 36 C14 36 28 24.5 28 14 C28 6.268 21.732 0 14 0Z"
            fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="#ffffff"/>
    </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
});

// ─── Pulsing blue "You are here" user marker icon ────────────────────────────
const USER_LOC_ICON = L.divIcon({
  className: 'custom-user-location-marker-svg',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="2.5" />
      <circle cx="12" cy="12" r="8" fill="#3B82F6" opacity="0.35">
        <animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0;0.35" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Internal Map Controller ─────────────────────────────────────────────────
function MapController({ markers, selectedId, centerOn, onGeolocated, onGeolocationDenied, markerRefs }) {
  const map = useMap();
  const geolocatedRef = useRef(false);

  // Request browser geolocation on mount
  useEffect(() => {
    if (geolocatedRef.current) return;
    geolocatedRef.current = true;

    if (!navigator.geolocation) {
      onGeolocationDenied?.();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLatLng = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(userLatLng, USER_ZOOM, { animate: true, duration: 1.5 });
        onGeolocated?.(userLatLng);
      },
      () => {
        // Geolocation failed or permission denied — fly to Delhi fallback
        map.flyTo(DELHI_CENTER, DEFAULT_ZOOM, { animate: true, duration: 1.2 });
        onGeolocationDenied?.();
      },
      { timeout: 8000 }
    );
  }, [map, onGeolocated, onGeolocationDenied]);

  // Fly to selected parking marker and programmatically open popup
  useEffect(() => {
    if (selectedId == null) return;
    const spot = markers.find((s) => s.id === selectedId);
    if (!spot) return;

    map.flyTo([spot.latitude, spot.longitude], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 1.0,
    });

    // Programmatically open the marker popup on card select
    setTimeout(() => {
      const activeMarker = markerRefs.current[selectedId];
      if (activeMarker) {
        activeMarker.openPopup();
      }
    }, 350);
  }, [selectedId, markers, map, markerRefs]);

  // Fly to location selected from Places autocomplete
  useEffect(() => {
    if (!centerOn) return;
    map.flyTo([centerOn.lat, centerOn.lng], USER_ZOOM, { animate: true, duration: 1.2 });
  }, [centerOn, map]);

  return null;
}

// ─── Destination Marker Sub-component ────────────────────────────────────────
function DestinationMarker({ location }) {
  if (!location) return null;
  return (
    <Marker position={[location.lat, location.lng]} icon={DEST_ICON} zIndexOffset={2000}>
      <Popup className="lmap-popup" minWidth={180}>
        <div className="lmap-popup-card">
          <div className="lmap-popup-header">
            <h4 className="lmap-popup-title">📍 {location.label}</h4>
          </div>
          <p className="lmap-popup-address" style={{ marginTop: '0.25rem' }}>
            Searched destination
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Main Exported Component ─────────────────────────────────────────────────
export default function LeafletMap({
  markers = [],
  selectedId = null,
  onMarkerClick,
  centerOn = null,
  destinationMarker = null,
  userLocation = null,
  onGeolocated,
  onGeolocationDenied,
  className = '',
  style = {},
}) {
  const [geoError, setGeoError] = useState(false);
  const markerRefs = useRef({});

  return (
    <div
      className={`leaflet-map-element ${className}`}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <MapContainer
        center={DELHI_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{
          height: '100%',
          width: '100%',
          outline: 'none',
        }}
        zoomControl={true}
        attributionControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />

        <MapController
          markers={markers}
          selectedId={selectedId}
          centerOn={centerOn}
          onGeolocated={onGeolocated}
          onGeolocationDenied={() => {
            setGeoError(true);
            onGeolocationDenied?.();
          }}
          markerRefs={markerRefs}
        />

        {/* Pulsing blue "You are here" user location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={USER_LOC_ICON} zIndexOffset={3000}>
            <Popup className="lmap-popup" minWidth={100}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                📍 You are here
              </div>
            </Popup>
          </Marker>
        )}

        <DestinationMarker location={destinationMarker} />

        {/* Parking markers */}
        {markers.map((spot) => {
          const isSelected = spot.id === selectedId;
          const icon = getCachedMarkerIcon(spot, isSelected);
          const slotsLabel =
            spot.availableSlots === 0
              ? 'Full'
              : `${spot.availableSlots} / ${spot.totalSlots ?? '?'} slots free`;

          return (
            <Marker
              key={spot.id}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[spot.id] = ref;
                } else {
                  delete markerRefs.current[spot.id];
                }
              }}
              position={[spot.latitude, spot.longitude]}
              icon={icon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onMarkerClick?.(spot.id),
              }}
            >
              <Popup className="lmap-popup" minWidth={220} maxWidth={260}>
                <div className="lmap-popup-card">
                  <div className="lmap-popup-header">
                    <h4 className="lmap-popup-title">{spot.name}</h4>
                    {spot.isOpen !== undefined && (
                      <span className={`lmap-popup-badge ${spot.isOpen ? 'open' : 'closed'}`}>
                        {spot.isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {spot.address && (
                    <p className="lmap-popup-address">{spot.address}</p>
                  )}

                  <div className="lmap-popup-stats">
                    <div className="lmap-popup-stat">
                      <span className="lmap-popup-stat-label">Slots</span>
                      <span className={`lmap-popup-stat-value ${spot.availableSlots === 0 ? 'lmap-stat-red' : 'lmap-stat-green'}`}>
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
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Geolocation denied banner overlay */}
      {geoError && (
        <div className="lmap-geo-notice" style={{
          backgroundColor: 'var(--color-error-glow)',
          border: '1px solid var(--color-error)',
          color: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem',
          padding: '0.55rem 0.9rem',
          zIndex: 1000,
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          ⚠️ Location permission is required for nearby parking. Fallback to Delhi.
        </div>
      )}
    </div>
  );
}
