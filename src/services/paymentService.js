/**
 * paymentService.js
 *
 * Handles payment orders creation, signature checks, and transaction logging.
 * Integrates dynamic Razorpay checkout script loaders.
 */

import { supabase } from './supabase';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const paymentService = {
  /**
   * Dynamically loads Razorpay checkout script.
   *
   * @returns {Promise<boolean>}
   */
  async loadRazorpay() {
    return loadScript('https://checkout.razorpay.com/v1/checkout.js');
  },

  /**
   * Initialize a new checkout order securely via backend.
   *
   * @param {string} facilityId
   * @param {number} duration
   * @param {string} couponCode
   * @returns {Promise<object>} Order details object { orderId, amount, orderDetails }
   */
  async createOrder(facilityId, duration, couponCode = null) {
    if (!supabase) throw new Error('Supabase is not configured.');
    
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { facilityId, duration, couponCode }
    });

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
    
    if (data.error) {
       throw new Error(`Backend error: ${data.error}`);
    }

    return data;
  },

  /**
   * Verify signature of completed payment via backend.
   *
   * @param {object} paymentResponse - Response object from Razorpay checkout
   * @param {string} bookingId - The ID of the pending booking
   * @returns {Promise<boolean>} Verification outcome
   */
  async verifyPaymentSignature(paymentResponse, bookingId) {
    if (!supabase) throw new Error('Supabase is not configured.');

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentResponse;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
      throw new Error('Payment verification parameters missing.');
    }

    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        booking_id 
      }
    });

    if (error || (data && data.error)) {
      console.error('Verification failed:', error?.message || data?.error);
      return false;
    }

    return data?.success || false;
  }
};
