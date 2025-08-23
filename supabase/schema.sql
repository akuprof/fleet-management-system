-- ========================================================
-- PLS Travels Fleet Management Schema (Supabase Compatible)
-- ========================================================

-- Note: auth.users table is managed by Supabase and already has RLS enabled
-- We don't need to modify it directly

-- User & Auth
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions_json JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  role_id BIGINT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  license_number TEXT,
  license_expiry DATE,
  address TEXT,
  join_date DATE,
  status TEXT CHECK (status IN ('active','inactive','suspended','terminated')),
  emergency_contact TEXT,
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  registration_number TEXT UNIQUE NOT NULL,
  model TEXT,
  brand TEXT,
  year INT,
  color TEXT,
  insurance_number TEXT,
  insurance_expiry DATE,
  rc_number TEXT,
  permit_number TEXT,
  status TEXT CHECK (status IN ('available','assigned','maintenance','out_of_service')),
  purchase_date DATE,
  last_maintenance DATE,
  next_maintenance_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT CHECK (entity_type IN ('driver','vehicle')),
  entity_id BIGINT NOT NULL,
  document_type TEXT,
  file_path TEXT,
  file_name TEXT,
  expiry_date DATE,
  status TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active','ended','pending')),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  assignment_id BIGINT REFERENCES assignments(id),
  shift_date DATE,
  shift_type TEXT CHECK (shift_type IN ('day','night')),
  start_time TIME,
  end_time TIME,
  status TEXT CHECK (status IN ('scheduled','completed','missed')),
  pre_shift_inspection TEXT,
  post_shift_inspection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips (manual entry, no GPS)
CREATE TABLE trips (
  id BIGSERIAL PRIMARY KEY,
  shift_id BIGINT REFERENCES shifts(id),
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  trip_start_time TIMESTAMPTZ,
  trip_end_time TIMESTAMPTZ,
  pickup_location TEXT,
  drop_location TEXT,
  distance_km NUMERIC,
  fare_amount NUMERIC,
  platform_commission NUMERIC,
  net_revenue NUMERIC,
  trip_status TEXT CHECK (trip_status IN ('completed','cancelled','disputed')),
  platform_trip_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Summaries
CREATE TABLE daily_summaries (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  summary_date DATE,
  total_trips INT,
  total_revenue NUMERIC,
  total_distance NUMERIC,
  target_amount NUMERIC DEFAULT 2250,
  commission_earned NUMERIC,
  incentive_earned NUMERIC,
  total_payout NUMERIC,
  fuel_expense NUMERIC,
  toll_expense NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE payouts (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  payout_date DATE,
  revenue_amount NUMERIC,
  commission_amount NUMERIC,
  incentive_amount NUMERIC,
  deduction_amount NUMERIC,
  net_payout NUMERIC,
  approval_status TEXT CHECK (approval_status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  payment_status TEXT CHECK (payment_status IN ('pending','paid','failed')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deductions
CREATE TABLE deductions (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  incident_id BIGINT,
  deduction_type TEXT,
  amount NUMERIC,
  reason TEXT,
  status TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  applied_to_payout_id BIGINT REFERENCES payouts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_type TEXT,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  amount NUMERIC,
  expense_date DATE,
  category TEXT,
  description TEXT,
  receipt_path TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE incidents (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  incident_date DATE,
  incident_time TIME,
  location TEXT,
  incident_type TEXT,
  severity TEXT,
  description TEXT,
  is_negligence BOOLEAN,
  company_liable BOOLEAN,
  estimated_cost NUMERIC,
  status TEXT,
  reported_by UUID REFERENCES auth.users(id),
  photos_path TEXT,
  police_report_number TEXT,
  insurance_claim_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident deductions
CREATE TABLE incident_deductions (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT REFERENCES incidents(id),
  deduction_amount NUMERIC,
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions_json) VALUES
('admin', 'System Administrator', '{"all": true}'),
('manager', 'Fleet Manager', '{"manage_drivers": true, "manage_vehicles": true, "approve_payouts": true, "view_reports": true}'),
('driver', 'Driver', '{"log_trips": true, "view_own_data": true, "upload_documents": true}');

-- Row Level Security Policies

-- User profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view all drivers" ON drivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Drivers can view their own data" ON drivers
  FOR SELECT USING (
    id IN (
      SELECT d.id FROM drivers d
      JOIN user_profiles up ON up.username = d.phone
      WHERE up.user_id = auth.uid()
    )
  );

-- Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view all vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

-- Trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trips based on role" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name = 'driver' AND driver_id IN (
          SELECT d.id FROM drivers d
          JOIN user_profiles up2 ON up2.username = d.phone
          WHERE up2.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Drivers can insert their own trips" ON trips
  FOR INSERT WITH CHECK (
    driver_id IN (
      SELECT d.id FROM drivers d
      JOIN user_profiles up ON up.username = d.phone
      WHERE up.user_id = auth.uid()
    )
  );

-- Daily summaries
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view summaries based on role" ON daily_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name = 'driver' AND driver_id IN (
          SELECT d.id FROM drivers d
          JOIN user_profiles up2 ON up2.username = d.phone
          WHERE up2.user_id = auth.uid()
        ))
      )
    )
  );

-- Payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payouts based on role" ON payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name = 'driver' AND driver_id IN (
          SELECT d.id FROM drivers d
          JOIN user_profiles up2 ON up2.username = d.phone
          WHERE up2.user_id = auth.uid()
        ))
      )
    )
  );

-- Additional RLS policies for other tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and managers can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view incidents based on role" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name = 'driver' AND driver_id IN (
          SELECT d.id FROM drivers d
          JOIN user_profiles up2 ON up2.username = d.phone
          WHERE up2.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can report incidents" ON incidents
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view documents based on role" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view expenses based on role" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

-- Enable RLS on remaining tables
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view shifts based on role" ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND (
        r.name IN ('admin', 'manager') OR
        (r.name = 'driver' AND driver_id IN (
          SELECT d.id FROM drivers d
          JOIN user_profiles up2 ON up2.username = d.phone
          WHERE up2.user_id = auth.uid()
        ))
      )
    )
  );

ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and managers can manage deductions" ON deductions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

ALTER TABLE incident_deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and managers can manage incident deductions" ON incident_deductions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN roles r ON up.role_id = r.id 
      WHERE up.user_id = auth.uid() 
      AND r.name IN ('admin', 'manager')
    )
  );

-- Enable RLS on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view roles" ON roles FOR SELECT USING (true);

-- Functions for payout calculation
CREATE OR REPLACE FUNCTION calculate_payout(revenue NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  -- pay = min(revenue, 2250) * 0.30 + max(revenue - 2250, 0) * 0.70
  RETURN LEAST(revenue, 2250) * 0.30 + GREATEST(revenue - 2250, 0) * 0.70;
END;
$$ LANGUAGE plpgsql;

