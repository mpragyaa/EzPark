import React from 'react';
import { Sparkles, MapPin, Navigation, ShieldCheck } from 'lucide-react';

export default function RecommendationCard({ lot: facility, isTop = false, onBookClick }) {
  return (
    <div 
      className={`booking-card-item ${isTop ? 'highlighted-premium-border' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        position: 'relative',
        background: isTop ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)' : 'rgba(255,255,255,0.01)',
        border: `1px solid ${isTop ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isTop ? '0 8px 24px rgba(59, 130, 246, 0.06)' : 'none',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left'
      }}
    >
      {/* Upper AI Score badge & top indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {isTop && (
            <span style={{
              backgroundColor: 'var(--color-primary-glow)',
              color: 'var(--color-primary)',
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Sparkles size={10} />
              Best Recommendation
            </span>
          )}
        </div>

        {/* AI score rating */}
        <div style={{
          background: 'var(--color-primary)',
          color: '#ffffff',
          fontWeight: 750,
          fontSize: '0.85rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>AI Score:</span>
          <span>{facility.aiScore}</span>
        </div>
      </div>

      {/* Facility Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h4 className="booking-name-title" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>
          {facility.name}
        </h4>
        <div className="booking-meta-line" style={{ fontSize: '0.8rem' }}>
          <MapPin size={12} />
          <span>{facility.address}, {facility.city}</span>
        </div>
      </div>

      {/* Recommendation Reason bar */}
      <div style={{
        backgroundColor: isTop ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${isTop ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '6px',
        padding: '0.6rem 0.85rem',
        fontSize: '0.825rem',
        fontWeight: 650,
        color: isTop ? 'var(--color-primary)' : 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem'
      }}>
        <ShieldCheck size={14} />
        <span>{facility.recommendationReason}</span>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Walking Dist</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{facility.distance.toFixed(2)} mi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hourly Rate</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>${parseFloat(facility.pricePerHour).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Spaces</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: facility.availableSlots === 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
            {facility.availableSlots} free
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button
          type="button"
          className="btn-qr-scanner"
          style={{ width: '44px', height: '44px', borderRadius: '6px' }}
          onClick={() => alert(`Starting GPS navigation to: ${facility.name}`)}
        >
          <Navigation size={16} />
        </button>
        <button
          type="button"
          className="btn-auth-submit"
          style={{
            flexGrow: 1,
            height: '44px',
            borderRadius: '6px',
            backgroundColor: isTop ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
            border: isTop ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff',
            margin: 0
          }}
          onClick={() => onBookClick(facility)}
          disabled={facility.availableSlots === 0}
        >
          Reserve Space
        </button>
      </div>

    </div>
  );
}
