-- Enable Row Level Security
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    session_type VARCHAR(20) CHECK (session_type IN ('in_clinic', 'video')) NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    urgency VARCHAR(20) CHECK (urgency IN ('normal', 'urgent', 'emergency')) DEFAULT 'normal',
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa')) DEFAULT 'cash',
    notes TEXT,
    medical_history TEXT,
    sessions_completed INTEGER DEFAULT 0,
    last_visit TIMESTAMPTZ,
    demographics JSONB DEFAULT '{}',
    treatment_plan JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'doctor')) DEFAULT 'doctor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    profile JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_appointment_date ON patients(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Create RLS policies for patients table
CREATE POLICY "Admin can view all patients" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert patients" ON patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update patients" ON patients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete patients" ON patients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for admin_users table
CREATE POLICY "Admin can view admin users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert the admin user
INSERT INTO admin_users (email, role, profile) 
VALUES ('Bashirahmad123.org@gmail.com', 'admin', '{"name": "Dr. Bashir Ahmad", "title": "Gonstead Chiropractic Specialist"}')
ON CONFLICT (email) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for patients table
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get patient statistics
CREATE OR REPLACE FUNCTION get_patient_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_patients', (SELECT COUNT(*) FROM patients),
        'today_appointments', (SELECT COUNT(*) FROM patients WHERE DATE(appointment_date) = CURRENT_DATE),
        'pending_appointments', (SELECT COUNT(*) FROM patients WHERE status = 'pending'),
        'completed_sessions', (SELECT COALESCE(SUM(sessions_completed), 0) FROM patients),
        'emergency_patients', (SELECT COUNT(*) FROM patients WHERE urgency = 'emergency'),
        'this_week_appointments', (SELECT COUNT(*) FROM patients WHERE appointment_date >= DATE_TRUNC('week', CURRENT_DATE)),
        'this_month_appointments', (SELECT COUNT(*) FROM patients WHERE appointment_date >= DATE_TRUNC('month', CURRENT_DATE))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
