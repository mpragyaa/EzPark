import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ParkingCard({ spot, isSelected, onClick }) {
  const {
    name,
    distance,
    pricePerHour,
    availableSlots,
    totalSlots,
    rating,
    hasEVCharging,
    isOpen
  } = spot;

  const cardRef = useRef(null);

  // Smoothly scroll the highlighted card into view inside the sidebar
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [isSelected]);

  // Determine availability percentage to display nice color indications
  const occupancyRatio = availableSlots / totalSlots;
  let slotColorClass = '';
  if (availableSlots === 0) {
    slotColorClass = 'limited';
  } else if (occupancyRatio <= 0.15) {
    slotColorClass = 'limited';
  }

  return (
    <motion.div
      ref={cardRef}
      className={`parking-map-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Title & Rating */}
      <div className="card-header-row">
        <h3 className="card-title">{name}</h3>
        <span className="badge-status open" style={{
          backgroundColor: 'rgba(255, 184, 0, 0.08)',
          border: '1px solid rgba(255, 184, 0, 0.2)',
          color: '#ffb800',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem'
        }}>
          ★ {rating.toFixed(1)}
        </span>
      </div>

      {/* Distance and EV stats */}
      <div className="card-meta-line">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {distance.toFixed(1)} miles
        </span>
        
        {hasEVCharging && (
          <>
            <span>•</span>
            <span className="badge-ev" style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--color-success)',
              backgroundColor: 'var(--color-success-glow)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              EV Ready
            </span>
          </>
        )}
      </div>

      {/* Footer statistics (price & slots) */}
      <div className="card-footer-row">
        <div className="card-price-value">
          ${pricePerHour.toFixed(2)}<span>/hr</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Slots Available indicator */}
          <span className={`card-slots-count ${availableSlots === 0 ? 'limited' : availableSlots <= 5 ? 'limited' : ''}`} style={{ fontSize: '0.75rem' }}>
            {availableSlots === 0 ? 'Full' : `${availableSlots} slots left`}
          </span>

          {/* Open/Closed Badge */}
          <span className={`badge-status ${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
