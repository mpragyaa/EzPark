-- 002_add_verification_fields.sql
-- Migration to add active status and verification status to parking_facilities
-- Designed to be run safely on existing databases.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parking_facilities' AND column_name='is_active') THEN
        ALTER TABLE public.parking_facilities ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parking_facilities' AND column_name='is_verified') THEN
        ALTER TABLE public.parking_facilities ADD COLUMN is_verified boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parking_facilities' AND column_name='google_maps_url') THEN
        ALTER TABLE public.parking_facilities ADD COLUMN google_maps_url text;
    END IF;
END $$;
