import React, { useState, useEffect } from 'react';
import ParkingList from './ParkingList';
import { parkingService } from '../../services/parkingService';
import { mockParkingFacilities } from '../../data/mockParkingFacilities';
import LeafletMap from '../maps/LeafletMap';
import '../../styles/map.css';

// ─── Supabase availability check ──────────────────────────────────────────────
// If env vars are missing we skip the network call entirely and go straight
// to mock data — no error will be thrown in the browser console.
const SUPABASE_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

// ─── Data normaliser ─────────────────────────────────────────────────────────
// Converts a raw parking_facilities row (Supabase or mock) into the shape
// expected by LeafletMap markers and ParkingList cards.
function normaliseSpot(lot, idx) {
  return {
    id: lot.id,
    name: lot.name,
    address: lot.address ?? '',
    city: lot.city ?? '',
    latitude: lot.latitude,
    longitude: lot.longitude,
    totalSlots: lot.total_slots,
    availableSlots: lot.available_slots,
    pricePerHour: parseFloat(lot.price_per_hour),
    rating: lot.rating ?? null,
    hasEVCharging: lot.has_ev_charging,
    hasCCTV: lot.has_cctv,
    isCovered: lot.is_covered,
    isOpen: lot.is_open,
    distance: 0.3 + idx * 0.25, // approximate — overridden when user geolocation lands
    vehicleTypes: lot.has_ev_charging ? ['car', 'ev'] : ['car', 'bike'],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParkingMap() {
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priceLimit, setPriceLimit] = useState(500);
  const [distanceLimit, setDistanceLimit] = useState(10.0);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Data state
  const [selectedParkingId, setSelectedParkingId] = useState(null);
  const [allSpots, setAllSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);

  // Async state
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState('supabase'); // 'supabase' | 'mock' | 'no-config'

  // 1. Load parking facilities — Supabase first, mock on any failure
  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      setIsLoading(true);

      // ── Skip Supabase entirely if not configured ──────────────────────────
      if (!SUPABASE_CONFIGURED) {
        console.info(
          '[ParkingMap] Supabase not configured — loading built-in mock data.'
        );
        const spots = mockParkingFacilities.map(normaliseSpot);
        if (!cancelled) {
          setAllSpots(spots);
          setFilteredSpots(spots);
          setDataSource('no-config');
          setIsLoading(false);
        }
        return;
      }

      // ── Try Supabase ──────────────────────────────────────────────────────
      try {
        const data = await parkingService.fetchLots();
        const spots = data.map(normaliseSpot);
        if (!cancelled) {
          setAllSpots(spots);
          setFilteredSpots(spots);
          setDataSource('supabase');
          setIsLoading(false);
        }
      } catch (err) {
        // ── Supabase failed — fall back to mock data ──────────────────────
        console.error('[ParkingMap] Supabase fetch failed — using mock data:', err);
        const spots = mockParkingFacilities.map(normaliseSpot);
        if (!cancelled) {
          setAllSpots(spots);
          setFilteredSpots(spots);
          setDataSource('mock');
          setIsLoading(false);
        }
      }
    }

    loadFacilities();
    return () => { cancelled = true; };
  }, []);

  // 2. Re-filter whenever search/filter controls or base data change
  useEffect(() => {
    if (allSpots.length === 0) return;

    const results = allSpots.filter((spot) => {
      const matchesSearch =
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice = spot.pricePerHour <= priceLimit;
      const matchesDistance = spot.distance <= distanceLimit;
      const matchesVehicle =
        selectedVehicle === 'all' || spot.vehicleTypes.includes(selectedVehicle);
      const matchesAvailability =
        !showAvailableOnly || (spot.availableSlots > 0 && spot.isOpen);

      return (
        matchesSearch &&
        matchesPrice &&
        matchesDistance &&
        matchesVehicle &&
        matchesAvailability
      );
    });

    setFilteredSpots(results);
  }, [searchQuery, priceLimit, distanceLimit, selectedVehicle, showAvailableOnly, allSpots]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="map-section-container">
      {/* Left Column: Filters + Parking List */}
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

      {/* Right Column: Leaflet / OpenStreetMap interactive map */}
      <div className="map-column-wrapper">
        {/* Loading overlay — shown while the first data fetch is in flight */}
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="map-loading-spinner" />
            <p className="map-loading-text">Loading parking facilities…</p>
          </div>
        )}

        {/* Offline / mock-data banner */}
        {!isLoading && dataSource !== 'supabase' && (
          <div className="map-data-banner">
            <span className="map-data-banner-icon">
              {dataSource === 'no-config' ? 'ℹ️' : '⚠️'}
            </span>
            <span className="map-data-banner-text">
              {dataSource === 'no-config'
                ? 'Supabase not configured — showing demo parking data.'
                : 'Using offline demo parking data.'}
            </span>
          </div>
        )}

        {/* The map always renders — even while loading or after an error */}
        <LeafletMap
          markers={filteredSpots}
          selectedId={selectedParkingId}
          onMarkerClick={setSelectedParkingId}
        />
      </div>
    </section>
  );
}
