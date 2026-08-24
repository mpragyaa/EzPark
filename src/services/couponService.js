/**
 * couponService.js
 *
 * Handles fetching and validation of discount coupons.
 * Implements a hybrid architecture:
 *   - Uses Supabase client if available.
 *   - Automatically falls back to LocalStorage/mock validations offline.
 */

import { supabase, SUPABASE_AVAILABLE } from './supabase';

const MOCK_COUPONS = [
  {
    code: 'FIRST20',
    type: 'percentage',
    percentage_discount: 20.0,
    flat_discount: 0.0,
    minimum_amount: 0.0,
    maximum_discount: 100.0,
    active: true
  },
  {
    code: 'EZ50',
    type: 'flat',
    percentage_discount: 0.0,
    flat_discount: 50.0,
    minimum_amount: 100.0,
    maximum_discount: 50.0,
    active: true
  },
  {
    code: 'STUDENT15',
    type: 'percentage',
    percentage_discount: 15.0,
    flat_discount: 0.0,
    minimum_amount: 0.0,
    maximum_discount: 75.0,
    active: true
  }
];

export const couponService = {
  /**
   * Validate a coupon code against a subtotal.
   *
   * @param {string} code
   * @param {number} subtotal
   * @returns {Promise<object>} Coupon details if valid, throws error otherwise
   */
  async validateCoupon(code, subtotal) {
    const cleanCode = String(code).trim().toUpperCase();
    let coupon = null;

    if (SUPABASE_AVAILABLE && supabase) {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      coupon = data;
    } else {
      // Offline fallback
      coupon = MOCK_COUPONS.find((c) => c.code === cleanCode);
    }

    if (!coupon) {
      throw new Error('Invalid coupon code.');
    }

    // Validation checks
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new Error('This coupon is not active yet.');
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      throw new Error('This coupon has expired.');
    }
    if (coupon.usage_limit && coupon.current_usage >= coupon.usage_limit) {
      throw new Error('Coupon usage limit reached.');
    }
    if (coupon.minimum_amount && subtotal < parseFloat(coupon.minimum_amount)) {
      throw new Error(`Minimum booking amount of ₹${parseFloat(coupon.minimum_amount).toFixed(2)} required for this coupon.`);
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.type === 'percentage') {
      const pct = parseFloat(coupon.percentage_discount || 0) / 100;
      discount = subtotal * pct;
      const maxDiscount = parseFloat(coupon.maximum_discount || 0);
      if (maxDiscount > 0 && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else if (coupon.type === 'flat') {
      discount = parseFloat(coupon.flat_discount || 0);
    }

    return {
      ...coupon,
      discountAmount: parseFloat(discount.toFixed(2))
    };
  }
};
