import React, { useState, useEffect, useRef } from 'react';
import ParkingList from './ParkingList';
import { parkingLocations } from '../../data/parkingData';
import { createCustomMarkerIcon } from './MapMarker';
import '../../styles/map.css';

// Dynamic Leaflet Loader Helper
const loadLeafletAssets = () => {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Append Leaflet Stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Append Leaflet Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      resolve(window.L);
    };
    document.body.appendChild(script);
  });
};

export default function ParkingMap() {
  const [L, setL] = useState(null);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceLimit, setPriceLimit] = useState(6.00);
  const [distanceLimit, setDistanceLimit] = useState(1.5);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  const [selectedParkingId, setSelectedParkingId] = useState(null);
  const [filteredSpots, setFilteredSpots] = useState(parkingLocations);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // 1. Load Leaflet library assets dynamically on mount
  useEffect(() => {
    loadLeafletAssets().then((leafletInstance) => {
      setL(leafletInstance);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Initialize Leaflet Map Instance once assets are loaded
  useEffect(() => {
    if (!L || mapInstanceRef.current) return;

    // Center on SOMA/Financial District SF area based on mock coordinates
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([37.7854, -122.4064], 14);

    // Dark Premium map styles provided by CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Create marker layers group container
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
  }, [L]);

  // 3. Filter parking spaces dataset in real-time based on state values
  useEffect(() => {
    const results = parkingLocations.filter((spot) => {
      // Real-time Text Search Filter
      const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price range check
      const matchesPrice = spot.pricePerHour <= priceLimit;

      // Distance limit check
      const matchesDistance = spot.distance <= distanceLimit;

      // Vehicle type check
      const matchesVehicle = selectedVehicle === 'all' || spot.vehicleTypes.includes(selectedVehicle);

      // Available spaces only check
      const matchesAvailability = !showAvailableOnly || (spot.availableSlots > 0 && spot.isOpen);

      return matchesSearch && matchesPrice && matchesDistance && matchesVehicle && matchesAvailability;
    });

    setFilteredSpots(results);
  }, [searchQuery, priceLimit, distanceLimit, selectedVehicle, showAvailableOnly]);

  // 4. Update map markers dynamically when filtered spots or selection state changes
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear old markers from map layer group
    markersLayerRef.current.clearLayers();

    // Map new custom markers
    filteredSpots.forEach((spot) => {
      const isSelected = spot.id === selectedParkingId;
      const markerIcon = createCustomMarkerIcon(L, spot, isSelected);

      const marker = L.marker([spot.latitude, spot.longitude], { icon: markerIcon })
        .addTo(markersLayerRef.current)
        .bindPopup(`
          <div class="popup-inner-card">
            <h4 class="popup-title">${spot.name}</h4>
            <div class="popup-meta">
              <span>${spot.availableSlots === 0 ? 'Full' : `${spot.availableSlots} slots free`}</span>
              <span>$${spot.pricePerHour.toFixed(2)}/hr</span>
            </div>
            <a href="#booking" class="popup-btn">Reserve Space</a>
          </div>
        `);

      // Trigger selection on marker click
      marker.on('click', () => {
        setSelectedParkingId(spot.id);
      });

      // Fly-to animation and open popup if card clicked from list
      if (isSelected) {
        mapInstanceRef.current.flyTo([spot.latitude, spot.longitude], 15, {
          animate: true,
          duration: 1.2
        });
        // Delay popup slightly to allow fly-to path to pan
        setTimeout(() => {
          if (mapInstanceRef.current) marker.openPopup();
        }, 1200);
      }
    });
  }, [L, filteredSpots, selectedParkingId]);

  return (
    <section className="map-section-container">
      {/* Left Column: List Column */}
      <ParkingList
        spots={filteredSpots}
        selectedParkingId={selectedParkingId}
        onCardClick={setSelectedParkingId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priceLimit={priceLimit}
        onPriceChange={setPriceLimit}
        distanceLimit={distanceLimit}
        onDistanceChange={setDistanceLimit}
        selectedVehicle={selectedVehicle}
        onVehicleChange={setSelectedVehicle}
        showAvailableOnly={showAvailableOnly}
        onToggleAvailable={setShowAvailableOnly}
      />

      {/* Right Column: Interactive Map container */}
      <div className="map-column-wrapper">
        <div ref={mapContainerRef} className="leaflet-map-element" />
      </div>
    </section>
  );
}
