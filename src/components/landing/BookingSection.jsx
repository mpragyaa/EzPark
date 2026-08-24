import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useToast } from '../../contexts/ToastContext';
import { parkingService } from '../../services/parkingService';
import { bookingService } from '../../services/bookingService';
import { formatDateLabel, formatTimeLabel } from '../../utils/formatters';
import useRealtimeSlots from '../../hooks/useRealtime';
import '../../styles/booking.css';

// Helper to compute departure time based on arrival time and duration (hours)
function addHoursToTime(timeStr, hours) {
  if (!timeStr) return '18:00';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const totalMins = (h + parseFloat(hours)) * 60 + m;
  const newHrs = Math.floor(totalMins / 60) % 24;
  const newMins = Math.round(totalMins % 60);

  return `${newHrs.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export default function BookingSection() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Centralised booking state context
  const {
    selectedFacility,
    setSelectedFacility,
    vehicleType,
    date,
    time,
    duration,
    destination,
  } = useBooking();

  const [facilities, setFacilities] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [invoice, setInvoice] = useState(null);

  // Auto-derived times
  const entryTime = time;
  const exitTime = addHoursToTime(time, duration);

  // Load facilities from Supabase on mount
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const data = await parkingService.fetchLots();
        setFacilities(data);
        // Default to first facility if none selected yet
        if (data.length > 0 && !selectedFacility) {
          setSelectedFacility(data[0]);
        }
      } catch (err) {
        console.error('Error loading facilities:', err);
      }
    };
    loadFacilities();
  }, [selectedFacility, setSelectedFacility]);

  // Load slots when selected facility changes
  useEffect(() => {
    if (!selectedFacility) return;
    
    const loadSlots = async () => {
      try {
        const data = await parkingService.fetchSlotsForLot(selectedFacility.id);
        setSlots(data);
        // Auto-select first available slot
        const match = data.find(s => s.status === 'available');
        setSelectedSlot(match || null);
      } catch (err) {
        console.error('Error loading slots:', err);
      }
    };
    loadSlots();
  }, [selectedFacility]);

  // Hook up live Supabase Realtime channel listener
  const liveSlots = useRealtimeSlots(selectedFacility?.id, slots);

  // Auto-select a valid available slot if selectedSlot status changes
  useEffect(() => {
    if (selectedSlot && liveSlots.length > 0) {
      const match = liveSlots.find(s => s.id === selectedSlot.id);
      if (match && match.status !== 'available') {
        const nextAvail = liveSlots.find(s => s.status === 'available');
        setSelectedSlot(nextAvail || null);
        showToast(`Slot ${selectedSlot.slot_number} was booked by another user. Selecting next available.`, 'error');
      }
    }
  }, [liveSlots, selectedSlot, showToast]);

  const calculateTotal = () => {
    if (!selectedFacility) return 0;
    return (duration ?? 2) * parseFloat(selectedFacility.price_per_hour);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please log in to complete your reservation.', 'error');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      showToast('No available slot is selected. Please choose a different lot.', 'error');
      return;
    }

    try {
      const rate = selectedFacility.price_per_hour;
      const totalAmount = duration * rate;

      // Submit booking details to Supabase Service
      const bookingData = {
        user_id: user.id,
        lot_id: selectedFacility.id,
        slot_id: selectedSlot.id,
        vehicle_type: vehicleType,
        booking_date: date,
        entry_time: entryTime,
        exit_time: exitTime,
        total_amount: totalAmount
      };

      const bookingResult = await bookingService.createBooking(bookingData);

      // Create modal receipt state
      setInvoice({
        id: bookingResult.id.substring(0, 8).toUpperCase(),
        facilityName: selectedFacility.name,
        slotName: selectedSlot.slot_number,
        date,
        time: `${formatTimeLabel(entryTime)} - ${formatTimeLabel(exitTime)}`,
        hours: `${duration} hrs`,
        rate: `₹${parseFloat(rate).toFixed(2)}/hr`,
        total: `₹${totalAmount.toFixed(2)}`
      });

      showToast('Booking reserved successfully!', 'success');
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Booking reservation failed.', 'error');
    }
  };

  const handleEditSearch = () => {
    const el = document.querySelector('.search-section-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Memoize slot grid layouts to prevent recalculations on unrelated renders
  const slotsMapGrid = useMemo(() => {
    if (liveSlots.length === 0) {
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', gridColumn: 'span 4', textAlign: 'center', padding: '1rem' }}>
          No slot grids configured.
        </div>
      );
    }

    return liveSlots.map((s) => {
      const isSelected = selectedSlot?.id === s.id;
      const isReserved = s.status !== 'available';

      let statusColor = 'rgba(255, 255, 255, 0.01)';
      if (isSelected) {
        statusColor = 'var(--color-primary)';
      } else if (s.status === 'available') {
        statusColor = 'rgba(16, 185, 129, 0.08)'; // Green
      } else if (s.status === 'reserved') {
        statusColor = 'rgba(59, 130, 246, 0.15)'; // Blue
      } else if (s.status === 'occupied') {
        statusColor = 'rgba(239, 68, 68, 0.15)'; // Red
      } else if (s.status === 'maintenance') {
        statusColor = 'rgba(249, 115, 22, 0.15)'; // Orange
      } else if (s.status === 'unavailable') {
        statusColor = 'rgba(156, 163, 175, 0.1)'; // Gray
      }

      return (
        <button
          key={s.id}
          type="button"
          className={`slot-block-btn ${isReserved ? 'reserved' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            if (s.status === 'available') setSelectedSlot(s);
          }}
          disabled={s.status !== 'available'}
          style={{
            backgroundColor: statusColor,
            border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)'
          }}
          title={`Slot ${s.slot_number} (${s.type}) - Status: ${s.status}`}
        >
          {s.slot_number}
        </button>
      );
    });
  }, [liveSlots, selectedSlot]);

  return (
    <section className="booking-section-container">
      
      {/* Title */}
      <div className="booking-title-area" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <h2 className="booking-main-title">Select & Reserve Slot</h2>
        <p className="booking-subtitle" style={{ color: 'var(--text-secondary)' }}>
          Inspect facility configurations and request immediate virtual gate passes.
        </p>
      </div>

      <div className="booking-layout-grid">
        
        {/* Left Column: Facility Information Details */}
        <div className="booking-info-column">
          {selectedFacility ? (
            <div className="facility-detail-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="facility-name">{selectedFacility.name}</h3>
                  <p className="facility-address">{selectedFacility.address}, {selectedFacility.city}</p>
                </div>
                {/* Fallback Selector for testing different lots directly on the booking pane */}
                <select
                  className="form-input"
                  value={selectedFacility.id}
                  onChange={(e) => {
                    const found = facilities.find(f => f.id === e.target.value);
                    if (found) setSelectedFacility(found);
                  }}
                  style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="facility-amenities-row">
                {selectedFacility.has_ev_charging && <span className="amenity-tag">🔋 EV Charging</span>}
                {selectedFacility.has_cctv && <span className="amenity-tag">📹 CCTV 24/7</span>}
                {selectedFacility.is_covered && <span className="amenity-tag">🛡 Covered</span>}
              </div>

              {/* Graphical Layout representation */}
              <div className="facility-layout-stage">
                <span className="layout-badge">LEVEL 1 MAP</span>
                <div className="slots-grid-map">
                  {slotsMapGrid}
                </div>
              </div>

              <div className="legend-row">
                <span className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} /> Available</span>
                <span className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }} /> Reserved</span>
                <span className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }} /> Occupied</span>
                <span className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }} /> Maint.</span>
              </div>
            </div>
          ) : (
            <div className="facility-detail-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a facility from the search results above to inspect slot maps.</p>
            </div>
          )}
        </div>

        {/* Right Column: Streamlined Booking Form (No duplicate vehicle/date/time inputs) */}
        <form className="booking-panel-card" onSubmit={handleBookingSubmit}>
          <h3 className="panel-card-title">Booking Summary</h3>

          {/* Structured Booking Summary Card */}
          <div className="pd-summary-box" style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Destination</span>
              <strong style={{ color: 'var(--text-primary)', maxWidth: '65%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {destination || 'N/A'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Vehicle Type</span>
              <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {vehicleType}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {formatDateLabel(date)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Arrival Time</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {formatTimeLabel(entryTime)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {duration} {duration === 1 ? 'Hour' : 'Hours'}
              </strong>
            </div>
          </div>

          {/* Edit Search button to return to search panel */}
          <button
            type="button"
            className="btn-submit"
            onClick={handleEditSearch}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Search Criteria
          </button>

          {/* Selected Slot Information */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Selected Space</label>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 1rem',
              color: selectedSlot ? 'var(--text-primary)' : 'var(--color-error)',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {selectedSlot ? `Slot ${selectedSlot.slot_number} (${selectedSlot.type.toUpperCase()})` : 'Please select a slot block on the level map'}
            </div>
          </div>

          {/* Pricing summaries & Book Now button */}
          {selectedFacility && (
            <div className="total-summary-card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Hourly Price Rate</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{parseFloat(selectedFacility.price_per_hour).toFixed(2)}/hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.6rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Total Price</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            style={{ width: '100%' }}
            disabled={!selectedSlot}
          >
            Confirm Reservation
          </button>
        </form>

      </div>

      {/* Invoice Modal Overlay */}
      <AnimatePresence>
        {invoice && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="modal-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h3 className="modal-title">Booking Secured</h3>
              <p className="modal-desc">Your receipt and digital entry pass code has been registered</p>

              {/* Receipt Table */}
              <div className="modal-receipt-box">
                <div className="receipt-line"><span>Booking ID</span><strong>{invoice.id}</strong></div>
                <div className="receipt-line"><span>Location</span><strong>{invoice.facilityName}</strong></div>
                <div className="receipt-line"><span>Reserved Spot</span><strong>{invoice.slotName}</strong></div>
                <div className="receipt-line"><span>Date</span><strong>{invoice.date}</strong></div>
                <div className="receipt-line"><span>Time range</span><strong>{invoice.time}</strong></div>
                <div className="receipt-line"><span>Total duration</span><strong>{invoice.hours}</strong></div>
                <div className="receipt-line"><span>Total charge</span><strong>{invoice.total}</strong></div>
              </div>

              <div className="modal-actions-row">
                <button 
                  type="button" 
                  className="btn-auth-submit" 
                  style={{ width: '100%' }}
                  onClick={() => setInvoice(null)}
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
