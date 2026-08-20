-- =============================================================
-- MINDSPACE LIBRARY - COMPLETE SUPABASE DATABASE SCHEMA & TABLES
-- Copy and paste this ENTIRE script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bzdmuuuslrqlivjqbiwj/sql/new
-- =============================================================

-- 1. SITE SETTINGS TABLE (Global Website Content, Founder Photo/Note, Gallery, Credentials)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS on site_settings so all visitors can read live site content & admin can update
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- Insert default initial settings if table is empty
INSERT INTO public.site_settings (id, content, updated_at)
VALUES (
  'default',
  '{
    "heroImage": "/photos/IMG_20260603_202841812_HDR.jpg",
    "totalCabins": "113+",
    "internetSpeed": "100+ Mbps",
    "googleRating": "4.9",
    "dailyAccessHours": "15 hrs",
    "referenceBooksCount": "5,000+",
    "founderName": "Harsh Goyal",
    "founderRole": "Founder & Managing Director",
    "founderSubrole": "Architect of MindSpace Sanctuary",
    "founderPhoto": "/assets/founder_portrait.png",
    "founderNoteP1": "MindSpace was born from a singular realization: that brilliance is universal, but high-performance environments are often localized to tier-1 cities.",
    "founderNoteP2": "By bringing a premium sanctuary to Ambikapur, we are not just providing desks; we are building a stage where local talent can prepare for global excellence.",
    "founderTagline": "Books open mind, MindSpace opens possibilities.",
    "deepWorkImage": "/photos/IMG_20260603_202841812_HDR.jpg",
    "deepWorkTitle": "Designed for Deep Work",
    "deepWorkDesc": "Eliminating the cognitive load of noise, so your brain can achieve the Flow state faster.",
    "galleryImages": [
      { "id": "img-1", "title": "Main Focus Hall", "subtitle": "Spacious & Calibrated Seating", "url": "/photos/IMG_20260603_203144883_HDR.jpg" },
      { "id": "img-2", "title": "Focus Cabin", "subtitle": "Silent Individual Workstations", "url": "/photos/IMG_20260603_202944240_HDR.jpg" },
      { "id": "img-3", "title": "Dedicated Desk", "subtitle": "Personal Desk Lamp & Outlets", "url": "/photos/IMG_20260603_202919449_HDR.jpg" },
      { "id": "img-4", "title": "Workstation Rows", "subtitle": "Ventilated & Air Conditioned", "url": "/photos/IMG_20260603_203135772_HDR.jpg" },
      { "id": "img-5", "title": "Study Sanctuary", "subtitle": "Ergonomic Chairs & Wide Desks", "url": "/photos/IMG_20260603_202841812_HDR.jpg" },
      { "id": "img-6", "title": "Personal Storage", "subtitle": "Secure Lockers & Quiet Ambiance", "url": "/photos/IMG_20260603_203042678_HDR~2.jpg" }
    ],
    "adminUsername": "mindspace-01",
    "adminPassword": "Harsh@44",
    "staffUsername": "staff-01",
    "staffPassword": "Staff.01"
  }'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;


-- 2. MEMBERS TABLE (Student Profiles)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permanent_id VARCHAR(50) UNIQUE,
    branch VARCHAR(50) DEFAULT 'main_branch',
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    parent_mobile VARCHAR(20),
    address TEXT,
    aadhar_no VARCHAR(20),
    id_proof_url TEXT,
    student_photo_url TEXT,
    assigned_seat VARCHAR(20),
    assigned_locker VARCHAR(20),
    shift VARCHAR(100),
    plan_name VARCHAR(100),
    monthly_fee NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    joining_date DATE,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;


-- 3. ADMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) DEFAULT 'main_branch',
    student_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    student_name VARCHAR(100),
    mobile VARCHAR(20),
    plan_name VARCHAR(100),
    shift_name VARCHAR(100),
    seat_number VARCHAR(20),
    monthly_fee NUMERIC(10,2) DEFAULT 0,
    joining_date DATE,
    valid_until DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.admissions DISABLE ROW LEVEL SECURITY;


-- 4. PAYMENTS TABLE (Fee Invoices & Receipts)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE,
    branch VARCHAR(50) DEFAULT 'main_branch',
    student_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    student_name VARCHAR(100),
    mobile VARCHAR(20),
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    due_amount NUMERIC(10,2) DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    transaction_ref VARCHAR(100),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    remarks TEXT,
    collected_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;


-- 5. EXPENSES TABLE (Library Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) DEFAULT 'main_branch',
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    added_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;


-- 6. ACTIVITY LOGS TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) DEFAULT 'main_branch',
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    performed_by VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    before_state TEXT,
    after_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;


-- 7. ENQUIRIES / LEADS TABLE (Contact Form Submissions)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) DEFAULT 'main_branch',
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    plan_interest VARCHAR(100),
    shift_interest VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.enquiries DISABLE ROW LEVEL SECURITY;


-- 8. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 150,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;

INSERT INTO public.branches (code, name, total_capacity, address)
VALUES ('main_branch', 'Mindspace Library Ambikapur', 150, 'Manendragarh Rd, Ambikapur')
ON CONFLICT (code) DO NOTHING;

-- Grant full access to anon, authenticated and service_role to guarantee live cloud sync across all devices
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
