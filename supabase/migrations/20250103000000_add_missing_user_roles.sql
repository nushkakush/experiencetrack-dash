-- Add missing user roles to the user_role enum
-- This migration adds equipment_manager, mentor_manager, and experience_designer roles

-- Add equipment_manager role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'equipment_manager';

-- Add mentor_manager role  
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'mentor_manager';

-- Add experience_designer role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'experience_designer';
