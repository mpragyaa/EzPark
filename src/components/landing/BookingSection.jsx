import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/booking.css';

// Initial state for facility parking map slots
const INITIAL_SLOTS = [
  { id: 'A1', status: 'occupied' },
  { id: 'A2', status: 'available' },
  { id: 'A3', status: 'available' }, // This slot will turn 'reserved' on booking
  { id: 'A4', status: 'occupied' },
  { id: 'A5', status: 'available' },
  { id: 'A6', status: 'occupied' },
  { id: 'A7', status: 'available' },
  { id: 'A8', status: 'occupied' },
  { id: 'A9', status: 'available' },
  { id: 'A10', status: 'occupied' }
];

export default function BookingSection() {
  const [vehicleType, setVehicleType] = useState('car');
  
  // Set default date to today
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  const [entryTime, setEntryTime] = useState('09:00');
  const [exitTime, setExitTime] = useState('14:00');
  
  const [duration, setDuration] = useState(5.0);
  const [totalCost, setTotalCost] = useState(22.50);

  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [showModal, setShowModal] = useState(false);
  const [generatedBookingId, setGeneratedBookingId] = useState('');
  
  // Re-calculate cost and duration automatically when times change
  useEffect(() => {
    if (!entryTime || !exitTime) return;

    const [entryHrs, entryMins] = entryTime.split(':').map(Number);
    const [exitHrs, exitMins] = exitTime.split(':').map(Number);

    let durationMins = (exitHrs * 60 + exitMins) - (entryHrs * 60 + entryMins);

    // Support overnight slots by wrapping around 24 hours
    if (durationMins <= 0) {
      durationMins += 24 * 60;
    }

    const durationHrs = Math.round((durationMins / 60) * 10) / 10;
    const calculatedCost = durationHrs * 4.50; // $4.50 per hour

    setDuration(durationHrs);
    setTotalCost(calculatedCost);
  }, [entryTime, exitTime]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    // Generate clean random booking ID: EZ-XXXX-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randPart1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const randPart2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const bookingId = `EZ-${randPart1}-${randPart2}`;

    setGeneratedBookingId(bookingId);
    setShowModal(true);

    // Dynamically mark slot A3 as reserved to show immediate visual confirmation on the layout map!
    setSlots(prevSlots => 
      prevSlots.map(slot => 
        slot.id === 'A3' ? { ...slot, status: 'reserved' } : slot
      )
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDone = () => {
    setShowModal(false);
  };

  return (
    <section className="booking-section-container">
      {/* Title Header */}
      <div className="booking-section-header">
        <h2 className="booking-section-title">Inspect & Reserve</h2>
        <p className="booking-section-subtitle">
          Examine real-time facility metrics and reserve your slot instantly.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="booking-grid">
        
        {/* Left Column: Facility Information Card */}
        <motion.div 
          className="booking-card"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header detail */}
          <div className="facility-title-row">
            <div>
              <h3 className="facility-name">Aether Premium Plaza</h3>
              <div className="facility-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>824 Stellar Boulevard, Tech District</span>
              </div>
            </div>
            <div className="facility-rating">
              <span>★</span>
              <span>4.9</span>
            </div>
          </div>

          {/* Details 2x2 Grid */}
          <div className="facility-details-grid">
            <div className="detail-item">
              <span className="detail-label">Price per hour</span>
              <span className="detail-value">$4.50</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Distance</span>
              <span className="detail-value">0.2 miles (2 min walk)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available Slots</span>
              <span className="detail-value highlight-green">14 / 40 spaces</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Operational Hours</span>
              <span className="detail-value">24 Hours / 7 Days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">EV Superchargers</span>
              <span className="detail-value">Yes (Active)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Security Tier</span>
              <span className="detail-value">CCTV & Biometric Access</span>
            </div>
          </div>

          {/* Interactive CSS Facility Map */}
          <div className="facility-map-wrapper">
            <div className="facility-map-header">
              <span className="facility-map-title">Level 1 Layout</span>
              <div className="facility-map-legend">
                <div className="legend-item">
                  <span className="legend-color available" />
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color occupied" />
                  <span>Occupied</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color reserved" />
                  <span>Reserved</span>
                </div>
              </div>
            </div>

            {/* Parking Spot Layout Slots */}
            <div className="facility-map-grid">
              {slots.map((slot) => (
                <div 
                  key={slot.id} 
                  className={`parking-slot ${slot.status}`}
                >
                  <span>{slot.id}</span>
                  <span className="slot-indicator" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Reservation Panel Form */}
        <motion.div 
          className="booking-card"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="facility-name">Reservation Panel</h3>
          
          <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Vehicle Selection */}
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <div className="vehicle-selector-row">
                <button
                  type="button"
                  className={`vehicle-btn ${vehicleType === 'car' ? 'active' : ''}`}
                  onClick={() => setVehicleType('car')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  className={`vehicle-btn ${vehicleType === 'bike' ? 'active' : ''}`}
                  onClick={() => setVehicleType('bike')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="5.5" cy="17.5" r="2.5" />
                    <circle cx="18.5" cy="17.5" r="2.5" />
                    <path d="M15 6h1a2 2 0 0 1 2 2v2" />
                    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                  </svg>
                  <span>Bike</span>
                </button>
                <button
                  type="button"
                  className={`vehicle-btn ${vehicleType === 'ev' ? 'active' : ''}`}
                  onClick={() => setVehicleType('ev')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                    <path d="M12 7l-3 5h6l-3 5" />
                  </svg>
                  <span>EV</span>
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label">Reservation Date</label>
              <input 
                type="date" 
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Arrival & Departure Time selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Entry Time</label>
                <input 
                  type="time" 
                  className="form-input"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exit Time</label>
                <input 
                  type="time" 
                  className="form-input"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Dynamic Billing Calculations */}
            <div className="billing-summary-panel">
              <div className="billing-row">
                <span>Rate</span>
                <span>$4.50 / hr</span>
              </div>
              <div className="billing-row">
                <span>Calculated Duration</span>
                <span>{duration.toFixed(1)} hrs</span>
              </div>
              <div className="billing-row total">
                <span>Total Cost</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="btn-submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reserve Parking
            </motion.button>

          </form>
        </motion.div>

      </div>

      {/* Confirmation Overlay Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.94, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Success Badge */}
              <div className="modal-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              {/* Title & Desc */}
              <div>
                <h3 className="modal-title">Booking Confirmed</h3>
                <p className="modal-desc">Your premium parking space is locked.</p>
              </div>

              {/* Receipt invoice details */}
              <div className="modal-receipt">
                <div className="receipt-row">
                  <span className="receipt-label">Parking Spot</span>
                  <span className="receipt-value">Aether Premium Plaza (Spot A3)</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Booking ID</span>
                  <span className="receipt-value id">{generatedBookingId}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Date</span>
                  <span className="receipt-value">{date}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Arrival Window</span>
                  <span className="receipt-value">{entryTime} - {exitTime}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Vehicle Type</span>
                  <span className="receipt-value" style={{ textTransform: 'capitalize' }}>{vehicleType}</span>
                </div>
                <div className="receipt-row total">
                  <span className="receipt-label">Paid Amount</span>
                  <span className="receipt-value">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal controls */}
              <div className="modal-actions">
                <button className="btn-modal-secondary" onClick={handleCloseModal}>
                  View Booking
                </button>
                <button className="btn-modal-primary" onClick={handleDone}>
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
