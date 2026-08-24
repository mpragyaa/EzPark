/**
 * SlotGrid.jsx
 *
 * Renders a grid of SlotCard elements.
 * Groups slot cards by floor for a cleaner layout hierarchy.
 */

import React, { useState } from 'react';
import SlotCard from './SlotCard';

export default function SlotGrid({ slots = [], selectedSlot, onSlotSelect }) {
  // Group slots by floor
  const slotsByFloor = slots.reduce((acc, slot) => {
    const floor = slot.floor || 'G';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(slot);
    return acc;
  }, {});

  const floors = Object.keys(slotsByFloor).sort();

  if (slots.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--text-secondary)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>No slots available for this location currently.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {floors.map((floor) => (
        <div key={floor} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h4 style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🏢 Floor {floor}
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 'normal' }}>
              ({slotsByFloor[floor].length} slots)
            </span>
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.75rem'
          }}>
            {slotsByFloor[floor].map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={selectedSlot?.id === slot.id}
                onSelect={onSlotSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
