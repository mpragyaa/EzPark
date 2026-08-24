/**
 * SlotCard.jsx
 *
 * Card component representing a single parking slot.
 *
 * Status colors:
 *   Green  → Available
 *   Yellow → Reserved
 *   Red    → Occupied
 *
 * Only "available" slots are interactive/selectable.
 */

import React from 'react';

// Status styling mapping
const STATUS_META = {
  available: { label: 'Available', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
  reserved:  { label: 'Reserved',  color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  occupied:  { label: 'Occupied',  color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
};

export default function SlotCard({ slot, isSelected, onSelect }) {
  const {
    id,
    slot_number,
    floor,
    type,
    status = 'available',
    is_covered = false,
    has_ev_charging = false,
  } = slot;

  const meta = STATUS_META[status] ?? STATUS_META.available;
  const isAvailable = status === 'available';

  const handleClick = () => {
    if (isAvailable) {
      onSelect?.(slot);
    }
  };

  return (
    <div
      className={`slot-card-item${isAvailable ? ' available' : ' locked'}${isSelected ? ' selected' : ''}`}
      onClick={handleClick}
      role="radio"
      aria-checked={isSelected}
      aria-disabled={!isAvailable}
      style={{
        backgroundColor: isSelected ? 'var(--color-primary-glow)' : 'var(--bg-tertiary)',
        border: isSelected
          ? '2px solid var(--color-primary)'
          : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.45,
        transition: 'all var(--transition-fast)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Header: Slot Name + Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
          {slot_number}
        </strong>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: meta.color,
            background: meta.bg,
            padding: '0.15rem 0.45rem',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {meta.label}
        </span>
      </div>

      {/* Info: Floor + Compatibility */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <div>Floor: <strong style={{ color: 'var(--text-primary)' }}>{floor}</strong></div>
        <div>Compatibility: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{type === 'ev' ? 'EV / Car' : type}</strong></div>
      </div>

      {/* Badges footer: Covered / EV */}
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--text-secondary)',
          background: 'var(--bg-secondary)',
          padding: '0.15rem 0.4rem',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
        }}>
          {is_covered ? '🛡️ Covered' : '⛅ Open'}
        </span>
        {has_ev_charging && (
          <span style={{
            fontSize: '0.62rem',
            color: 'var(--color-success)',
            background: 'var(--color-success-glow)',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
          }}>
            ⚡ EV Ready
          </span>
        )}
      </div>

      {/* Checked tick indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          ✓
        </div>
      )}
    </div>
  );
}
