/**
 * ParkingDetails.jsx
 *
 * Slide-in side panel that displays full facility details,
 * interactive slot selection floor maps, and a real-time price calculator checkout.
 * Opens when a parking card or map marker is clicked.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../contexts/BookingContext';
import { formatDateLabel, formatTimeLabel } from '../../utils/formatters';
import { parkingService } from '../../services/parkingService';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { favoritesService } from '../../services/favoritesService';
import { useAuth } from '../../contexts/AuthContext';
import ParkingAvailability from './ParkingAvailability';
import SlotGrid from '../booking/SlotGrid';
import BookingReview from './BookingReview';
import PaymentModal from '../payment/PaymentModal';

const NA = 'Information unavailable';

function val(v, fmt) {
  if (v === null || v === undefined || v === '') return NA;
  return fmt ? fmt(v) : v;
}

function formatPrice(p) {
  const n = parseFloat(p);
  return isNaN(n) ? NA : `₹${n.toFixed(2)} / hr`;
}

function formatRating(r) {
  const n = parseFloat(r);
  return isNaN(n) ? NA : `★ ${n.toFixed(1)} / 5.0`;
}

function formatDistance(d) {
  if (d === null || d === undefined) return null;
  const km = parseFloat(d);
  if (isNaN(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

// Seeded offline fallback generator to keep slots stable per facility ID
function generateMockSlots(facilityId, activeVehicleType) {
  const slots = [];
  const floors = ['G', '1', '2'];
  const types = ['car', 'bike', 'ev'];
  
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
    const type = seededRandom() > 0.4 ? activeVehicleType : types[Math.floor(seededRandom() * types.length)];
    
    const rand = seededRandom();
    const rawStatus = rand < 0.6 ? 'available' : (rand < 0.8 ? 'reserved' : 'occupied');
    
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

export default function ParkingDetails({ facility, onClose, onBookNow, showDistance = false }) {
  const isOpen = Boolean(facility);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`pd-backdrop${isOpen ? ' pd-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        className={`pd-panel${isOpen ? ' pd-panel--open' : ''}`}
        aria-label="Parking facility details"
        role="dialog"
        aria-modal="true"
        style={{ width: 'min(480px, 100%)' }} // widened slightly to fit slots grid layout
      >
        {facility && (
          <PanelContent
            facility={facility}
            onClose={onClose}
            onBookNow={onBookNow}
            showDistance={showDistance}
          />
        )}
      </aside>
    </>
  );
}

function PanelContent({ facility, onClose, onBookNow, showDistance }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    vehicleType,
    date,
    time,
    duration,
    selectedSlot,
    setSelectedSlot,
    destination: searchDestination,
  } = useBooking();

  const {
    id: facilityId,
    name,
    address,
    city,
    availableSlots,
    totalSlots,
    pricePerHour,
    rating,
    isOpen: facilityIsOpen,
    distanceKm,
    openingHours,
    isExternal,
  } = facility;

  const distanceStr = showDistance ? formatDistance(distanceKm) : null;
  const fullAddress = [address, city].filter(Boolean).join(', ') || NA;

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Sprint 2 Checkout Steps
  const [step, setStep] = useState('details'); // 'details' | 'review'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && facilityId) {
      favoritesService.isFavorite(user.id, facilityId).then(setIsFavorite);
    }
  }, [user, facilityId]);

  const handleToggleFavorite = async () => {
    if (!user) return;
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(user.id, facilityId);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite(user.id, facilityId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // ── Load available slots dynamically inside the details panel ──────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const data = await parkingService.fetchSlotsForLot(facilityId);
        const mapped = data.map((s) => ({
          ...s,
          status: bookingService.getLocalSlotStatusOverride(s.id) || s.status,
        }));
        if (!cancelled) {
          setSlots(mapped);
          setLoadingSlots(false);
        }
      } catch (err) {
        // Fallback slots
        const mocks = generateMockSlots(facilityId, vehicleType);
        if (!cancelled) {
          setSlots(mocks);
          setLoadingSlots(false);
        }
      }
    }
    fetchSlots();
    // Reset steps when facilityId changes
    setStep('details');
    setOrderId(null);
    setPaymentTotals(null);
    return () => { cancelled = true; };
  }, [facilityId, vehicleType]);

  // Filter slots to show EV compatible slots for EV search, or vehicle compatible slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (vehicleType === 'all') return true;
      if (vehicleType === 'ev') return slot.has_ev_charging;
      return slot.type === vehicleType;
    });
  }, [slots, vehicleType]);

  // Price calculation
  const estimatedPrice = (pricePerHour ?? 0) * (duration ?? 2);

  const handleEditSearch = () => {
    onClose?.();
    navigate('/');
    setTimeout(() => {
      const el = document.querySelector('.map-section-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Triggered when checkout proceed click initiates orders
  const handleProceedToPayment = async (totals) => {
    setPaymentTotals(totals);
    try {
      const order = await paymentService.createOrder(facilityId, duration, totals.couponCode);
      
      const newBookingId = await onBookNow?.(facility, {
        grandTotal: order.amount,
        discount: totals.discount || 0,
        couponCode: totals.couponCode || null,
        status: 'Pending',
        razorpay_order_id: order.orderId
      });

      if (!newBookingId) {
        throw new Error('Failed to create pending booking.');
      }

      setBookingId(newBookingId);
      setOrderId(order.orderId);
      setOrderDetails(order.orderDetails);
      setIsPaymentOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error initiating checkout: ' + err.message);
    }
  };

  const handlePaymentSuccess = async (response) => {
    setIsPaymentOpen(false);
    try {
      const isVerified = await paymentService.verifyPaymentSignature(response, bookingId);
      if (isVerified) {
        onClose?.();
        navigate('/dashboard');
      } else {
        alert('Payment verification failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying payment: ' + err.message);
    }
  };

  return (
    <div className="pd-inner">
      {/* ── Header ── */}
      <div className="pd-header">
        <div className="pd-header-text">
          <div className="pd-status-row">
            {!isExternal && (
              <span className={`pd-open-badge ${facilityIsOpen ? 'open' : 'closed'}`}>
                <span className="pd-open-dot" />
                {facilityIsOpen ? 'Open Now' : 'Closed'}
              </span>
            )}
            {distanceStr && (
              <span className="pd-distance-chip">
                📍 {distanceStr}
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleFavorite}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: isFavorite ? '#ef4444' : 'var(--text-muted)',
                marginLeft: 'auto',
                transition: 'transform 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
          <h2 className="pd-title">{val(name)}</h2>
          <p className="pd-address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {fullAddress}
          </p>
        </div>
        <button className="pd-close-btn" onClick={onClose} aria-label="Close details">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      {step === 'details' ? (
        <div className="pd-body" style={{ paddingTop: '0.75rem' }}>
          {/* Dynamic Premium Image Carousel Placeholder */}
          <div style={{
            width: '100%',
            height: '160px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <img
              src={
                facilityId?.includes('delhi-1')
                  ? 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=600' // Connaught Place multilevel
                  : facilityId?.includes('delhi-2')
                    ? 'https://images.unsplash.com/photo-1616363088386-31c4a85148a0?q=80&w=600' // Lajpat Nagar garage
                    : 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=600' // default modern garage
              }
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10, 10, 18, 0.9) 10%, rgba(10, 10, 18, 0) 70%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  📷 Visual Concept Representation
                </span>
                {isExternal ? (
                  <span className="badge-status closed" style={{ padding: '0.15rem 0.45rem', fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    External Parking
                  </span>
                ) : (
                  <span className="badge-status open" style={{ padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>
                    ✓ EzPark Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Walk ETA & Smart GPS Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                🚗 Navigation Link
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {distanceStr ? `${distanceStr} • ~${Math.round(distanceKm * 13)} mins walk` : 'Center map to calculate route'}
              </span>
            </div>
            <button
              type="button"
              className="pd-btn pd-btn--secondary"
              onClick={() => {
                const navUrl = facility.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
                window.open(navUrl, '_blank');
              }}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-primary-glow)',
                borderColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              🗺️ Navigate
            </button>
          </div>

          {/* Key stats grid */}
          <div className="pd-stats-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="pd-stat-card">
              <span className="pd-stat-label">Rate</span>
              <span className="pd-stat-value">
                {isExternal ? 'Pricing unavailable' : pricePerHour != null && !isNaN(pricePerHour) ? formatPrice(pricePerHour) : 'Unavailable'}
              </span>
            </div>
            <div className="pd-stat-card">
              <span className="pd-stat-label">Rating</span>
              <span className="pd-stat-value pd-stat-rating">{isExternal ? 'NA' : rating != null ? formatRating(rating) : 'NA'}</span>
            </div>
            <div className="pd-stat-card">
              <span className="pd-stat-label">Opening Hours</span>
              <span className="pd-stat-value">{isExternal ? 'Unavailable' : val(openingHours || '24/7 Open')}</span>
            </div>
            <div className="pd-stat-card">
              <span className="pd-stat-label">Total Slots</span>
              <span className="pd-stat-value">{isExternal ? 'Availability unavailable' : totalSlots != null ? val(totalSlots) : 'Unavailable'}</span>
            </div>
          </div>

          {/* Dynamic Amenities & Vehicle Compatibility Badges */}
          {!isExternal && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                🚗 Compatible: CAR
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                🏍️ Compatible: BIKE
              </span>
              {facility.hasEVCharging && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-success-glow)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--color-success)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  ⚡ Compatible: EV
                </span>
              )}
              {facility.isCovered && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  ☂️ Covered Parking
                </span>
              )}
              {facility.hasCCTV && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  📹 CCTV Active
                </span>
              )}
            </div>
          )}

          {/* Available slots count visual indicator */}
          {!isExternal && availableSlots != null && totalSlots != null && (
            <div style={{ marginBottom: '1.25rem' }}>
              <ParkingAvailability
                availableSlots={availableSlots}
                totalSlots={totalSlots}
              />
            </div>
          )}

          {/* ── Interactive Floor Grid for direct Slot Selection ── */}
          {isExternal ? (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
              <h3 className="amenities-section-title" style={{ marginBottom: '0.85rem' }}>External Location</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This is a real parking location discovered via Geoapify Places.
                <br /><br />
                Because it is not managed by EzPark, we cannot provide pricing, availability, or booking functionality. You can still use the <strong>Navigate</strong> button above for accurate directions.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h3 className="amenities-section-title" style={{ marginBottom: '0.85rem' }}>Select Available Space</h3>
              
              {loadingSlots ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem' }}>
                  <div className="pd-loading-mini-spinner" style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.05)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'pd-mini-spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Loading slot map...</span>
                </div>
              ) : (
                <SlotGrid
                  slots={filteredSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="pd-body" style={{ paddingTop: '1.25rem' }}>
          {/* Render invoice summary page review screen */}
          <BookingReview
            facility={facility}
            vehicleType={vehicleType}
            date={date}
            time={time}
            duration={duration}
            selectedSlot={selectedSlot}
            pricePerHour={pricePerHour}
            onCancel={() => setStep('details')}
            onProceedToPayment={handleProceedToPayment}
          />
        </div>
      )}

      {/* ── Sticky Action Details Footer ── */}
      {step === 'details' && !isExternal && (
        <div className="pd-footer">
          <button
            className="pd-btn pd-btn--secondary"
            onClick={handleEditSearch}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: 'rotate(-45deg)' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Search
          </button>
          <button
            className="pd-btn pd-btn--primary"
            onClick={() => setStep('review')}
            disabled={!selectedSlot}
            style={{
              opacity: selectedSlot ? 1 : 0.5,
              cursor: selectedSlot ? 'pointer' : 'not-allowed'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {selectedSlot ? 'REVIEW BOOKING' : 'Select a Space'}
          </button>
        </div>
      )}

      {/* Payment Gateway Modal Overlay */}
      <PaymentModal
        isOpen={isPaymentOpen}
        amount={paymentTotals?.grandTotal || estimatedPrice}
        orderId={orderId}
        orderDetails={orderDetails}
        user={user}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setIsPaymentOpen(false)}
        onFailure={(err) => { alert(err.message || 'Payment transaction failed.'); setIsPaymentOpen(false); }}
      />

      <style>{`
        @keyframes pd-mini-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
