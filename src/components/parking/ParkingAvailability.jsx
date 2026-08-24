/**
 * ParkingAvailability.jsx
 *
 * Visual availability indicator for a parking facility.
 * Shows a colour-coded progress bar and slot count badge.
 *
 * Colour thresholds:
 *   Green  → availableSlots > 20
 *   Yellow → 5 – 20 slots
 *   Red    → < 5 slots (including 0)
 *
 * Props
 * ─────
 *   availableSlots {number}
 *   totalSlots     {number}
 *   compact        {boolean} — smaller layout for card use (default: false)
 */

import React from 'react';

function getAvailabilityTier(available) {
  if (available > 20) return 'high';
  if (available >= 5) return 'mid';
  return 'low';
}

const TIER_META = {
  high: { label: 'Available',  color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  mid:  { label: 'Limited',    color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  low:  { label: available => available === 0 ? 'Full' : 'Almost Full',
          color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

export default function ParkingAvailability({ availableSlots, totalSlots, compact = false }) {
  const available = availableSlots ?? 0;
  const total     = totalSlots     ?? 0;
  const tier      = getAvailabilityTier(available);
  const meta      = TIER_META[tier];
  const label     = typeof meta.label === 'function' ? meta.label(available) : meta.label;
  const pct       = total > 0 ? Math.round((available / total) * 100) : 0;

  if (compact) {
    return (
      <span
        className="avail-badge-compact"
        style={{ color: meta.color, background: meta.bg }}
      >
        {available === 0 ? 'Full' : `${available} left`}
      </span>
    );
  }

  return (
    <div className="avail-root">
      {/* Header row */}
      <div className="avail-header">
        <span className="avail-label">Parking Availability</span>
        <span className="avail-badge" style={{ color: meta.color, background: meta.bg }}>
          {label}
        </span>
      </div>

      {/* Slot counts */}
      <div className="avail-counts">
        <span className="avail-free" style={{ color: meta.color }}>
          {available}
          <span className="avail-free-sub"> free</span>
        </span>
        <span className="avail-total">
          of {total} slots
        </span>
      </div>

      {/* Progress bar */}
      <div className="avail-bar-track">
        <div
          className="avail-bar-fill"
          style={{
            width: `${pct}%`,
            background: meta.color,
          }}
          role="progressbar"
          aria-valuenow={available}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${available} of ${total} slots available`}
        />
      </div>

      <p className="avail-pct-label">{pct}% available</p>
    </div>
  );
}
