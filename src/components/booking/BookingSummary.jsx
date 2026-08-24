/**
 * BookingSummary.jsx
 *
 * Renders the checkout summary section for slot reservation.
 * Computes price totals and presents Confirm/Cancel actions.
 */

import React from 'react';
import { formatDateLabel, formatTimeLabel } from '../../utils/formatters';

export default function BookingSummary({
  facility,
  slot,
  vehicleType,
  date,
  time,
  duration,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  if (!facility) return null;

  const pricePerHour = parseFloat(facility.price_per_hour || 0);
  const totalCost = pricePerHour * parseFloat(duration || 2);

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      boxShadow: 'var(--shadow-md)',
      position: 'sticky',
      top: '2rem'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem'
      }}>
        Booking Summary
      </h3>

      {/* Details Box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {/* Facility Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Parking Facility</span>
          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{facility.name}</strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{facility.address}, {facility.city}</span>
        </div>

        {/* Separator line */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

        {/* Selected Slot info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Selected Space</span>
          {slot ? (
            <strong style={{
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              background: 'var(--color-primary-glow)',
              border: '1px solid var(--color-primary)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              Slot {slot.slot_number} (Floor {slot.floor})
            </strong>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-error)', fontWeight: 600 }}>No slot selected</span>
          )}
        </div>

        {/* Parameters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Vehicle Type</span>
          <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{vehicleType}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Date</span>
          <strong style={{ color: 'var(--text-primary)' }}>{formatDateLabel(date)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Arrival Time</span>
          <strong style={{ color: 'var(--text-primary)' }}>{formatTimeLabel(time)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Estimated Duration</span>
          <strong style={{ color: 'var(--text-primary)' }}>{duration} {duration === 1 ? 'Hour' : 'Hours'}</strong>
        </div>

        {/* Pricing Estimate */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.2rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Price Per Hour</span>
          <strong style={{ color: 'var(--text-primary)' }}>₹{pricePerHour.toFixed(2)}/hr</strong>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginTop: '0.4rem'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Total</span>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>₹{totalCost.toFixed(2)}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!slot || isSubmitting}
          style={{
            backgroundColor: 'var(--color-primary, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: (!slot || isSubmitting) ? 'not-allowed' : 'pointer',
            opacity: (!slot || isSubmitting) ? 0.5 : 1,
            transition: 'background var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Securing Space...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.borderColor = 'var(--border-color-hover)'; }}
          onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
