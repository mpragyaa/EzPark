/**
 * PaymentModal.jsx
 *
 * Real Razorpay checkout gateway integration.
 * Loads the Razorpay script and opens the checkout popup when initiated.
 */

import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';

export default function PaymentModal({
  isOpen,
  amount, // Used for display while loading
  orderId,
  orderDetails, // Needed for real Razorpay
  user,
  onSuccess,
  onCancel,
  onFailure
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let rzp;

    const openRazorpay = async () => {
      setIsProcessing(true);
      setErrorMsg(null);
      
      try {
        const loaded = await paymentService.loadRazorpay();
        if (!loaded) {
          throw new Error('Failed to load Razorpay SDK. Please check your connection.');
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_fallback', // Enter the Key ID generated from the Dashboard
          amount: orderDetails?.amount || Math.round(amount * 100), 
          currency: orderDetails?.currency || 'INR',
          name: 'EZPARK',
          description: 'Parking Reservation',
          image: '/vite.svg', // Replace with your logo
          order_id: orderId,
          handler: function (response) {
            // Payment succeeded, pass the response back to parent to verify
            onSuccess?.(response);
          },
          prefill: {
            name: user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 'EZPARK User',
            email: user?.email || '',
            contact: user?.user_metadata?.phone_number || ''
          },
          theme: {
            color: '#3b82f6' // Match your primary color
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
              onCancel?.();
            }
          }
        };

        rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
          setIsProcessing(false);
          onFailure?.(new Error(response.error.description));
        });

        rzp.open();
      } catch (err) {
        setIsProcessing(false);
        setErrorMsg(err.message);
      }
    };

    if (isOpen && orderId && !isProcessing) {
      openRazorpay();
    }

    return () => {
      // Clean up if needed
    };
  }, [isOpen, orderId]); // Dependency array specifically looking at isOpen and orderId

  if (!isOpen) return null;

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
        width: 'min(380px, 94%)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {errorMsg ? (
          <>
            <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Checkout Error</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button 
              onClick={onCancel}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(59, 130, 246, 0.08)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'pay-modal-spin 0.8s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Opening Secure Checkout
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Please complete your payment in the Razorpay window. Do not refresh this page.
            </p>
          </>
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
