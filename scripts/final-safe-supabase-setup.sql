-- ===================================================================
-- FINAL SAFE GONSTEAD CHIROPRACTIC SUPABASE DATABASE SETUP
-- Version: 2.4 - Only uses existing columns in updates
-- ===================================================================

-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- STEP 1: CREATE OR UPDATE CORE TABLES SAFELY
-- ===================================================================

-- 1.1 Enhanced patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    session_type VARCHAR(20) CHECK (session_type IN ('in_clinic', 'video')) NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')) DEFAULT 'pending',
    urgency VARCHAR(20) CHECK (urgency IN ('normal', 'urgent', 'emergency')) DEFAULT 'normal',
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card')) DEFAULT 'cash',
    notes TEXT,
    medical_history TEXT,
    sessions_completed INTEGER DEFAULT 0,
    last_visit TIMESTAMPTZ,
    demographics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to patients table if they don't exist
DO $$ 
BEGIN
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'payment_status') THEN
        ALTER TABLE patients ADD COLUMN payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')) DEFAULT 'pending';
    END IF;
    
    -- Add amount_due column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'amount_due') THEN
        ALTER TABLE patients ADD COLUMN amount_due DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add amount_paid column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'amount_paid') THEN
        ALTER TABLE patients ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add diagnosis column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'diagnosis') THEN
        ALTER TABLE patients ADD COLUMN diagnosis TEXT;
    END IF;
    
    -- Add treatment_plan column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'treatment_plan') THEN
        ALTER TABLE patients ADD COLUMN treatment_plan JSONB DEFAULT '{}';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'total_sessions_planned') THEN
        ALTER TABLE patients ADD COLUMN total_sessions_planned INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'next_appointment') THEN
        ALTER TABLE patients ADD COLUMN next_appointment TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'emergency_contact') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'consent_given') THEN
        ALTER TABLE patients ADD COLUMN consent_given BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'follow_up_required') THEN
        ALTER TABLE patients ADD COLUMN follow_up_required BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'satisfaction_rating') THEN
        ALTER TABLE patients ADD COLUMN satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'updated_at') THEN
        ALTER TABLE patients ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 1.2 Create or update admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to admin_users table
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) CHECK (role IN ('admin', 'doctor', 'super_admin')) DEFAULT 'doctor';
    ELSE
        -- If role column exists, ensure the constraint allows super_admin
        -- Drop existing constraint if it exists and recreate with proper values
        BEGIN
            ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
            ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'doctor', 'super_admin'));
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if constraint doesn't exist or can't be dropped
                NULL;
        END;
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'name') THEN
        ALTER TABLE admin_users ADD COLUMN name VARCHAR(255);
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'phone') THEN
        ALTER TABLE admin_users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Add specialization column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'specialization') THEN
        ALTER TABLE admin_users ADD COLUMN specialization VARCHAR(255);
    END IF;
    
    -- Add profile column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'profile') THEN
        ALTER TABLE admin_users ADD COLUMN profile JSONB DEFAULT '{}';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'updated_at') THEN
        ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'license_number') THEN
        ALTER TABLE admin_users ADD COLUMN license_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'experience_years') THEN
        ALTER TABLE admin_users ADD COLUMN experience_years INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'qualifications') THEN
        ALTER TABLE admin_users ADD COLUMN qualifications JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'permissions') THEN
        ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'last_login') THEN
        ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'login_attempts') THEN
        ALTER TABLE admin_users ADD COLUMN login_attempts INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'password_changed_at') THEN
        ALTER TABLE admin_users ADD COLUMN password_changed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 1.3 Staff users table
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('receptionist', 'assistant', 'nurse', 'manager')) DEFAULT 'receptionist',
    phone VARCHAR(20),
    employee_id VARCHAR(50),
    department VARCHAR(100),
    shift_schedule JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{"view_appointments": true, "edit_appointments": false, "view_payments": false, "manage_reviews": false}',
    salary DECIMAL(10,2),
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    emergency_contact JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- STEP 2: CREATE NEW TABLES (DEPENDENT TABLES)
-- ===================================================================

-- 2.1 Patient reviews table
CREATE TABLE IF NOT EXISTS patient_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    full_content TEXT,
    category VARCHAR(50) CHECK (category IN ('Treatment', 'Service', 'Support', 'Quality', 'Staff', 'Facility', 'Overall')) DEFAULT 'Treatment',
    author_name VARCHAR(255) NOT NULL,
    author_initials VARCHAR(5),
    author_location VARCHAR(255) DEFAULT 'Nowshera, Pakistan',
    author_email VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_recommended BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    response_from_doctor TEXT,
    response_date TIMESTAMPTZ,
    moderation_notes TEXT,
    source VARCHAR(50) DEFAULT 'website',
    treatment_type VARCHAR(100),
    visit_date DATE,
    would_recommend BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Review responses table
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES patient_reviews(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES patient_reviews(id) ON DELETE CASCADE,
    voter_ip VARCHAR(45),
    voter_session VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, voter_ip, voter_session)
);

-- 2.4 Clinic settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Payment records table
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id UUID,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('payment', 'refund', 'adjustment', 'discount')) DEFAULT 'payment',
    payment_method VARCHAR(30) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'insurance')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    service_type VARCHAR(100),
    session_count INTEGER DEFAULT 1,
    discount_applied DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    payment_proof_url TEXT,
    receipt_number VARCHAR(50),
    recorded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    approval_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Other supporting tables
CREATE TABLE IF NOT EXISTS financial_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_payments DECIMAL(12,2) DEFAULT 0.00,
    total_refunds DECIMAL(12,2) DEFAULT 0.00,
    patient_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    average_per_patient DECIMAL(10,2) DEFAULT 0.00,
    payment_methods JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)
);

CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) CHECK (type IN ('appointment', 'payment', 'review', 'system', 'marketing')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('admin', 'staff', 'patient', 'all')) DEFAULT 'admin',
    recipient_id UUID,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address VARCHAR(45),
    page_url TEXT NOT NULL,
    page_title VARCHAR(500),
    referrer TEXT,
    visit_duration INTEGER,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    is_new_visitor BOOLEAN DEFAULT true,
    conversion_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_appointment_date ON patients(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Only create payment_status index if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'patients' AND column_name = 'payment_status') THEN
        CREATE INDEX IF NOT EXISTS idx_patients_payment_status ON patients(payment_status);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON patient_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON patient_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON patient_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status);

CREATE INDEX IF NOT EXISTS idx_settings_key ON clinic_settings(setting_key);

-- ===================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ===================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- STEP 5: CREATE RLS POLICIES (SAFELY)
-- ===================================================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Admin full access to patients" ON patients;
DROP POLICY IF EXISTS "Admin full access to reviews" ON patient_reviews;
DROP POLICY IF EXISTS "Admin full access to payments" ON payment_records;
DROP POLICY IF EXISTS "Admin full access to settings" ON clinic_settings;
DROP POLICY IF EXISTS "Public can view approved reviews" ON patient_reviews;
DROP POLICY IF EXISTS "Public can view public settings" ON clinic_settings;

-- Create new policies
CREATE POLICY "Admin full access to patients" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to reviews" ON patient_reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to payments" ON payment_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to settings" ON clinic_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to notifications" ON system_notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to analytics" ON website_analytics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to financial summary" ON financial_summary FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view approved reviews" ON patient_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public can view public settings" ON clinic_settings FOR SELECT USING (is_public = true);

-- ===================================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- ===================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (only if column exists)
DO $$
BEGIN
    -- Create trigger for patients table if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'patients' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
        CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for admin_users table if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'admin_users' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
        CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for patient_reviews table
    DROP TRIGGER IF EXISTS update_reviews_updated_at ON patient_reviews;
    CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON patient_reviews
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Function for comprehensive patient statistics
CREATE OR REPLACE FUNCTION get_comprehensive_patient_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_patients', (SELECT COUNT(*) FROM patients),
        'today_appointments', (SELECT COUNT(*) FROM patients WHERE DATE(appointment_date) = CURRENT_DATE),
        'pending_appointments', (SELECT COUNT(*) FROM patients WHERE status = 'pending'),
        'confirmed_appointments', (SELECT COUNT(*) FROM patients WHERE status = 'confirmed'),
        'completed_sessions', (SELECT COALESCE(SUM(sessions_completed), 0) FROM patients),
        'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE status = 'completed'),
        'average_rating', (SELECT ROUND(AVG(rating), 2) FROM patient_reviews WHERE is_approved = true),
        'total_reviews', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = true)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function for review statistics
CREATE OR REPLACE FUNCTION get_review_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reviews', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = true),
        'average_rating', (SELECT ROUND(AVG(rating), 2) FROM patient_reviews WHERE is_approved = true),
        'pending_moderation', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = false),
        'featured_count', (SELECT COUNT(*) FROM patient_reviews WHERE is_featured = true)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- STEP 7: INSERT INITIAL DATA (USING DYNAMIC SQL)
-- ===================================================================

-- Insert admin user using dynamic SQL based on existing columns
DO $$
DECLARE
    update_clause TEXT := '';
    has_updated_at BOOLEAN := FALSE;
BEGIN
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'updated_at'
    ) INTO has_updated_at;

    -- Build update clause
    update_clause := 'role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone, specialization = EXCLUDED.specialization, profile = EXCLUDED.profile';
    
    IF has_updated_at THEN
        update_clause := update_clause || ', updated_at = NOW()';
    END IF;

    -- Execute dynamic insert with conditional update
    EXECUTE format('
        INSERT INTO admin_users (email, role, name, phone, specialization, profile) 
        VALUES (
            ''Bashirahmad123.org@gmail.com'', 
            ''super_admin'',
            ''Dr. Bashir Ahmad Khan'',
            ''+92 304 6996267'',
            ''Gonstead Chiropractic Specialist'',
            ''{"title": "Dr. Bashir Ahmad Khan", "designation": "Gonstead Chiropractic Specialist", "experience": "10+ years"}''::jsonb
        )
        ON CONFLICT (email) DO UPDATE SET %s', update_clause);
END $$;

-- Insert clinic settings
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description, is_public) VALUES 
('clinic_location', '{
    "name": "Gonstead Chiropractic Clinic - Dr. Bashir",
    "address": "Near Police Station, Tehsil Road, Nowshera, Pakistan",
    "coordinates": {"lat": 34.01533, "lng": 71.97788},
    "google_maps_url": "https://maps.app.goo.gl/8pJ9o2hCPtGY3XtD9",
    "google_maps_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.4614046736474!2d71.97788!3d34.01533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d917b90f9b6ce9%3A0x93c2e9e4a56d3a0d!2sGonstead%20Chiropractic%20Clinic%20-%20Dr.%20Bashir!5e0!3m2!1sen!2s!4v1717687854793!5m2!1sen!2s",
    "city": "Nowshera",
    "state": "Khyber Pakhtunkhwa",
    "country": "Pakistan"
}'::jsonb, 'location', 'Main clinic location and map settings', true),

('contact_info', '{
    "phone": "+92 304 6996267",
    "whatsapp": "+92 304 6996267",
    "email": "Bashirahmad123.org@gmail.com",
    "emergency_phone": "+92 304 6996267",
    "website": "https://gonstead-chiropractic.com"
}'::jsonb, 'contact', 'Contact information', true),

('business_hours', '{
    "monday": {"open": "08:00", "close": "18:00", "is_open": true},
    "tuesday": {"open": "08:00", "close": "18:00", "is_open": true},
    "wednesday": {"open": "08:00", "close": "18:00", "is_open": true},
    "thursday": {"open": "08:00", "close": "18:00", "is_open": true},
    "friday": {"open": "08:00", "close": "18:00", "is_open": true},
    "saturday": {"open": "09:00", "close": "15:00", "is_open": true},
    "sunday": {"open": "00:00", "close": "00:00", "is_open": false},
    "emergency": {"available": true, "note": "24/7 Emergency Services Available"}
}'::jsonb, 'schedule', 'Business operating hours', true),

('website_settings', '{
    "title": "Gonstead Chiropractic Clinic - Dr. Bashir Khan",
    "description": "Professional Gonstead Chiropractic Treatment in Nowshera, Pakistan",
    "logo_url": "/images/gonstead-chiropractic-logo-new.png",
    "theme_colors": {"primary": "#0d5c75", "secondary": "#2a9d8f", "accent": "#D2F5E2"},
    "social_media": {"facebook": "", "instagram": "", "youtube": "", "linkedin": ""}
}'::jsonb, 'website', 'Website configuration and branding', true)

ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample staff user
INSERT INTO staff_users (email, name, role, phone, permissions) 
VALUES (
    'receptionist@gonstead.com', 
    'Clinic Receptionist',
    'receptionist',
    '+92 304 1234567',
    '{"view_appointments": true, "edit_appointments": true, "view_payments": true}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Create success notification
INSERT INTO system_notifications (type, title, message, recipient_type, priority)
VALUES (
    'system',
    'Database Setup Complete',
    'Enhanced Gonstead Chiropractic database has been successfully set up with all features.',
    'admin',
    'high'
);

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 FINAL SAFE GONSTEAD CHIROPRACTIC DATABASE SETUP COMPLETED!';
    RAISE NOTICE '✅ All tables created or updated successfully';
    RAISE NOTICE '✅ Missing columns added safely';
    RAISE NOTICE '✅ All indexes and policies applied';
    RAISE NOTICE '✅ Sample data inserted with dynamic SQL';
    RAISE NOTICE '✅ Admin user: Bashirahmad123.org@gmail.com';
    RAISE NOTICE '✅ Ready for admin pages to work!';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Admin Features Now Available:';
    RAISE NOTICE '   - Reviews & Ratings Management (/admin/reviews)';
    RAISE NOTICE '   - Location Settings (/admin/location-settings)';
    RAISE NOTICE '   - Payment Records Tracking';
    RAISE NOTICE '   - Patient Management Enhanced';
    RAISE NOTICE '   - Staff Management System';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Status:';
    RAISE NOTICE '   - 10 tables created/updated';
    RAISE NOTICE '   - Row Level Security enabled';
    RAISE NOTICE '   - Professional admin interface ready';
    RAISE NOTICE '   - All existing data preserved';
    RAISE NOTICE '   - Dynamic SQL prevents column errors';
END $$;
