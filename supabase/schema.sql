-- ========================================================
-- PLS Travels Fleet Management Schema - Supabase Ready
-- ========================================================

-- ========================
-- Tables
-- ========================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions_json JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  role_id BIGINT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
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
CREATE TABLE IF NOT EXISTS vehicles (
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
CREATE TABLE IF NOT EXISTS documents (
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
CREATE TABLE IF NOT EXISTS assignments (
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
CREATE TABLE IF NOT EXISTS shifts (
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

-- Trips
CREATE TABLE IF NOT EXISTS trips (
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
CREATE TABLE IF NOT EXISTS daily_summaries (
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
CREATE TABLE IF NOT EXISTS payouts (
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
CREATE TABLE IF NOT EXISTS deductions (
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
CREATE TABLE IF NOT EXISTS expenses (
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
CREATE TABLE IF NOT EXISTS incidents (
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

-- Incident Deductions
CREATE TABLE IF NOT EXISTS incident_deductions (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT REFERENCES incidents(id),
  deduction_amount NUMERIC,
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Records
CREATE TABLE IF NOT EXISTS fuel_records (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT REFERENCES drivers(id),
  vehicle_id BIGINT REFERENCES vehicles(id),
  fuel_date DATE,
  amount NUMERIC,
  liters NUMERIC,
  price_per_liter NUMERIC,
  total_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance
CREATE TABLE IF NOT EXISTS maintenance (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT REFERENCES vehicles(id),
  maintenance_date DATE,
  description TEXT,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- Default Roles
-- ========================================================
INSERT INTO roles (name, description, permissions_json)
VALUES 
('admin', 'System Administrator', '{"all": true}'),
('manager', 'Fleet Manager', '{"manage_drivers": true, "manage_vehicles": true, "approve_payouts": true, "view_reports": true}'),
('driver', 'Driver', '{"log_trips": true, "view_own_data": true, "upload_documents": true}')
ON CONFLICT (name) DO NOTHING;

-- ========================================================
-- Row Level Security Policies
-- ========================================================

-- Enable RLS on all tables
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- Roles - everyone can read
CREATE POLICY "Everyone can view roles" ON roles FOR SELECT USING (true);

-- User Profiles - users manage own
CREATE POLICY "Users manage their profile" ON user_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Drivers - admin/manager full, driver own
CREATE POLICY "Admins/managers manage drivers" ON drivers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers manage own data" ON drivers
  FOR SELECT USING (
    phone IN (SELECT username FROM user_profiles WHERE user_id = auth.uid())
  );

-- Vehicles - admin/manager full
CREATE POLICY "Admins/managers manage vehicles" ON vehicles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

-- Assignments - admin/manager full
CREATE POLICY "Admins/managers manage assignments" ON assignments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

-- Trips - role-based
CREATE POLICY "Admins/managers manage trips" ON trips
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers manage own trips" ON trips
  FOR ALL USING (
    driver_id IN (SELECT d.id FROM drivers d
                  JOIN user_profiles up ON up.username=d.phone
                  WHERE up.user_id=auth.uid())
  );

-- Daily Summaries
CREATE POLICY "Admins/managers manage summaries" ON daily_summaries
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers view own summaries" ON daily_summaries
  FOR SELECT USING (
    driver_id IN (SELECT d.id FROM drivers d
                  JOIN user_profiles up ON up.username=d.phone
                  WHERE up.user_id=auth.uid())
  );

-- Payouts
CREATE POLICY "Admins/managers manage payouts" ON payouts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers view own payouts" ON payouts
  FOR SELECT USING (
    driver_id IN (SELECT d.id FROM drivers d
                  JOIN user_profiles up ON up.username=d.phone
                  WHERE up.user_id=auth.uid())
  );

-- Incidents
CREATE POLICY "Admins/managers manage incidents" ON incidents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers manage/report own incidents" ON incidents
  FOR ALL USING (
    driver_id IN (SELECT d.id FROM drivers d
                  JOIN user_profiles up ON up.username=d.phone
                  WHERE up.user_id=auth.uid())
    OR reported_by=auth.uid()
  );

-- Incident Deductions
CREATE POLICY "Admins/managers manage incident deductions" ON incident_deductions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

-- Documents
CREATE POLICY "Admins/managers manage documents" ON documents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

-- Fuel Records
CREATE POLICY "Admins/managers manage fuel records" ON fuel_records
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id=r.id
    WHERE up.user_id=auth.uid() AND r.name IN ('admin','manager')
  ));

CREATE POLICY "Drivers manage own fuel records" ON fuel_records
  FOR ALL USING (
    driver_id IN (SELECT d.id FROM drivers d
                  JOIN user_profiles up ON up.username=d.phone
                  WHERE up.user_id=auth.uid())
  );

-- Maintenance - Admins and managers can manage all
CREATE POLICY "Admins and managers manage maintenance" ON maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.user_id = auth.uid()
        AND r.name IN ('admin','manager')
    )
  );

-- ========================================================
-- Functions
-- ========================================================

-- Payout calculation function
CREATE OR REPLACE FUNCTION calculate_payout(revenue NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  -- pay = min(revenue, 2250) * 0.30 + max(revenue - 2250, 0) * 0.70
  RETURN LEAST(revenue, 2250) * 0.30 + GREATEST(revenue - 2250, 0) * 0.70;
END;
$$ LANGUAGE plpgsql;

