/**
 * FacilityAmenities.jsx
 *
 * Grid of amenity chips for a parking facility.
 * All data comes in via props — nothing is hardcoded.
 *
 * Props
 * ─────
 *   hasEVCharging  {boolean}
 *   hasCCTV        {boolean}
 *   isCovered      {boolean}
 *   vehicleTypes   {string[]}  e.g. ['car', 'bike', 'ev']
 */

import React from 'react';

// ── Amenity chip definitions ──────────────────────────────────────────────────
const AMENITY_DEFS = [
  {
    key: 'ev',
    label: 'EV Charging',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    activeColor:  'var(--color-success)',
    activeBg:     'var(--color-success-glow)',
    inactiveLabel: 'No EV Charging',
  },
  {
    key: 'cctv',
    label: 'CCTV',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    activeColor:  '#3B82F6',
    activeBg:     'rgba(59, 130, 246, 0.12)',
    inactiveLabel: 'No CCTV',
  },
  {
    key: 'covered',
    label: 'Covered',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    activeColor:  '#8B5CF6',
    activeBg:     'rgba(139, 92, 246, 0.12)',
    inactiveLabel: 'Open Air',
  },
];

// Vehicle type labels
const VEHICLE_LABELS = {
  car:  { label: 'Car',      icon: '🚗' },
  bike: { label: 'Bike',     icon: '🏍️' },
  ev:   { label: 'EV',       icon: '⚡' },
  truck:{ label: 'Truck',    icon: '🚛' },
  bus:  { label: 'Bus',      icon: '🚌' },
};

export default function FacilityAmenities({ hasEVCharging, hasCCTV, isCovered, vehicleTypes = [] }) {
  const amenityValues = {
    ev:      Boolean(hasEVCharging),
    cctv:    Boolean(hasCCTV),
    covered: Boolean(isCovered),
  };

  return (
    <div className="amenities-root">
      <h4 className="amenities-section-title">Amenities</h4>

      {/* Feature chips */}
      <div className="amenities-grid">
        {AMENITY_DEFS.map((def) => {
          const active = amenityValues[def.key];
          return (
            <div
              key={def.key}
              className={`amenity-chip${active ? ' active' : ' inactive'}`}
              style={active ? { color: def.activeColor, background: def.activeBg, borderColor: `${def.activeColor}33` } : {}}
              title={active ? def.label : def.inactiveLabel}
            >
              <span className="amenity-chip-icon">{def.icon}</span>
              <span className="amenity-chip-label">{active ? def.label : def.inactiveLabel}</span>
              {!active && <span className="amenity-chip-cross" aria-hidden="true">✕</span>}
            </div>
          );
        })}
      </div>

      {/* Vehicle types */}
      {vehicleTypes.length > 0 && (
        <div className="amenities-vehicles">
          <span className="amenities-vehicles-label">Vehicles</span>
          <div className="amenities-vehicle-chips">
            {vehicleTypes.map((vt) => {
              const meta = VEHICLE_LABELS[vt] ?? { label: vt, icon: '🚘' };
              return (
                <span key={vt} className="vehicle-chip">
                  {meta.icon} {meta.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
