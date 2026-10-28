-- 005_razorpay_integration.sql

-- Modify bookings status check constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('Pending', 'Payment Processing', 'Confirmed', 'Payment Failed', 'Cancelled'));

-- Modify payments status check constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN ('Pending', 'Paid', 'Unpaid', 'Failed', 'Refunded'));

-- Add Razorpay specific columns to payments
ALTER TABLE public.payments ADD COLUMN razorpay_order_id text;
ALTER TABLE public.payments ADD COLUMN razorpay_payment_id text;
ALTER TABLE public.payments ADD COLUMN razorpay_signature text;
