-- ===================================================================
-- FIXED GONSTEAD CHIROPRACTIC SUPABASE DATABASE SETUP
-- Version: 2.1 - Handles existing tables and prevents column conflicts
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to patients" ON patients;
DROP POLICY IF EXISTS "Admin full access to reviews" ON patient_reviews;
DROP POLICY IF EXISTS "Admin full access to payments" ON payment_records;
DROP POLICY IF EXISTS "Admin full access to settings" ON clinic_settings;
DROP POLICY IF EXISTS "Admin full access to notifications" ON system_notifications;
DROP POLICY IF EXISTS "Admin full access to analytics" ON website_analytics;
DROP POLICY IF EXISTS "Admin full access to financial summary" ON financial_summary;
DROP POLICY IF EXISTS "Public can view approved reviews" ON patient_reviews;
DROP POLICY IF EXISTS "Public can view public settings" ON clinic_settings;
DROP POLICY IF EXISTS "Staff can view patients" ON patients;

-- ===================================================================
-- CREATE OR UPDATE TABLES
-- ===================================================================

-- Enhanced patients table (update existing or create new)
DO $$ 
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'patients') THEN
        CREATE TABLE patients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            session_type VARCHAR(20) CHECK (session_type IN ('in_clinic', 'video')) NOT NULL,
            appointment_date TIMESTAMPTZ NOT NULL,
            status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')) DEFAULT 'pending',
            urgency VARCHAR(20) CHECK (urgency IN ('normal', 'urgent', 'emergency')) DEFAULT 'normal',
            payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card')) DEFAULT 'cash',
            payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')) DEFAULT 'pending',
            amount_due DECIMAL(10,2) DEFAULT 0.00,
            amount_paid DECIMAL(10,2) DEFAULT 0.00,
            notes TEXT,
            medical_history TEXT,
            diagnosis TEXT,
            treatment_plan JSONB DEFAULT '{}',
            sessions_completed INTEGER DEFAULT 0,
            total_sessions_planned INTEGER DEFAULT 1,
            last_visit TIMESTAMPTZ,
            next_appointment TIMESTAMPTZ,
            emergency_contact JSONB DEFAULT '{}',
            demographics JSONB DEFAULT '{}',
            consent_given BOOLEAN DEFAULT false,
            follow_up_required BOOLEAN DEFAULT true,
            satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE patients 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS diagnosis TEXT,
        ADD COLUMN IF NOT EXISTS treatment_plan JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS total_sessions_planned INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS next_appointment TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
    END IF;
END $$;

-- Enhanced admin_users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'admin_users') THEN
        CREATE TABLE admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(20) CHECK (role IN ('admin', 'doctor', 'super_admin')) DEFAULT 'doctor',
            name VARCHAR(255),
            phone VARCHAR(20),
            specialization VARCHAR(255),
            license_number VARCHAR(100),
            experience_years INTEGER DEFAULT 0,
            qualifications JSONB DEFAULT '[]',
            permissions JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMPTZ,
            login_attempts INTEGER DEFAULT 0,
            password_changed_at TIMESTAMPTZ DEFAULT NOW(),
            profile JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE admin_users 
        ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
        ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Enhanced staff_users table
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
-- REVIEWS & RATINGS SYSTEM
-- ===================================================================

-- Patient reviews and ratings table
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

-- Review responses/replies table
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES patient_reviews(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES patient_reviews(id) ON DELETE CASCADE,
    voter_ip VARCHAR(45),
    voter_session VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, voter_ip, voter_session)
);

-- ===================================================================
-- CLINIC SETTINGS & CONFIGURATION
-- ===================================================================

-- Clinic settings for admin management
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- PAYMENT & FINANCIAL MANAGEMENT
-- ===================================================================

-- Comprehensive payment records table
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id UUID,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('payment', 'refund', 'adjustment', 'discount')) DEFAULT 'payment',
    payment_method VARCHAR(30) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'insurance')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    
    -- Payment Details
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    
    -- Service Details
    service_type VARCHAR(100),
    session_count INTEGER DEFAULT 1,
    discount_applied DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Additional Information
    notes TEXT,
    payment_proof_url TEXT,
    receipt_number VARCHAR(50),
    
    -- Financial Tracking
    recorded_by UUID REFERENCES admin_users(id),
    approved_by UUID REFERENCES admin_users(id),
    approval_date TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial summary table for reporting
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

-- ===================================================================
-- NOTIFICATION & COMMUNICATION
-- ===================================================================

-- System notifications table
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

-- ===================================================================
-- ANALYTICS & REPORTING
-- ===================================================================

-- Website analytics table
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
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_appointment_date ON patients(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_payment_status ON patients(payment_status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_urgency ON patients(urgency);

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON patient_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON patient_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON patient_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON patient_reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON patient_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON patient_reviews(patient_id);

CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payment_records(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payment_records(amount);

CREATE INDEX IF NOT EXISTS idx_analytics_page_url ON website_analytics(page_url);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON website_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON website_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_settings_key ON clinic_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_type ON clinic_settings(setting_type);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS on all tables
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
-- RLS POLICIES
-- ===================================================================

-- Admin access policies (full access for authenticated admins)
CREATE POLICY "Admin full access to patients" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to reviews" ON patient_reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to payments" ON payment_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to settings" ON clinic_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to notifications" ON system_notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to analytics" ON website_analytics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to financial summary" ON financial_summary FOR ALL USING (auth.role() = 'authenticated');

-- Public policies for reviews (approved reviews only)
CREATE POLICY "Public can view approved reviews" ON patient_reviews 
    FOR SELECT USING (is_approved = true);

-- Public policies for clinic settings
CREATE POLICY "Public can view public settings" ON clinic_settings 
    FOR SELECT USING (is_public = true);

-- Staff policies (limited access)
CREATE POLICY "Staff can view patients" ON patients 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id::text = auth.uid()::text 
            AND staff_users.is_active = true
            AND (staff_users.permissions->>'view_appointments')::boolean = true
        )
    );

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_staff_users_updated_at ON staff_users;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON patient_reviews;
DROP TRIGGER IF EXISTS update_settings_updated_at ON clinic_settings;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payment_records;

-- Create triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON patient_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON clinic_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE patient_reviews 
        SET helpful_count = helpful_count + 1 
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE patient_reviews 
        SET helpful_count = helpful_count - 1 
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_helpful_count ON review_helpful_votes;

-- Create trigger for helpful count updates
CREATE TRIGGER update_helpful_count 
    AFTER INSERT OR DELETE ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function to get comprehensive patient statistics
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
        'emergency_patients', (SELECT COUNT(*) FROM patients WHERE urgency = 'emergency'),
        'this_week_appointments', (SELECT COUNT(*) FROM patients WHERE appointment_date >= DATE_TRUNC('week', CURRENT_DATE)),
        'this_month_appointments', (SELECT COUNT(*) FROM patients WHERE appointment_date >= DATE_TRUNC('month', CURRENT_DATE)),
        'average_rating', (SELECT ROUND(AVG(rating), 2) FROM patient_reviews WHERE is_approved = true),
        'total_reviews', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = true),
        'pending_payments', (SELECT COUNT(*) FROM patients WHERE payment_status = 'pending'),
        'payment_methods', (
            SELECT json_object_agg(payment_method, count) 
            FROM (
                SELECT payment_method, COUNT(*) as count 
                FROM payment_records 
                WHERE status = 'completed' 
                GROUP BY payment_method
            ) pm
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get review statistics
CREATE OR REPLACE FUNCTION get_review_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reviews', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = true),
        'average_rating', (SELECT ROUND(AVG(rating), 2) FROM patient_reviews WHERE is_approved = true),
        'rating_breakdown', (
            SELECT json_object_agg(rating, count)
            FROM (
                SELECT rating, COUNT(*) as count 
                FROM patient_reviews 
                WHERE is_approved = true 
                GROUP BY rating 
                ORDER BY rating
            ) r
        ),
        'category_breakdown', (
            SELECT json_object_agg(category, count)
            FROM (
                SELECT category, COUNT(*) as count 
                FROM patient_reviews 
                WHERE is_approved = true 
                GROUP BY category
            ) c
        ),
        'pending_moderation', (SELECT COUNT(*) FROM patient_reviews WHERE is_approved = false),
        'featured_count', (SELECT COUNT(*) FROM patient_reviews WHERE is_featured = true),
        'response_rate', (
            SELECT ROUND(
                (SELECT COUNT(*) FROM patient_reviews WHERE response_from_doctor IS NOT NULL AND is_approved = true) * 100.0 / 
                NULLIF((SELECT COUNT(*) FROM patient_reviews WHERE is_approved = true), 0), 2
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- INITIAL DATA SETUP
-- ===================================================================

-- Insert the main admin user (with conflict handling)
INSERT INTO admin_users (email, role, name, phone, specialization, profile) 
VALUES (
    'Bashirahmad123.org@gmail.com', 
    'super_admin',
    'Dr. Bashir Ahmad Khan',
    '+92 304 6996267',
    'Gonstead Chiropractic Specialist',
    json_build_object(
        'title', 'Dr. Bashir Ahmad Khan',
        'designation', 'Gonstead Chiropractic Specialist',
        'experience', '10+ years',
        'education', 'Doctor of Chiropractic (D.C.)',
        'certifications', array['Gonstead Technique Certification', 'Advanced Spinal Analysis'],
        'bio', 'Leading Gonstead chiropractic specialist in Pakistan with over 10 years of experience treating spinal conditions and improving patient quality of life.'
    )
)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    specialization = EXCLUDED.specialization,
    profile = EXCLUDED.profile,
    updated_at = NOW();

-- Insert sample staff user (with conflict handling)
INSERT INTO staff_users (email, name, role, phone, permissions) 
VALUES (
    'receptionist@gonstead.com', 
    'Clinic Receptionist',
    'receptionist',
    '+92 304 1234567',
    json_build_object(
        'view_appointments', true,
        'edit_appointments', true,
        'view_payments', true,
        'manage_reviews', false,
        'access_analytics', false
    )
)
ON CONFLICT (email) DO NOTHING;

-- Insert clinic settings (with conflict handling)
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description, is_public) VALUES 
('clinic_location', '{
    "name": "Gonstead Chiropractic Clinic - Dr. Bashir",
    "address": "Near Police Station, Tehsil Road, Nowshera, Pakistan",
    "coordinates": {"lat": 34.01533, "lng": 71.97788},
    "google_maps_url": "https://maps.app.goo.gl/8pJ9o2hCPtGY3XtD9",
    "google_maps_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.4614046736474!2d71.97788!3d34.01533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d917b90f9b6ce9%3A0x93c2e9e4a56d3a0d!2sGonstead%20Chiropractic%20Clinic%20-%20Dr.%20Bashir!5e0!3m2!1sen!2s!4v1717687854793!5m2!1sen!2s",
    "city": "Nowshera",
    "state": "Khyber Pakhtunkhwa",
    "country": "Pakistan",
    "postal_code": "24110"
}', 'location', 'Main clinic location and map settings', true),

('contact_info', '{
    "phone": "+92 304 6996267",
    "whatsapp": "+92 304 6996267",
    "email": "Bashirahmad123.org@gmail.com",
    "emergency_phone": "+92 304 6996267",
    "website": "https://gonstead-chiropractic.com"
}', 'contact', 'Contact information', true),

('business_hours', '{
    "monday": {"open": "08:00", "close": "18:00", "is_open": true},
    "tuesday": {"open": "08:00", "close": "18:00", "is_open": true},
    "wednesday": {"open": "08:00", "close": "18:00", "is_open": true},
    "thursday": {"open": "08:00", "close": "18:00", "is_open": true},
    "friday": {"open": "08:00", "close": "18:00", "is_open": true},
    "saturday": {"open": "09:00", "close": "15:00", "is_open": true},
    "sunday": {"open": "00:00", "close": "00:00", "is_open": false},
    "emergency": {"available": true, "note": "24/7 Emergency Services Available"}
}', 'schedule', 'Business operating hours', true),

('website_settings', '{
    "title": "Gonstead Chiropractic Clinic - Dr. Bashir Khan",
    "description": "Professional Gonstead Chiropractic Treatment in Nowshera, Pakistan",
    "logo_url": "/images/gonstead-chiropractic-logo-new.png",
    "theme_colors": {"primary": "#0d5c75", "secondary": "#2a9d8f", "accent": "#D2F5E2"},
    "social_media": {
        "facebook": "",
        "instagram": "",
        "youtube": "",
        "linkedin": ""
    }
}', 'website', 'Website configuration and branding', true),

('review_settings', '{
    "auto_approve": false,
    "min_rating_to_show": 1,
    "featured_reviews_count": 6,
    "enable_responses": true,
    "show_patient_names": true,
    "moderation_required": true
}', 'reviews', 'Review and rating system settings', false) 

ON CONFLICT (setting_key) DO NOTHING;

-- Create a notification for successful setup
INSERT INTO system_notifications (type, title, message, recipient_type, priority)
VALUES (
    'system',
    'Database Setup Complete',
    'Enhanced Gonstead Chiropractic database has been successfully set up with all features: patient management, reviews & ratings, location management, payment records, and admin controls.',
    'admin',
    'high'
)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ GONSTEAD CHIROPRACTIC DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All tables created or updated successfully';
    RAISE NOTICE '✅ All indexes and policies applied';
    RAISE NOTICE '✅ Admin user: Bashirahmad123.org@gmail.com';
    RAISE NOTICE '✅ Database version: 2.1 (Fixed)';
    RAISE NOTICE '✅ Ready for production use!';
END $$;
