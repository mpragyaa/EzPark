/**
 * paymentService.js
 *
 * Handles payment orders creation, signature checks, and transaction logging.
 * Integrates dynamic Razorpay checkout script loaders.
 */

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
   * Initialize a new checkout order.
   * In a live app, this requests your backend server to create an order via Razorpay API.
   * Here we simulate it securely with robust offline fallbacks.
   *
   * @param {number} amount - Amount in INR (Rupees)
   * @returns {Promise<object>} Order details object
   */
  async createOrder(amount) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockOrderId = `order_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    return {
      id: mockOrderId,
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `rec_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  },

  /**
   * Verify signature of completed payment.
   * In a live app, this runs cryptographic verification on your backend server.
   *
   * @param {object} paymentResponse - Response object from Razorpay checkout
   * @returns {Promise<boolean>} Verification outcome
   */
  async verifyPaymentSignature(paymentResponse) {
    // Simulate server verification round-trip delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

    // Check if parameters exist
    if (!razorpay_payment_id || !razorpay_order_id) {
      throw new Error('Payment verification parameters missing.');
    }

    // In simulated environments, any transaction ending in FAILED is rejected
    if (razorpay_payment_id.includes('FAILED')) {
      return false;
    }

    return true;
  }
};
