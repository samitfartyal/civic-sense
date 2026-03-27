-- ===================================
-- CIVIC SENSE - SUPABASE DATABASE SCHEMA
-- ===================================
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- USERS TABLE
-- ===================================
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    city TEXT,
    pincode TEXT,
    password_hash TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- REPORTS TABLE
-- ===================================
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    report_type TEXT,
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    urgency TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'progress', 'resolved')),
    photos TEXT[], -- Array of photo URLs
    contact_name TEXT,
    contact_email TEXT,
    upvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- POSTS TABLE
-- ===================================
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    author TEXT NOT NULL,
    category TEXT,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- MEDIA/REELS TABLE
-- ===================================
CREATE TABLE media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('video', 'image')),
    video_url TEXT,
    image_urls TEXT[],
    location TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- MAP ISSUES TABLE
-- ===================================
CREATE TABLE map_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- COMMENTS TABLE
-- ===================================
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_map_issues_status ON map_issues(status);
CREATE INDEX idx_map_issues_location ON map_issues(latitude, longitude);

-- ===================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON reports FOR SELECT USING (true);
CREATE POLICY "Public read access" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON media FOR SELECT USING (true);
CREATE POLICY "Public read access" ON map_issues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON comments FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON media FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON map_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON comments FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users update own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- ===================================
-- FUNCTIONS FOR AUTO-UPDATE
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_map_issues_updated_at BEFORE UPDATE ON map_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================================
-- SAMPLE DATA (Optional)
-- ===================================
INSERT INTO users (name, email, phone, city, pincode) VALUES
('Samit Fartyal', 'samitfartyal@gmail.com', '9456802538', 'Delhi', '250001');

INSERT INTO reports (title, description, report_type, location, status, contact_name, contact_email) VALUES
('Large Pothole on Main Road', 'Deep pothole causing traffic issues', 'pothole', 'Sector 15, Noida', 'reported', 'Samit Fartyal', 'samitfartyal@gmail.com'),
('Garbage Dump Near Park', 'Uncollected waste for 3 days', 'garbage', 'MG Road, Bangalore', 'progress', 'Samit Fartyal', 'samitfartyal@gmail.com'),
('Broken Street Light', 'Light fixed by municipal team', 'streetlight', 'Andheri, Mumbai', 'resolved', 'Samit Fartyal', 'samitfartyal@gmail.com');

INSERT INTO map_issues (type, title, details, latitude, longitude, status) VALUES
('pothole', 'Large Pothole', 'Deep pothole on highway', 28.6139, 77.2090, 'reported'),
('garbage', 'Garbage Dump', 'Waste accumulation', 28.6129, 77.2295, 'progress'),
('streetlight', 'Broken Light', 'Street light not working', 28.6289, 77.2090, 'resolved');
