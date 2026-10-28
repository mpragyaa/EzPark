import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ParkingList from './ParkingList';
import { parkingService } from '../../services/parkingService';
import { fetchNearbyParking } from '../../services/geoapifyService';
import { findNearbyFacilities } from '../../services/parkingSearchService';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import LeafletMap from '../maps/LeafletMap';
import ParkingDetails from '../parking/ParkingDetails';
import AuthModal from '../auth/AuthModal';
import { favoritesService } from '../../services/favoritesService';
import '../../styles/map.css';

// ─── Supabase availability check ──────────────────────────────────────────────
const SUPABASE_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

// ─── Data normaliser ─────────────────────────────────────────────────────────
function normaliseSpot(lot) {
  return {
    id: lot.id,
    name: lot.name,
    address: lot.address ?? '',
    city: lot.city ?? '',
    latitude: lot.latitude,
    longitude: lot.longitude,
    totalSlots: lot.total_slots,
    availableSlots: bookingService.getLocalFacilityAvailableSlots(lot.id, lot.available_slots),
    pricePerHour: parseFloat(lot.price_per_hour),
    rating: lot.rating ?? null,
    hasEVCharging: lot.has_ev_charging,
    hasCCTV: lot.has_cctv,
    isCovered: lot.is_covered,
    isOpen: lot.is_open,
    distanceKm: 0,
    distance: 0,
    vehicleTypes: lot.has_ev_charging ? ['car', 'ev'] : ['car', 'bike'],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParkingMap() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Centralized booking state context
  const {
    destination,
    setDestination,
    selectedLocation,
    setSelectedLocation,
    vehicleType,
    setVehicleType,
    date,
    time,
    duration,
    searchRadius,
    setSearchRadius,
    priceLimit,
    setPriceLimit,
    selectedFacility,
    setSelectedFacility,
    selectedSlot,
    setSelectedSlot,
  } = useBooking();

  // Local filter / modal states
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedParkingId, setSelectedParkingId] = useState(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [resumeBookingOnAuth, setResumeBookingOnAuth] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  // Data state
  const [allSpots, setAllSpots] = useState([]);
  const [geoapifySpots, setGeoapifySpots] = useState([]);
  const [isExternalApiDown, setIsExternalApiDown] = useState(false);
  const [isExternalApiMissingKey, setIsExternalApiMissingKey] = useState(false);

  // Load user favorites
  useEffect(() => {
    async function loadFavs() {
      try {
        const list = await favoritesService.getFavorites(user?.id || 'demo-user');
        setFavorites(list.map(f => f.parking_id));
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    }
    loadFavs();
  }, [user]);

  const handleToggleFavorite = async (facilityId) => {
    const isFav = favorites.includes(facilityId);
    const activeUserId = user?.id || 'demo-user';
    try {
      if (isFav) {
        await favoritesService.removeFavorite(activeUserId, facilityId);
        setFavorites(prev => prev.filter(id => id !== facilityId));
        showToast('Removed from favorites.', 'success');
      } else {
        await favoritesService.addFavorite(activeUserId, facilityId);
        setFavorites(prev => [...prev, facilityId]);
        showToast('Saved to favorites.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update favorites.', 'error');
    }
  };

  // Async state
  const [isLoading, setIsLoading]   = useState(true);
  const [dataSource, setDataSource] = useState('supabase');

  function handleLocationSelect({ lat, lng, label }) {
    setSelectedLocation({ lat, lng, label });
    setSelectedParkingId(null);
    setSelectedFacility(null);

    try {
      const current = localStorage.getItem('ezpark_recent_searches');
      const list = current ? JSON.parse(current) : [];
      const filtered = list.filter((item) => item.label !== label);
      const updated = [{ label, lat, lng, time: Date.now() }, ...filtered].slice(0, 5);
      localStorage.setItem('ezpark_recent_searches', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectSpot(spotId) {
    setSelectedParkingId(spotId);
    const found =
      filteredSpots.find((s) => s.id === spotId) ??
      allSpots.find((s) => s.id === spotId) ??
      null;
    setSelectedFacility(found);
  }

  // Sync selectedParkingId when selectedFacility from context changes
  useEffect(() => {
    if (selectedFacility) {
      setSelectedParkingId(selectedFacility.id);
    } else {
      setSelectedParkingId(null);
    }
  }, [selectedFacility]);

  // Load internal parking facilities (Supabase)
  useEffect(() => {
    let cancelled = false;

    async function loadInternalFacilities() {
      setIsLoading(true);

      if (!SUPABASE_CONFIGURED) {
        console.warn('[ParkingMap] Supabase not configured.');
        if (!cancelled) {
          setAllSpots([]);
          setDataSource('no-config');
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await parkingService.fetchActiveVerifiedLots();
        const spots = data.map(normaliseSpot);
        if (!cancelled) {
          console.log(`[Discovery Pipeline] Supabase internal facilities count: ${spots.length}`);
          setAllSpots(spots);
          setDataSource('supabase');
        }
      } catch (err) {
        console.error('[Discovery Pipeline] Supabase fetch failed:', err);
        if (!cancelled) {
          setAllSpots([]);
          setDataSource('error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInternalFacilities();
    return () => { cancelled = true; };
  }, []);

  // Fetch external OSM parking when selectedLocation changes
  useEffect(() => {
    let cancelled = false;

    async function loadExternalFacilities() {
      if (!selectedLocation) {
        setGeoapifySpots([]);
        setIsExternalApiDown(false);
        setIsExternalApiMissingKey(false);
        return;
      }
      try {
        setIsExternalApiDown(false);
        setIsExternalApiMissingKey(false);
        const externalSpots = await fetchNearbyParking(selectedLocation.lat, selectedLocation.lng, searchRadius * 1000);
        if (!cancelled) {
          setGeoapifySpots(externalSpots);
        }
      } catch (err) {
        if (!cancelled) {
          setGeoapifySpots([]);
          if (err.message === 'MISSING_API_KEY') {
            console.warn('[Discovery Pipeline] Geoapify API key is not configured.');
            setIsExternalApiMissingKey(true);
          } else {
            console.error('[Discovery Pipeline] Failed to fetch external parking', err);
            setIsExternalApiDown(true);
          }
        }
      }
    }

    loadExternalFacilities();
    return () => { cancelled = true; };
  }, [selectedLocation, searchRadius]);

  const filteredSpots = useMemo(() => {
    // 1. Deduplicate: Remove external spots that are within 50 meters of an EzPark spot
    const deduplicatedExternal = geoapifySpots.filter(ext => {
      return !allSpots.some(int => {
        // Haversine approximation or rough lat/lng diff
        const latDiff = Math.abs(int.latitude - ext.latitude);
        const lngDiff = Math.abs(int.longitude - ext.longitude);
        // ~111km per degree. 50m is approx 0.00045 degrees
        return latDiff < 0.00045 && lngDiff < 0.00045;
      });
    });

    console.log(`[Discovery Pipeline] External spots before deduplication: ${geoapifySpots.length}`);
    console.log(`[Discovery Pipeline] External spots after 50m deduplication: ${deduplicatedExternal.length}`);

    const combinedSpots = [...allSpots, ...deduplicatedExternal];
    if (combinedSpots.length === 0) {
      console.log(`[Discovery Pipeline] Final combined results count: 0`);
      return [];
    }

    let results;

    if (selectedLocation) {
      results = findNearbyFacilities(
        combinedSpots,
        selectedLocation.lat,
        selectedLocation.lng,
        searchRadius
      );
      results = results.map((s) => ({ ...s, distance: s.distanceKm }));
    } else {
      results = combinedSpots.filter((spot) => {
        const q = (destination || '').toLowerCase();
        return (
          spot.name.toLowerCase().includes(q) ||
          spot.city.toLowerCase().includes(q)
        );
      });
    }

    return results.filter((spot) => {
      if (spot.isExternal) return true; // Keep external spots, no price/avail filtering
      const matchesPrice    = spot.pricePerHour <= priceLimit;
      const matchesVehicle  = vehicleType === 'all' || spot.vehicleTypes.includes(vehicleType);
      const matchesAvail    = !showAvailableOnly || (spot.availableSlots > 0 && spot.isOpen);
      return matchesPrice && matchesVehicle && matchesAvail;
    });

    console.log(`[Discovery Pipeline] Final results count after filtering: ${finalFiltered.length}`);
    return finalFiltered;
  }, [
    allSpots, geoapifySpots, selectedLocation, searchRadius,
    destination, priceLimit, vehicleType, showAvailableOnly,
  ]);

  // ── Execute reservation ──
  const executeBookingReservation = async (facilityObject, paymentData = {}) => {
    const targetFacility = facilityObject || selectedFacility;
    if (!targetFacility || !selectedSlot) {
      showToast('Please select a facility and a slot space.', 'error');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const priceRate = parseFloat(targetFacility.pricePerHour || targetFacility.price_per_hour || 0);
      const subtotal = priceRate * parseFloat(duration || 2);
      const { grandTotal = subtotal, status, razorpay_order_id } = paymentData;

      const bookingData = {
        user_id: user?.id || 'demo-user',
        facility_id: targetFacility.id,
        slot_id: selectedSlot.id,
        vehicle_type: vehicleType,
        booking_date: date,
        entry_time: time,
        exit_time: time,
        total_amount: grandTotal,
        status: status || 'Confirmed',
        razorpay_order_id
      };

      const booking = await bookingService.createBooking(bookingData);

      if (status === 'Pending') {
        return booking.id;
      }

      showToast('Booking successfully secured!', 'success');
      setSelectedFacility(null);
      setSelectedSlot(null);
      setPendingPaymentData(null);
      navigate('/dashboard');
      return booking.id;
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Booking reservation failed.', 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // ── Booking CTA handler (details panel) ──
  const handleBookNowCTA = async (facilityObject, paymentData = {}) => {
    setPendingPaymentData(paymentData);
    if (!isAuthenticated) {
      // Prompt modal login inline without loss of context
      setResumeBookingOnAuth(true);
      setIsAuthModalOpen(true);
      return;
    }
    // Proceed directly if logged in
    return await executeBookingReservation(facilityObject, paymentData);
  };

  // Inline auth modal callback triggers immediate checkout resumption
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (resumeBookingOnAuth) {
      setResumeBookingOnAuth(false);
      // Wait for AuthContext session user state update to complete
      setTimeout(() => {
        executeBookingReservation(selectedFacility, pendingPaymentData || {});
      }, 300);
    }
  };

  return (
    <section className="map-section-container">
      {/* Left Column: Filters + Parking List */}
      <ParkingList
        spots={filteredSpots}
        selectedParkingId={selectedParkingId}
        onCardClick={handleSelectSpot}
        searchQuery={destination}
        onSearchChange={setDestination}
        onLocationSelect={handleLocationSelect}
        priceLimit={priceLimit}
        onPriceChange={setPriceLimit}
        selectedVehicle={vehicleType}
        onVehicleChange={setVehicleType}
        showAvailableOnly={showAvailableOnly}
        onToggleAvailable={setShowAvailableOnly}
        selectedLocation={selectedLocation}
        searchRadius={searchRadius}
        onRadiusChange={setSearchRadius}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Right Column: map + details panel overlay */}
      <div className="map-column-wrapper">
        {/* Loading overlay */}
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="map-loading-spinner" />
            <p className="map-loading-text">Finding nearby parking...</p>
          </div>
        )}

        {/* Async checkout loader */}
        {isSubmittingBooking && (
          <div className="map-loading-overlay">
            <div className="map-loading-spinner" />
            <p className="map-loading-text">Reserving your space in realtime...</p>
          </div>
        )}

        {/* Empty state when no spots matched within distance */}
        {!isLoading && filteredSpots.length === 0 && selectedLocation && (
          <div className="map-data-banner">
            <span className="map-data-banner-icon">ℹ️</span>
            <span className="map-data-banner-text">
              No nearby parking found.
            </span>
          </div>
        )}

        {/* Fallback warning when Geoapify fails but we still have a map/internal results */}
        {!isLoading && isExternalApiDown && !isExternalApiMissingKey && (
          <div className="map-data-banner" style={{ top: '6rem', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--color-warning)' }}>
            <span className="map-data-banner-icon">⚠️</span>
            <span className="map-data-banner-text">
              External parking discovery is temporarily unavailable.
            </span>
          </div>
        )}

        {/* Missing API key warning */}
        {!isLoading && isExternalApiMissingKey && (
          <div className="map-data-banner" style={{ top: '6rem', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--color-error)' }}>
            <span className="map-data-banner-icon">⚠️</span>
            <span className="map-data-banner-text">
              External parking discovery is not configured.
            </span>
          </div>
        )}

        {/* Map always renders */}
        <LeafletMap
          markers={filteredSpots}
          selectedId={selectedParkingId}
          onMarkerClick={handleSelectSpot}
          centerOn={selectedLocation}
          destinationMarker={selectedLocation}
          userLocation={userLocation}
          onGeolocated={(latLng) => {
            setUserLocation(latLng);
            setSelectedLocation({
              lat: latLng[0],
              lng: latLng[1],
              label: 'Current Location',
            });
          }}
          onGeolocationDenied={() => {
            setUserLocation(null);
            setSelectedLocation({
              lat: 28.6139,
              lng: 77.2090,
              label: 'Delhi, India',
            });
          }}
        />

        {/* Details panel — direct slot grid select & summaries */}
        <ParkingDetails
          facility={selectedFacility}
          onClose={() => {
            setSelectedFacility(null);
          }}
          onBookNow={handleBookNowCTA}
          showDistance={Boolean(selectedLocation)}
        />
      </div>

      {/* Inline Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setResumeBookingOnAuth(false);
        }}
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
}
