-- Add RLS policies for tables that need public access for testing
-- Run this in your Supabase SQL Editor

-- Enable RLS on tables that don't have it
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- Add basic read policies for anonymous users (for testing)
-- Note: In production, you'll want more restrictive policies

-- User profiles - allow reading all profiles for now
CREATE POLICY "Allow anonymous read access to user_profiles" ON user_profiles
    FOR SELECT USING (true);

-- Drivers - allow reading all drivers
CREATE POLICY "Allow anonymous read access to drivers" ON drivers
    FOR SELECT USING (true);

-- Vehicles - allow reading all vehicles
CREATE POLICY "Allow anonymous read access to vehicles" ON vehicles
    FOR SELECT USING (true);

-- Trips - allow reading all trips
CREATE POLICY "Allow anonymous read access to trips" ON trips
    FOR SELECT USING (true);

-- Fuel records - allow reading all fuel records
CREATE POLICY "Allow anonymous read access to fuel_records" ON fuel_records
    FOR SELECT USING (true);

-- Maintenance - allow reading all maintenance records
CREATE POLICY "Allow anonymous read access to maintenance" ON maintenance
    FOR SELECT USING (true);

-- Insert policies for authenticated users
CREATE POLICY "Allow authenticated insert to user_profiles" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to drivers" ON drivers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to fuel_records" ON fuel_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to maintenance" ON maintenance
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
