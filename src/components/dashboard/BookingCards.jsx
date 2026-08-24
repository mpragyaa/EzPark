import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Navigation, CalendarCheck, Clock, MapPin, X, Trash2, RotateCcw } from 'lucide-react';
import { parkingService } from '../../services/parkingService';
import { bookingService } from '../../services/bookingService';
import { useBooking } from '../../contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

// 1. Segmented History Bookings Component (Default Export)
export default function BookingCards({ bookings = [], onCancelSuccess }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);

  const { setSelectedFacility } = useBooking();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleOpenQR = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = async (bookingId, slotId, facilityId) => {
    if (!window.confirm('Are you sure you want to cancel this booking reservation?')) return;
    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId, slotId, facilityId);
      showToast('Booking cancelled successfully. Refund initiated.', 'success');
      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Cancellation failed.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRebook = async (facilityId) => {
    try {
      const data = await parkingService.fetchLots();
      const lot = data.find((l) => l.id === facilityId);
      if (lot) {
        const normalSpot = {
          id: lot.id,
          name: lot.name,
          address: lot.address ?? '',
          city: lot.city ?? '',
          latitude: lot.latitude,
          longitude: lot.longitude,
          totalSlots: lot.total_slots ?? 100,
          availableSlots: lot.available_slots ?? 10,
          pricePerHour: parseFloat(lot.price_per_hour ?? 30),
          rating: lot.rating ?? null,
          hasEVCharging: lot.has_ev_charging ?? false,
          hasCCTV: lot.has_cctv ?? true,
          isCovered: lot.is_covered ?? false,
          isOpen: lot.is_open ?? true,
          distanceKm: 0,
          distance: 0,
          vehicleTypes: lot.has_ev_charging ? ['car', 'ev'] : ['car', 'bike']
        };
        setSelectedFacility(normalSpot);
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  // Filter bookings based on status and time segments
  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    const isCancelled = b.status === 'Cancelled';
    const bDate = new Date(`${b.booking_date}T${b.entry_time}`);

    if (activeTab === 'upcoming') {
      return !isCancelled && bDate >= now;
    }
    if (activeTab === 'completed') {
      return !isCancelled && bDate < now;
    }
    if (activeTab === 'cancelled') {
      return isCancelled;
    }
    return false;
  });

  const displayBookings = filteredBookings.map((b) => ({
    id: b.id,
    parkingName: b.parking_facilities?.name || 'EZPARK Facility',
    address: b.parking_facilities?.address || '',
    date: b.booking_date,
    time: `${b.entry_time} - ${b.exit_time}`,
    duration: `₹${parseFloat(b.total_amount).toFixed(2)}`,
    status: b.status,
    slot_id: b.slot_id,
    facility_id: b.facility_id,
    vehicle: b.vehicle_type,
    spotCode: b.slot_id?.substring(0, 4).toUpperCase() || 'A3'
  }));

  return (
    <div className="dashboard-section-panel">
      {/* Tab Segment Controls */}
      <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="panel-title">My Bookings</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CalendarCheck size={12} />
            History Log
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem'
        }}>
          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.45rem',
                fontSize: '0.75rem',
                fontWeight: 650,
                borderRadius: '4px',
                textAlign: 'center',
                textTransform: 'capitalize',
                backgroundColor: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bookings-list-flow" style={{ marginTop: '0.85rem' }}>
        {displayBookings.length > 0 ? (
          displayBookings.map((booking) => (
            <div key={booking.id} className="booking-card-item" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              textAlign: 'left'
            }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 className="booking-name-title" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                    {booking.parkingName}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                    {booking.address}
                  </span>
                </div>

                <span className={`booking-badge-status ${booking.status === 'Confirmed' ? 'confirmed' : 'cancelled'}`} style={{
                  backgroundColor: booking.status === 'Confirmed' ? 'var(--color-success-glow)' : 'var(--color-error-glow)',
                  color: booking.status === 'Confirmed' ? 'var(--color-success)' : 'var(--color-error)',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {booking.status}
                </span>
              </div>

              {/* Meta lines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📅 Date & Time:</span>
                  <strong>{booking.date} ({booking.time})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🚗 Vehicle & Space:</span>
                  <strong>{booking.vehicle.toUpperCase()} • Slot {booking.spotCode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>💰 Paid Amount:</span>
                  <strong style={{ color: 'var(--color-success)' }}>{booking.duration}</strong>
                </div>
              </div>

              {/* Actions row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.65rem', width: '100%' }}>
                {activeTab === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(booking.id, booking.slot_id, booking.facility_id)}
                    disabled={cancellingId === booking.id}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 650,
                      color: 'var(--color-error)',
                      backgroundColor: 'var(--color-error-glow)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: cancellingId === booking.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                )}

                {(activeTab === 'completed' || activeTab === 'cancelled') && (
                  <button
                    type="button"
                    onClick={() => handleRebook(booking.facility_id)}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 650,
                      color: 'var(--color-primary)',
                      backgroundColor: 'var(--color-primary-glow)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <RotateCcw size={12} />
                    Rebook Space
                  </button>
                )}

                {booking.status === 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => handleOpenQR(booking)}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 650,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <QrCode size={12} />
                    View Access Pass
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No bookings found under this category.
          </div>
        )}
      </div>

      {/* QR Code display Modal popup */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: 'min(380px, 92%)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative'
              }}
            >
              {/* Close icon */}
              <button 
                type="button" 
                style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}
                onClick={() => setSelectedBooking(null)}
              >
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Access Pass</h3>
                <p className="modal-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Scan at facility gate barrier to open
                </p>
              </div>

              {/* Glowing SVG QR Placeholder */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)'
              }}>
                <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
                  <rect x="5" y="5" width="25" height="25" rx="2" stroke="#0a0a12" strokeWidth="6" />
                  <rect x="5" y="70" width="25" height="25" rx="2" stroke="#0a0a12" strokeWidth="6" />
                  <rect x="70" y="5" width="25" height="25" rx="2" stroke="#0a0a12" strokeWidth="6" />
                  
                  <rect x="14" y="14" width="7" height="7" fill="#0a0a12" />
                  <rect x="14" y="79" width="7" height="7" fill="#0a0a12" />
                  <rect x="79" y="14" width="7" height="7" fill="#0a0a12" />

                  <path d="M40 10 h15 v5 h-15 z M45 20 h5 v10 h-5 z M10 40 h10 v5 h-10 z M15 50 h20 v5 h-20 z M55 40 h15 v5 h-15 z M40 60 h10 v15 h-10 z M60 60 h20 v5 h-20 z M70 80 h15 v10 h-15 z" fill="#0a0a12" />
                  <rect x="44" y="44" width="12" height="12" fill="#3b82f6" style={{ opacity: 0.8 }} />
                </svg>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <strong>{selectedBooking.parkingName}</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  BOOKING REF: {selectedBooking.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <button 
                type="button" 
                className="btn-auth-submit" 
                style={{ width: '100%', padding: '0.65rem', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}
                onClick={() => setSelectedBooking(null)}
              >
                Close Pass
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 2. Nearby Recommendations Cards Component (Named Export)
export function NearbyRecommendations({ onBookLot }) {
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    const loadNearby = async () => {
      try {
        const data = await parkingService.fetchLots();
        const formatted = data.slice(0, 3).map((lot, idx) => ({
          id: lot.id,
          name: lot.name,
          address: lot.address ?? '',
          city: lot.city ?? '',
          latitude: lot.latitude,
          longitude: lot.longitude,
          totalSlots: lot.total_slots ?? 100,
          pricePerHour: parseFloat(lot.price_per_hour),
          availableSlots: bookingService.getLocalFacilityAvailableSlots(lot.id, lot.available_slots),
          isOpen: lot.is_open,
          rating: lot.rating ?? 4.0,
          hasEVCharging: lot.has_ev_charging,
          hasCCTV: lot.has_cctv,
          isCovered: lot.is_covered,
          distance: `${(0.2 + idx * 0.25).toFixed(1)} km`,
        }));
        setSpots(formatted);
      } catch (err) {
        console.error('Error loading nearby lots:', err);
      }
    };
    loadNearby();
  }, []);

  return (
    <div className="dashboard-section-panel">
      <div className="panel-header">
        <h3 className="panel-title">Nearby Parking</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={12} />
          New Delhi
        </span>
      </div>

      <div className="nearby-grid-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.85rem' }}>
        {spots.length > 0 ? (
          spots.map((spot) => (
            <div key={spot.id} className="nearby-mini-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              textAlign: 'left'
            }}>
              {/* Left detail */}
              <div className="mini-card-details" style={{ minWidth: 0, flex: 1 }}>
                <h4 className="mini-card-title" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {spot.name}
                </h4>
                <div className="mini-card-meta" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>{spot.distance}</span>
                  <span style={{ margin: '0 0.35rem' }}>•</span>
                  <span>₹{spot.pricePerHour?.toFixed(2)}/hr</span>
                  <span style={{ margin: '0 0.35rem' }}>•</span>
                  <span style={{ color: spot.availableSlots === 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
                    {spot.availableSlots === 0 ? 'Full' : `${spot.availableSlots} slots left`}
                  </span>
                </div>
              </div>

              {/* Right actions */}
              <div className="mini-card-actions" style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  type="button"
                  className="btn-mini-secondary"
                  title="Navigate GPS"
                  onClick={() => {
                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Navigation size={12} />
                </button>
                <button
                  type="button"
                  className="btn-mini-primary"
                  onClick={() => onBookLot?.(spot)}
                  disabled={spot.availableSlots === 0}
                  style={{
                    backgroundColor: spot.availableSlots === 0 ? 'rgba(255,255,255,0.05)' : 'var(--color-primary)',
                    color: spot.availableSlots === 0 ? 'var(--text-muted)' : '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    padding: '0.35rem 0.75rem',
                    cursor: spot.availableSlots === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Reserve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
            Searching nearby locations...
          </div>
        )}
      </div>
    </div>
  );
}
