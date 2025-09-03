-- COMBINED MIGRATION FILE FOR DOGOODS SUPABASE
-- This file merges all schema, table, enum, trigger, and RLS changes for a complete setup.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE account_type AS ENUM ('individual', 'business', 'nonprofit');
CREATE TYPE listing_type AS ENUM ('donation');
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'declined', 'active', 'completed', 'expired', 'cancelled');
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');
CREATE TYPE food_category AS ENUM ('produce', 'bakery', 'dairy', 'pantry', 'meat', 'prepared', 'other');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'declined');

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    organization VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    account_type account_type DEFAULT 'individual',
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOOD LISTINGS
CREATE TABLE food_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category food_category NOT NULL,
    listing_type listing_type NOT NULL,
    status listing_status DEFAULT 'pending',
    expiry_date DATE,
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOOD CLAIMS
CREATE TABLE food_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    claimer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255),
    requester_phone VARCHAR(20),
    school_district VARCHAR(100),
    school VARCHAR(100),
    school_contact VARCHAR(100),
    school_contact_email VARCHAR(100),
    school_contact_phone VARCHAR(20),
    category VARCHAR(50),
    dietary_restrictions VARCHAR(200),
    members_count INTEGER,
    pickup_time TIME,
    pickup_place VARCHAR(100),
    pickup_contact VARCHAR(100),
    dropoff_time TIME,
    dropoff_place VARCHAR(100),
    dropoff_contact VARCHAR(100),
    status claim_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMUNITY POSTS
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER STATS
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_donations INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    total_food_saved DECIMAL(10,2) DEFAULT 0,
    total_impact_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER BADGES
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(50),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOOD DISTRIBUTION EVENTS
CREATE TABLE distribution_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE distribution_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES distribution_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

-- TRADES
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offered_listing_id UUID REFERENCES food_listings(id) ON DELETE SET NULL,
    requested_listing_id UUID REFERENCES food_listings(id) ON DELETE SET NULL,
    status trade_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_food_listings_user_id ON food_listings(user_id);
CREATE INDEX idx_food_listings_status ON food_listings(status);
CREATE INDEX idx_food_listings_category ON food_listings(category);
CREATE INDEX idx_food_listings_location ON food_listings(location);
CREATE INDEX idx_trades_initiator_id ON trades(initiator_id);
CREATE INDEX idx_trades_recipient_id ON trades(recipient_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_comments_post ON community_comments(post_id);

-- TRIGGERS & FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_listings_updated_at BEFORE UPDATE ON food_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distribution_events_updated_at BEFORE UPDATE ON distribution_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_community_posts_updated_at();

-- NOTIFY ON DECLINED FOOD SUBMISSION
CREATE OR REPLACE FUNCTION notify_declined_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'declined' AND OLD.status <> 'declined' THEN
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
            NEW.user_id,
            'Food Submission Not Approved',
            'Your food submission was not approved by the admin. Please review the guidelines and try again.',
            'submission_declined',
            jsonb_build_object('listing_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_notify_declined_submission ON food_listings;
CREATE TRIGGER trigger_notify_declined_submission AFTER UPDATE ON food_listings FOR EACH ROW EXECUTE FUNCTION notify_declined_submission();

-- NOTIFY ON CLAIM STATUS CHANGE
CREATE OR REPLACE FUNCTION notify_claim_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
            NEW.claimer_id,
            'Food Claim Approved',
            'Your claim for food has been approved! Please check your email for pickup details.',
            'claim_approved',
            jsonb_build_object('claim_id', NEW.id, 'food_id', NEW.food_id)
        );
    ELSIF NEW.status = 'declined' AND OLD.status <> 'declined' THEN
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
            NEW.claimer_id,
            'Food Claim Not Approved',
            'Your claim for food was not approved. Please try again or contact support for more info.',
            'claim_declined',
            jsonb_build_object('claim_id', NEW.id, 'food_id', NEW.food_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_notify_claim_status_change ON food_claims;
CREATE TRIGGER trigger_notify_claim_status_change AFTER UPDATE ON food_claims FOR EACH ROW EXECUTE FUNCTION notify_claim_status_change();

-- RLS POLICIES (add more as needed)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_claims ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for food_listings
CREATE POLICY "Anyone can view approved listings" ON food_listings FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own listings" ON food_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON food_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON food_listings FOR UPDATE USING (auth.uid() = user_id);

-- Example RLS policy for food_claims
CREATE POLICY "Users can view own claims" ON food_claims FOR SELECT USING (auth.uid() = claimer_id);
CREATE POLICY "Users can create claims" ON food_claims FOR INSERT WITH CHECK (auth.uid() = claimer_id);
CREATE POLICY "Admins can review claims" ON food_claims FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Add more policies as needed for other tables
