-- Insert default roles for Fleet Management System
INSERT INTO roles (name) VALUES 
('admin'),
('manager'),
('driver')
ON CONFLICT (name) DO NOTHING;
