import React, { useCallback, useRef, useState } from 'react';
import {
  GoogleMap as GoogleMapBase,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';

// Default center: India
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;
const USER_ZOOM = 14;

// Dark map style matching the existing EzPark dark theme
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a8b2d8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6272a4' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#16213e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a5568' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#0f3460' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a3e' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8892b0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1b3a6b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f3460' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a8b2d8' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#16213e' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6272a4' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d1b2a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a5568' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d1b2a' }],
  },
];

/**
 * Resolve marker icon based on spot availability.
 * Returns a Google Maps SymbolPath circle icon object with a color-coded pin.
 */
function getMarkerIcon(spot, isSelected) {
  const { availableSlots } = spot;

  let color = '#10b981'; // green — many slots
  if (availableSlots === 0) {
    color = '#ef4444'; // red — full
  } else if (availableSlots <= 5) {
    color = '#f59e0b'; // yellow — limited
  }

  const scale = isSelected ? 16 : 11;
  const borderColor = isSelected ? '#ffffff' : '#0d1b2a';
  const borderWidth = isSelected ? 3 : 2;

  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: borderColor,
    strokeWeight: borderWidth,
    scale,
  };
}

/**
 * GoogleMap — Reusable Google Maps component for EzPark.
 *
 * Props:
 *   markers       {Array}    — Parking spot objects with {id, name, latitude, longitude,
 *                              availableSlots, pricePerHour} fields.
 *   selectedId    {any}      — ID of the currently selected spot (highlights marker + pans).
 *   onMarkerClick {Function} — Called with (spotId) when a marker is clicked.
 *   className     {string}   — Optional extra CSS class for the outer container.
 *   style         {Object}   — Optional inline style overrides for the outer container.
 */
export default function GoogleMap({
  markers = [],
  selectedId = null,
  onMarkerClick,
  className = '',
  style = {},
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    id: 'ezpark-google-map-script',
  });

  const mapRef = useRef(null);
  const [center, setCenter] = useState(INDIA_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [userLocated, setUserLocated] = useState(false);
  const [activePopup, setActivePopup] = useState(null);

  // Save map instance and request geolocation once map is ready
  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;

      if (!userLocated && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCenter = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setCenter(userCenter);
            setZoom(USER_ZOOM);
            setUserLocated(true);
            map.panTo(userCenter);
            map.setZoom(USER_ZOOM);
          },
          () => {
            // Permission denied or error — stay on India default; no action needed
          }
        );
      }
    },
    [userLocated]
  );

  // Pan to and highlight the selected marker whenever selectedId changes
  React.useEffect(() => {
    if (!mapRef.current || selectedId == null) return;
    const spot = markers.find((s) => s.id === selectedId);
    if (!spot) return;
    mapRef.current.panTo({ lat: spot.latitude, lng: spot.longitude });
    mapRef.current.setZoom(15);
    setActivePopup(selectedId);
  }, [selectedId, markers]);

  // ── Missing API key state
  if (!apiKey) {
    return (
      <div className={`gmap-state-wrapper gmap-error-state ${className}`} style={style}>
        <div className="gmap-state-icon">🗺️</div>
        <p className="gmap-state-title">Google Maps API Key Missing</p>
        <p className="gmap-state-body">
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file and restart the
          dev server.
        </p>
      </div>
    );
  }

  // ── Load error state
  if (loadError) {
    return (
      <div className={`gmap-state-wrapper gmap-error-state ${className}`} style={style}>
        <div className="gmap-state-icon">⚠️</div>
        <p className="gmap-state-title">Failed to load Google Maps</p>
        <p className="gmap-state-body">
          Check your API key and network connection, then reload the page.
        </p>
      </div>
    );
  }

  // ── Loading state
  if (!isLoaded) {
    return (
      <div className={`gmap-state-wrapper gmap-loading-state ${className}`} style={style}>
        <div className="gmap-spinner" />
        <p className="gmap-state-title">Loading map…</p>
      </div>
    );
  }

  // ── Loaded map
  return (
    <div className={`gmap-root ${className}`} style={style}>
      <GoogleMapBase
        mapContainerClassName="gmap-canvas"
        center={center}
        zoom={zoom}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        }}
        onLoad={onMapLoad}
        onClick={() => setActivePopup(null)}
      >
        {/* Render a marker for every visible parking spot */}
        {markers.map((spot) => {
          const isSelected = spot.id === selectedId;
          return (
            <Marker
              key={spot.id}
              position={{ lat: spot.latitude, lng: spot.longitude }}
              icon={getMarkerIcon(spot, isSelected)}
              title={spot.name}
              zIndex={isSelected ? 10 : 1}
              onClick={() => {
                onMarkerClick?.(spot.id);
                setActivePopup(spot.id);
              }}
            />
          );
        })}

        {/* InfoWindow popup for the active marker */}
        {activePopup != null &&
          (() => {
            const spot = markers.find((s) => s.id === activePopup);
            if (!spot) return null;
            return (
              <InfoWindow
                position={{ lat: spot.latitude, lng: spot.longitude }}
                onCloseClick={() => setActivePopup(null)}
                options={{ pixelOffset: new window.google.maps.Size(0, -16) }}
              >
                <div className="gmap-popup-card">
                  <h4 className="gmap-popup-title">{spot.name}</h4>
                  <div className="gmap-popup-meta">
                    <span>
                      {spot.availableSlots === 0
                        ? 'Full'
                        : `${spot.availableSlots} slots free`}
                    </span>
                    <span>${spot.pricePerHour?.toFixed(2)}/hr</span>
                  </div>
                  <a href="#booking" className="gmap-popup-btn">
                    Reserve Space
                  </a>
                </div>
              </InfoWindow>
            );
          })()}
      </GoogleMapBase>
    </div>
  );
}
