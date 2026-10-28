import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { facilityId, duration, couponCode } = await req.json()

    // Fetch facility pricing
    const { data: facility, error: facilityError } = await supabaseClient
      .from('parking_facilities')
      .select('price_per_hour')
      .eq('id', facilityId)
      .single()

    if (facilityError || !facility) throw new Error('Facility not found')

    let totalAmount = facility.price_per_hour * (duration || 2)
    let discount = 0

    // Validate and apply coupon if provided
    if (couponCode) {
      const { data: coupon } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('active', true)
        .single()

      if (coupon) {
        if (coupon.type === 'percentage') {
          const rawDiscount = (totalAmount * coupon.percentage_discount) / 100
          discount = coupon.maximum_discount > 0 ? Math.min(rawDiscount, coupon.maximum_discount) : rawDiscount
        } else if (coupon.type === 'flat') {
          discount = coupon.flat_discount
        }
        if (totalAmount < coupon.minimum_amount) {
          discount = 0
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - discount)
    const amountInPaise = Math.round(finalAmount * 100)

    // Call Razorpay API to create order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Math.random().toString(36).substring(2, 12)}`
      })
    })

    if (!razorpayRes.ok) {
      const err = await razorpayRes.text()
      throw new Error(`Razorpay API error: ${err}`)
    }

    const order = await razorpayRes.json()

    return new Response(
      JSON.stringify({ orderId: order.id, amount: finalAmount, orderDetails: order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
