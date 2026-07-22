import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Navigation, CalendarCheck, Clock, MapPin, X } from 'lucide-react';
import { parkingService } from '../../services/parkingService';

// 1. Upcoming Bookings List Component (Default Export)
export default function BookingCards({ bookings = [] }) {
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleOpenQR = (booking) => {
    setSelectedBooking(booking);
  };

  const displayBookings = bookings.map((b) => ({
    id: b.id,
    parkingName: b.parking_facilities?.name || 'EZPARK Facility',
    date: b.booking_date,
    time: `${b.entry_time} - ${b.exit_time}`,
    duration: `$${parseFloat(b.total_amount).toFixed(2)}`,
    status: b.status,
    spotCode: 'A3' // fallback visual spot code
  }));

  return (
    <div className="dashboard-section-panel">
      <div className="panel-header">
        <h3 className="panel-title">Upcoming Bookings</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CalendarCheck size={12} />
          Active
        </span>
      </div>

      <div className="bookings-list-flow">
        {displayBookings.length > 0 ? (
          displayBookings.map((booking) => (
            <div key={booking.id} className="booking-card-item">
              {/* Booking Details Info */}
              <div className="booking-info-details">
                <h4 className="booking-name-title">{booking.parkingName}</h4>
                <div className="booking-meta-line">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {booking.date} ({booking.time})
                  </span>
                  <span>•</span>
                  <span>{booking.duration}</span>
                </div>
                <span className={`booking-badge-status ${booking.status === 'Confirmed' ? 'confirmed' : 'cancelled'}`} style={{
                  backgroundColor: booking.status === 'Confirmed' ? 'var(--color-success-glow)' : 'var(--color-error-glow)',
                  color: booking.status === 'Confirmed' ? 'var(--color-success)' : 'var(--color-error)'
                }}>
                  {booking.status} • Spot {booking.spotCode}
                </span>
              </div>

              {/* QR Trigger Action */}
              <button
                type="button"
                className="btn-qr-scanner"
                title="View Scan QR Code"
                onClick={() => handleOpenQR(booking)}
              >
                <QrCode size={20} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No active reservations found.
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
            style={{ zIndex: 200 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: '380px' }}
            >
              {/* Close pin */}
              <div style={{ alignSelf: 'flex-end', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedBooking(null)}>
                <X size={20} />
              </div>

              <div className="modal-icon-wrapper" style={{ backgroundColor: 'var(--color-accent-glow)', color: 'var(--color-accent)', borderColor: 'var(--border-color)', boxShadow: 'none' }}>
                <QrCode size={30} />
              </div>

              <div>
                <h3 className="modal-title" style={{ fontSize: '1.4rem' }}>Access Pass</h3>
                <p className="modal-desc" style={{ fontSize: '0.85rem' }}>Scan at the facility gate to enter</p>
              </div>

              {/* Glowing SVG QR Placeholder */}
              <div className="qr-modal-image-wrapper">
                <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                  {/* Outer border lines */}
                  <rect x="5" y="5" width="25" height="25" rx="3" stroke="#050508" strokeWidth="6" />
                  <rect x="5" y="70" width="25" height="25" rx="3" stroke="#050508" strokeWidth="6" />
                  <rect x="70" y="5" width="25" height="25" rx="3" stroke="#050508" strokeWidth="6" />
                  
                  {/* Central QR Code matrix mock lines */}
                  <rect x="15" y="15" width="5" height="5" fill="#050508" />
                  <rect x="15" y="80" width="5" height="5" fill="#050508" />
                  <rect x="80" y="15" width="5" height="5" fill="#050508" />

                  {/* Random grid elements */}
                  <path d="M40 10 h15 v5 h-15 z M45 20 h5 v10 h-5 z M10 40 h10 v5 h-10 z M15 50 h20 v5 h-20 z M55 40 h15 v5 h-15 z M40 60 h10 v15 h-10 z M60 60 h20 v5 h-20 z M70 80 h15 v10 h-15 z" fill="#050508" />
                  <rect x="45" y="45" width="10" height="10" fill="var(--color-primary)" style={{ opacity: 0.8 }} />
                </svg>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <strong>{selectedBooking.parkingName}</strong>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-primary)' }}>
                  Booking Ref: {selectedBooking.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <button 
                type="button" 
                className="btn-auth-submit" 
                style={{ width: '100%', marginTop: '0.5rem' }}
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
export function NearbyRecommendations() {
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    const loadNearby = async () => {
      try {
        const data = await parkingService.fetchLots();
        const formatted = data.slice(0, 3).map((lot, idx) => ({
          id: lot.id,
          name: lot.name,
          distance: `${(0.2 + idx * 0.25).toFixed(1)} mi`,
          price: `$${parseFloat(lot.price_per_hour).toFixed(2)}/hr`,
          availableSlots: lot.available_slots,
          isOpen: lot.is_open
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
          San Francisco
        </span>
      </div>

      <div className="nearby-grid-row">
        {spots.length > 0 ? (
          spots.map((spot) => (
            <div key={spot.id} className="nearby-mini-card">
              {/* Left detail */}
              <div className="mini-card-details">
                <h4 className="mini-card-title">{spot.name}</h4>
                <div className="mini-card-meta">
                  <span>{spot.distance}</span>
                  <span style={{ margin: '0 0.35rem' }}>•</span>
                  <span>{spot.price}</span>
                  <span style={{ margin: '0 0.35rem' }}>•</span>
                  <span style={{ color: spot.availableSlots === 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
                    {spot.availableSlots === 0 ? 'Full' : `${spot.availableSlots} slots left`}
                  </span>
                </div>
              </div>

              {/* Right actions */}
              <div className="mini-card-actions">
                <button
                  type="button"
                  className="btn-mini-secondary"
                  title="Navigate GPS"
                  onClick={() => alert(`Starting navigation to: ${spot.name}`)}
                >
                  <Navigation size={12} />
                </button>
                <button
                  type="button"
                  className="btn-mini-primary"
                  onClick={() => alert(`Reserving spot at: ${spot.name}`)}
                  disabled={spot.availableSlots === 0}
                  style={{ opacity: spot.availableSlots === 0 ? 0.4 : 1, cursor: spot.availableSlots === 0 ? 'not-allowed' : 'pointer' }}
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
