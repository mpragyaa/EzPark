import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ParkingCard({
  spot,
  isSelected,
  onClick,
  showDistance = false,
  isFavorite = false,
  onToggleFavorite,
}) {
  const {
    name,
    distanceKm,
    pricePerHour,
    availableSlots,
    totalSlots,
    rating,
    hasEVCharging,
    isOpen,
    isExternal
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
      style={{ position: 'relative' }}
    >
      {/* Favorite Heart Toggle Icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(spot.id);
        }}
        style={{
          position: 'absolute',
          top: '0.85rem',
          right: '0.85rem',
          color: isFavorite ? '#ef4444' : 'var(--text-muted)',
          zIndex: 10,
          transition: 'transform 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Title & Rating */}
      <div className="card-header-row" style={{ paddingRight: '2rem' }}>
        <h3 className="card-title">{name}</h3>
        {isExternal ? (
          <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
            External Parking
          </span>
        ) : (
          <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-primary)', alignSelf: 'flex-start' }}>
            ✓ EzPark Verified
          </span>
        )}
      </div>

      <div className="card-header-row" style={{ marginTop: '0.2rem' }}>
        {rating != null && (
          <span className="badge-status open" style={{
            backgroundColor: 'rgba(255, 184, 0, 0.08)',
            border: '1px solid rgba(255, 184, 0, 0.2)',
            color: '#f59e0b',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.65rem'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {Number(rating).toFixed(1)}
          </span>
        )}
      </div>

      {/* Distance and EV stats */}
      <div className="card-meta-line">
        {showDistance && distanceKm != null ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m away`
              : `${distanceKm.toFixed(1)} km away`}
          </span>
        ) : null}
        
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

      {/* Live Occupancy Progress Bar */}
      {(availableSlots != null && totalSlots != null) && (
        <div className="card-occupancy-progress" style={{ marginTop: '0.65rem', marginBottom: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
            <span>Occupancy</span>
            <span>{Math.round((1 - occupancyRatio) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, (1 - occupancyRatio) * 100))}%`,
              height: '100%',
              backgroundColor: availableSlots === 0 ? 'var(--color-error)' : occupancyRatio <= 0.15 ? 'var(--color-warning, #f59e0b)' : 'var(--color-success)',
              borderRadius: '2px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* Footer statistics (price & slots) */}
      <div className="card-footer-row" style={{ marginTop: '0.4rem' }}>
        <div className="card-price-value">
          {pricePerHour != null && !isNaN(pricePerHour) ? (
            <>₹{Number(pricePerHour).toFixed(2)}<span>/hr</span></>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pricing unavailable</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Slots Available indicator */}
          {availableSlots != null ? (
            <span className={`card-slots-count ${availableSlots === 0 ? 'limited' : availableSlots <= 5 ? 'limited' : ''}`} style={{ fontSize: '0.75rem' }}>
              {availableSlots === 0 ? 'Full' : `${availableSlots}/${totalSlots ?? '?'} free`}
            </span>
          ) : (
            <span className="card-slots-count" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Availability unavailable</span>
          )}

          {/* Open/Closed Badge */}
          {!isExternal && (
            <span className={`badge-status ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
