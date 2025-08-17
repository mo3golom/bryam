CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT NOT NULL,
    artist TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);