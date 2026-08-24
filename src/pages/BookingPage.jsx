/**
 * BookingPage.jsx
 *
 * Dedicated slot selection and booking confirmation page.
 * Loads available slots dynamically, supports interactive floor grids,
 * and processes reservations via bookingService.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import SlotGrid from '../components/booking/SlotGrid';
import BookingSummary from '../components/booking/BookingSummary';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { parkingService } from '../services/parkingService';
import { bookingService } from '../services/bookingService';

// ── Seeded Mock Slot Generator (Offline Fallback) ───────────────────────────
function generateMockSlots(facilityId, activeVehicleType) {
  const slots = [];
  const floors = ['G', '1', '2'];
  const types = ['car', 'bike', 'ev'];
  
  // Seed hash based on facility ID
  let seed = 0;
  for (let i = 0; i < String(facilityId).length; i++) {
    seed += String(facilityId).charCodeAt(i);
  }

  const seededRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const count = 16;
  for (let i = 1; i <= count; i++) {
    const floor = floors[Math.floor(seededRandom() * floors.length)];
    // Ensure at least some slots match the search vehicle type
    const type = seededRandom() > 0.4 ? activeVehicleType : types[Math.floor(seededRandom() * types.length)];
    
    // Status probability
    const rand = seededRandom();
    const rawStatus = rand < 0.6 ? 'available' : (rand < 0.8 ? 'reserved' : 'occupied');
    
    // Check if slot status has a local storage override (e.g. from local cancel/create)
    const slotId = `slot-${facilityId}-${i}`;
    const status = bookingService.getLocalSlotStatusOverride(slotId) || rawStatus;

    const isCovered = seededRandom() > 0.35;
    const hasEv = type === 'ev';

    slots.push({
      id: slotId,
      facility_id: facilityId,
      slot_number: `${floor}-${i.toString().padStart(2, '0')}`,
      floor,
      type,
      status,
      is_covered: isCovered,
      has_ev_charging: hasEv,
    });
  }

  return slots;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const {
    selectedFacility,
    setSelectedFacility,
    vehicleType,
    date,
    time,
    duration,
  } = useBooking();

  const [rawSlots, setRawSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Safeguard: Redirect if no facility selected ─────────────────────────────
  useEffect(() => {
    if (!selectedFacility) {
      showToast('Please select a parking facility first.', 'error');
      navigate('/map');
    }
  }, [selectedFacility, navigate, showToast]);

  // ── Load Slots (Supabase with Local Mock Fallback) ──────────────────────────
  useEffect(() => {
    if (!selectedFacility) return;

    let cancelled = false;
    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        // Attempt database fetch
        const data = await parkingService.fetchSlotsForLot(selectedFacility.id);
        
        // Re-read local status overrides
        const mapped = data.map((s) => ({
          ...s,
          status: bookingService.getLocalSlotStatusOverride(s.id) || s.status,
        }));

        if (!cancelled) {
          setRawSlots(mapped);
          setIsLoadingSlots(false);
        }
      } catch (err) {
        // Local mock fallback
        console.warn('[BookingPage] Database slots fetch failed — loading mock slots:', err);
        const mocks = generateMockSlots(selectedFacility.id, vehicleType);
        if (!cancelled) {
          setRawSlots(mocks);
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();
    return () => { cancelled = true; };
  }, [selectedFacility, vehicleType]);

  // ── Filter Slots by Selected Vehicle Type ──────────────────────────────────
  // Keeps only slots that are compatible with the searched vehicle type (e.g. EV slot for EV car).
  const filteredSlots = useMemo(() => {
    return rawSlots.filter((slot) => {
      if (vehicleType === 'all') return true;
      if (vehicleType === 'ev') return slot.has_ev_charging;
      return slot.type === vehicleType;
    });
  }, [rawSlots, vehicleType]);

  // ── Confirm Booking Handler ────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      showToast('Please log in to complete your reservation.', 'error');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      showToast('Please select a parking space from the grid.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const priceRate = parseFloat(selectedFacility.price_per_hour || 0);
      const totalAmount = priceRate * parseFloat(duration || 2);

      const bookingData = {
        user_id: user?.id || 'demo-user',
        facility_id: selectedFacility.id,
        slot_id: selectedSlot.id,
        vehicle_type: vehicleType,
        booking_date: date,
        entry_time: time,
        exit_time: time, // service computes exit time from duration
        total_amount: totalAmount,
      };

      await bookingService.createBooking(bookingData);

      showToast('Booking successfully secured!', 'success');
      setSelectedFacility(null); // clear select state on success
      navigate('/dashboard'); // route to dashboard to inspect passes
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to confirm booking.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = () => {
    setSelectedFacility(null);
    navigate('/map');
  };

  if (!selectedFacility) return null;

  return (
    <>
      <Navbar />
      
      <main style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        paddingTop: '6rem', // navbar clearance
        paddingBottom: '4rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          {/* Header */}
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem'
            }}>
              Select Your Parking Slot
            </h1>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Carry forward coordinates locked. Inspect multi-floor slots for <strong style={{ color: 'var(--text-primary)' }}>{selectedFacility.name}</strong>.
            </p>
          </div>

          {/* Checkout columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Left: Slot layout Selection */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Interactive Floor Grid
              </h3>

              {isLoadingSlots ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '4rem 1rem'
                }}>
                  <div className="map-loading-spinner" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Querying floor sensors...</p>
                </div>
              ) : (
                <SlotGrid
                  slots={filteredSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                />
              )}
            </div>

            {/* Right: Sticky Summary checkout panel */}
            <BookingSummary
              facility={selectedFacility}
              slot={selectedSlot}
              vehicleType={vehicleType}
              date={date}
              time={time}
              duration={duration}
              isSubmitting={isSubmitting}
              onConfirm={handleConfirmBooking}
              onCancel={handleCancelBooking}
            />
          </div>
        </div>
      </main>

      <style>{`
        .map-loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin-spin 0.8s linear infinite;
        }
        @keyframes spin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
