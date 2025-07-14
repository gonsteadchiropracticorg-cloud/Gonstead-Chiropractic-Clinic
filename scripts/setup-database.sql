-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('in_clinic', 'video')) NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  video_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress reports table
CREATE TABLE IF NOT EXISTS progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  observations TEXT,
  treatment_notes TEXT,
  next_steps TEXT,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  mobility_score INTEGER CHECK (mobility_score >= 0 AND mobility_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for patients table
CREATE POLICY "Patients are viewable by everyone" ON patients FOR SELECT USING (true);
CREATE POLICY "Patients can be inserted by everyone" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Patients can be updated by everyone" ON patients FOR UPDATE USING (true);

-- Create policies for appointments table
CREATE POLICY "Appointments are viewable by everyone" ON appointments FOR SELECT USING (true);
CREATE POLICY "Appointments can be inserted by everyone" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Appointments can be updated by everyone" ON appointments FOR UPDATE USING (true);

-- Create policies for progress reports table
CREATE POLICY "Progress reports are viewable by everyone" ON progress_reports FOR SELECT USING (true);
CREATE POLICY "Progress reports can be inserted by everyone" ON progress_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Progress reports can be updated by everyone" ON progress_reports FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_progress_reports_patient_id ON progress_reports(patient_id);

-- Insert sample data for testing
INSERT INTO patients (name, phone, email) VALUES 
('Ahmad Ali', '+923001234567', 'ahmad@example.com'),
('Fatima Khan', '+923019876543', 'fatima@example.com'),
('Muhammad Hassan', '+923025555555', 'hassan@example.com')
ON CONFLICT (phone) DO NOTHING;
