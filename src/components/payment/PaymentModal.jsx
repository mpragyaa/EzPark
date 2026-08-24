/**
 * PaymentModal.jsx
 *
 * Glassmorphic simulated checkout gateway interface.
 * Mimics Razorpay Checkout behaviors, allowing UPI, Card, Net Banking, and Wallet selections.
 * Allows simulating success/failure for testing checkout flows.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Globe, Wallet, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function PaymentModal({
  isOpen,
  amount, // grand total in INR
  orderId,
  onSuccess,
  onCancel,
  onFailure
}) {
  const [activeTab, setActiveTab] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'failed' | null

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI fields
  const [upiId, setUpiId] = useState('');

  if (!isOpen) return null;

  const handlePay = async (simulateSuccess = true) => {
    setIsProcessing(true);
    // Simulate payment transaction network latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);

    if (simulateSuccess) {
      setPaymentStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      onSuccess?.({
        razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        razorpay_order_id: orderId,
        razorpay_signature: `sig_${Math.random().toString(36).substring(2, 22).toUpperCase()}`
      });
    } else {
      setPaymentStatus('failed');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPaymentStatus(null); // reset for retry
      onFailure?.(new Error('Payment failed. Try a different method.'));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 5, 8, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        width: 'min(440px, 94%)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0a0d14',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              EzPark Merchant Gate
            </span>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Choose Payment Method
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isProcessing}
            style={{ color: 'var(--text-muted)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount bar */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Order ID: {orderId?.substring(0, 12)}</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--color-success)', fontWeight: 800 }}>
            ₹{amount?.toFixed(2)}
          </strong>
        </div>

        {/* Main Body */}
        {paymentStatus === null && !isProcessing && (
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', minHeight: '260px' }}>
            {/* Tabs Sidebar */}
            <div style={{
              borderRight: '1px solid var(--border-color)',
              backgroundColor: '#0a0d14',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {[
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'upi', icon: QrCode, label: 'UPI' },
                { id: 'banking', icon: Globe, label: 'Net' },
                { id: 'wallets', icon: Wallet, label: 'Wallet' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '1rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 650 }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Card panel */}
              {activeTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI panel */}
              {activeTab === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>UPI ID</label>
                    <input
                      type="text"
                      placeholder="username@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    padding: '0.55rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.02)'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🤳</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      You can also scan the QR on the next screen to verify.
                    </span>
                  </div>
                </div>
              )}

              {/* Net banking / Wallets panels */}
              {(activeTab === 'banking' || activeTab === 'wallets') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', alignContent: 'start' }}>
                  {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Paytm', 'PhonePe', 'Google Pay'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => {}}
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontWeight: 600
                      }}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => handlePay(true)}
                  style={{
                    backgroundColor: 'var(--color-success)',
                    color: '#ffffff',
                    padding: '0.65rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Pay ₹{amount?.toFixed(2)} (Simulate Success)
                </button>
                <button
                  type="button"
                  onClick={() => handlePay(false)}
                  style={{
                    backgroundColor: 'var(--color-error-glow)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--color-error)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Simulate Failure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Spinner state */}
        {isProcessing && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            gap: '0.85rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(59, 130, 246, 0.08)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'pay-modal-spin 0.8s linear infinite'
            }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 650 }}>
              Verifying payment coordinates...
            </p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Do not close window or hit refresh.
            </span>
          </div>
        )}

        {/* Success check validation indicator */}
        {paymentStatus === 'success' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            gap: '0.85rem',
            backgroundColor: 'rgba(16, 185, 129, 0.02)'
          }}>
            <CheckCircle size={50} style={{ color: 'var(--color-success)' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', margin: 0 }}>
              Payment Verified!
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Generating secure parking pass receipt...
            </p>
          </div>
        )}

        {/* Failed notification indicator */}
        {paymentStatus === 'failed' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            gap: '0.85rem',
            backgroundColor: 'rgba(239, 68, 68, 0.02)'
          }}>
            <AlertTriangle size={50} style={{ color: 'var(--color-error)' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-error)', margin: 0 }}>
              Payment Declined
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, padding: '0 2rem', textAlign: 'center' }}>
              Your bank or wallet rejected the request. Please choose another method.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pay-modal-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
