/**
 * BookingReview.jsx
 *
 * Detailed billing breakdown invoice review panel.
 * Handles subtotal math, platform convenience fees, 18% GST computations,
 * coupon apply code codes, and terms agreement checks.
 */

import React, { useState } from 'react';
import { couponService } from '../../services/couponService';
import { formatDateLabel, formatTimeLabel } from '../../utils/formatters';
import { CheckCircle2, Ticket } from 'lucide-react';

export default function BookingReview({
  facility,
  vehicleType,
  date,
  time,
  duration,
  selectedSlot,
  onProceedToPayment,
  onCancel,
  pricePerHour,
  onTotalsCalculated
}) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Billing Math
  const subtotal = pricePerHour * duration;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = taxableAmount * 0.18; // 18% GST
  const convenienceFee = 10.00; // Flat platform convenience fee
  const grandTotal = taxableAmount + gst + convenienceFee;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    try {
      const result = await couponService.validateCoupon(couponCode, subtotal);
      setAppliedCoupon(result);
      setCouponCode('');
      // Bubble totals up
      onTotalsCalculated?.(grandTotal);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon.');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handlePaymentClick = () => {
    if (!agreeTerms) return;
    onProceedToPayment?.({
      subtotal,
      discount,
      gst,
      convenienceFee,
      grandTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
      {/* Target summary details list */}
      <div style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Facility</span>
          <strong style={{ color: 'var(--text-primary)' }}>{facility?.name}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Selected Space</span>
          <strong style={{ color: 'var(--color-primary)' }}>Slot {selectedSlot?.slot_number} (Floor {selectedSlot?.floor})</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Scheduled Time</span>
          <strong style={{ color: 'var(--text-primary)' }}>{formatDateLabel(date)} • {formatTimeLabel(time)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Duration Rate</span>
          <strong style={{ color: 'var(--text-primary)' }}>{duration} hrs @ ₹{pricePerHour?.toFixed(2)}/hr</strong>
        </div>
      </div>

      {/* Coupon input code box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Promo Code / Coupon
        </label>
        
        {appliedCoupon ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-success-glow)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
              <CheckCircle2 size={14} />
              <span>{appliedCoupon.code} Applied (-₹{appliedCoupon.discountAmount})</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 650, cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.55rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="e.g. FIRST20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.15rem',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <Ticket size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.95rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
        )}
        {couponError && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 600 }}>
            ⚠️ {couponError}
          </span>
        )}
      </div>

      {/* Itemised Billing Receipt breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
        <h3 className="amenities-section-title" style={{ marginBottom: '0.45rem' }}>Receipt Breakdown</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
            <span>Coupon Discount:</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>GST (18%):</span>
          <span>₹{gst.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', paddingBottom: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
          <span>Platform Convenience Fee:</span>
          <span>₹{convenienceFee.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
          <span style={{ color: 'var(--text-primary)' }}>Grand Total:</span>
          <span style={{ color: 'var(--color-success)' }}>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Policy and Checklist Terms Agreement */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4
        }}>
          <strong>📝 Cancellation Policy:</strong> Free cancellations are allowed up to 1 hour before arrival. Cancellations made within 1 hour are charged a 50% platform convenience fee.
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ marginTop: '0.15rem' }}
          />
          <span>I agree to the EzPark Terms of Service and Cancellation Policy.</span>
        </label>
      </div>

      {/* Actions footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.85rem' }}>
        <button
          type="button"
          className="pd-btn pd-btn--secondary"
          onClick={onCancel}
          style={{ width: '100%' }}
        >
          Back to Slots
        </button>
        <button
          type="button"
          onClick={handlePaymentClick}
          disabled={!agreeTerms}
          style={{
            backgroundColor: agreeTerms ? 'var(--color-success)' : 'rgba(255,255,255,0.05)',
            color: agreeTerms ? '#ffffff' : 'var(--text-muted)',
            padding: '0.65rem',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: agreeTerms ? 'pointer' : 'not-allowed',
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            display: 'block',
            width: '100%',
            transition: 'all 0.2s'
          }}
        >
          PAY AND CONFIRM
        </button>
      </div>
    </div>
  );
}
