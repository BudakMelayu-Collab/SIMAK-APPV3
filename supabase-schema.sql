-- Staff Profile Table
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL,
    contact TEXT NOT NULL,
    startDate TEXT NOT NULL,
    notes TEXT,
    leaveBalance INTEGER NOT NULL
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    serialNumber TEXT,
    condition TEXT NOT NULL,
    status TEXT NOT NULL,
    assignedToId TEXT,
    assignedToName TEXT,
    purchaseDate TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT
);

-- Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id TEXT PRIMARY KEY,
    staffId TEXT NOT NULL,
    staffName TEXT NOT NULL,
    type TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    durationDays INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL,
    requestDate TEXT NOT NULL
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    fileSize TEXT NOT NULL,
    fileType TEXT NOT NULL,
    description TEXT,
    tags TEXT
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Optional: Disable RLS for testing, or write proper RLS rules if authenticated user checks are needed.
-- For local testing or non-sensitive internal tools behind Google OAuth, we can just disable it temporarily.
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Documents Bucket (Allow public access for this applet)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- Disable RLS on storage.objects for easier testing (Optional, use with caution in production)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
