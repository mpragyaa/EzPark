import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { parkingService } from '../../services/parkingService';
import { bookingService } from '../../services/bookingService';
import useRealtimeSlots from '../../hooks/useRealtime';
import '../../styles/booking.css';

export default function BookingSection() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Selected details
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form states
  const [vehicleType, setVehicleType] = useState('car');
  const [date, setDate] = useState('2026-07-18');
  const [entryTime, setEntryTime] = useState('09:00');
  const [exitTime, setExitTime] = useState('14:00');
  const [invoice, setInvoice] = useState(null);

  // Load facilities from Supabase
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const data = await parkingService.fetchLots();
        setFacilities(data);
        if (data.length > 0) {
          setSelectedFacility(data[0]);
        }
      } catch (err) {
        console.error('Error loading facilities:', err);
      }
    };
    loadFacilities();
  }, []);

  // Load slots when selected facility changes
  useEffect(() => {
    if (!selectedFacility) return;
    
    const loadSlots = async () => {
      try {
        const data = await parkingService.fetchSlotsForLot(selectedFacility.id);
        setSlots(data);
        // Auto-select first available slot of matching vehicle type
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

  // Auto-select a valid available slot if the currently selected slot becomes reserved/occupied in realtime
  useEffect(() => {
    if (selectedSlot && liveSlots.length > 0) {
      const match = liveSlots.find(s => s.id === selectedSlot.id);
      if (match && match.status !== 'available') {
        // Current slot is no longer available! Fallback to next available slot
        const nextAvail = liveSlots.find(s => s.status === 'available');
        setSelectedSlot(nextAvail || null);
        showToast(`Slot ${selectedSlot.slot_number} was booked by another user. Selecting next available.`, 'error');
      }
    }
  }, [liveSlots, selectedSlot]);

  // Calculations
  const calculateTotal = () => {
    if (!selectedFacility) return 0;
    const [entryH, entryM] = entryTime.split(':').map(Number);
    const [exitH, exitM] = exitTime.split(':').map(Number);
    
    const entryMin = entryH * 60 + entryM;
    const exitMin = exitH * 60 + exitM;
    const diffMin = Math.max(exitMin - entryMin, 60); // min 1 hour
    const hrs = diffMin / 60;
    
    return hrs * selectedFacility.price_per_hour;
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
      const [entryH, entryM] = entryTime.split(':').map(Number);
      const [exitH, exitM] = exitTime.split(':').map(Number);
      const durationHours = Math.max((exitH * 60 + exitM - (entryH * 60 + entryM)) / 60, 1);
      const rate = selectedFacility.price_per_hour;
      const totalAmount = durationHours * rate;

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

      // Calls service which locks slots in DB and inserts row
      const bookingResult = await bookingService.createBooking(bookingData);

      // Create modal receipt state
      setInvoice({
        id: bookingResult.id.substring(0, 8).toUpperCase(),
        facilityName: selectedFacility.name,
        slotName: selectedSlot.slot_number,
        date,
        time: `${entryTime} - ${exitTime}`,
        hours: `${durationHours.toFixed(1)} hrs`,
        rate: `$${rate.toFixed(2)}/hr`,
        total: `$${totalAmount.toFixed(2)}`
      });

      showToast('Booking reserved successfully!', 'success');
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Booking reservation failed.', 'error');
    }
  };

  // Performance Optimization: Memoize slot grid layouts to prevent recalculations on unrelated renders
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

      // Color coding details:
      // Green = Available, Blue = Reserved, Red = Occupied, Orange = Maintenance, Gray = Unavailable
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
              <h3 className="facility-name">{selectedFacility.name}</h3>
              <p className="facility-address">{selectedFacility.address}, {selectedFacility.city}</p>
              
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
              <p style={{ color: 'var(--text-muted)' }}>Loading parking lots database...</p>
            </div>
          )}
        </div>

        {/* Right Column: Reservation form */}
        <form className="booking-panel-card" onSubmit={handleBookingSubmit}>
          <h3 className="panel-card-title">Reservation Form</h3>

          {/* Select Lot Facility */}
          <div className="form-group">
            <label className="form-label">Parking Location</label>
            <select
              className="form-input"
              value={selectedFacility?.id || ''}
              onChange={(e) => {
                const found = facilities.find(f => f.id === e.target.value);
                if (found) setSelectedFacility(found);
              }}
              style={{ width: '100%' }}
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Segment Selector */}
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <div className="vehicle-selector-row">
              {['car', 'bike', 'ev'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`vehicle-btn ${vehicleType === type ? 'active' : ''}`}
                  onClick={() => setVehicleType(type)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Hours segment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Arrival Time</label>
              <input
                type="time"
                className="form-input"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Departure Time</label>
              <input
                type="time"
                className="form-input"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Bottom summaries & submit */}
          {selectedFacility && (
            <div className="total-summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hourly Price Rate</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${parseFloat(selectedFacility.price_per_hour).toFixed(2)}/hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Total Price</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          <button type="submit" className="btn-submit" style={{ width: '100%' }}>
            Book Space
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
