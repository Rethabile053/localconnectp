-- LocalConnect Supabase Migration Script
-- This script sets up all necessary tables, RLS policies, and storage buckets
-- Run this in the Supabase SQL editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 5. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 7. Create activity tracking table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(100),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- USER PROFILES POLICIES
-- Public read (anyone can see profiles)
CREATE POLICY "Profiles are public" ON public.user_profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- LISTINGS POLICIES
-- Anyone can read public listings
CREATE POLICY "Listings are readable by anyone" ON public.listings
  FOR SELECT USING (status = 'active');

-- Users can insert their own listings
CREATE POLICY "Users can insert listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES POLICIES
-- Users can read their own messages
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can insert messages
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- FAVORITES POLICIES
-- Users can read their own favorites
CREATE POLICY "Users can read own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert favorites
CREATE POLICY "Users can insert favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- REVIEWS POLICIES
-- Anyone can read reviews
CREATE POLICY "Reviews are readable" ON public.reviews
  FOR SELECT USING (true);

-- Users can insert reviews
CREATE POLICY "Users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- CART POLICIES
-- Users can read their own cart
CREATE POLICY "Users can read own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert cart items
CREATE POLICY "Users can insert cart items" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can delete own cart items" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITY LOGS POLICIES
-- Only authenticated users can insert logs
CREATE POLICY "Users can log activity" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own activity
CREATE POLICY "Users can read own activity" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE SETUP (via Supabase Dashboard or API)
-- ============================================================================
-- Create storage buckets in Supabase Dashboard:
-- 1. Bucket: "avatars" (Profile pictures)
-- 2. Bucket: "listings" (Product images)
-- 
-- Set these RLS policies in Supabase Storage settings:
--
-- AVATARS BUCKET:
-- - Allow public read access
-- - Allow authenticated users to upload to their own folder (auth.uid())
-- - Allow users to delete/update their own avatars
--
-- LISTINGS BUCKET:
-- - Allow public read access
-- - Allow authenticated users to upload/manage their own listing images
-- ============================================================================

-- Create function to auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create user_profile on new auth.users entry
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update listings view count in real-time
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- ============================================================================
-- SAMPLE DATA (Optional - remove in production)
-- ============================================================================
-- You can add sample listings here after users are created
