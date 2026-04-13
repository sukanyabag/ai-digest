-- =============================================================
-- AI-Digest Blog — Supabase Schema
-- Idempotent: safe to run multiple times.
-- Run once via: npm run setup-db
-- =============================================================

-- ---------------------------------------------------------------
-- blog_posts table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  slug           TEXT        NOT NULL UNIQUE,
  description    TEXT,
  content        TEXT        NOT NULL DEFAULT '',
  category       TEXT,
  author         TEXT,
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  cover_image    TEXT,
  status         TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'published')),
  reading_time   INTEGER,
  published_date TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts (public blog)
DROP POLICY IF EXISTS "Public read published posts" ON blog_posts;
CREATE POLICY "Public read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Authenticated users (admin) have full access
DROP POLICY IF EXISTS "Admin full access" ON blog_posts;
CREATE POLICY "Admin full access" ON blog_posts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- Storage bucket: blog-images
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read images (cover photos on the public blog)
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Only authenticated users (admin) can upload images
DROP POLICY IF EXISTS "Admin upload blog images" ON storage.objects;
CREATE POLICY "Admin upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- Only authenticated users (admin) can delete images
DROP POLICY IF EXISTS "Admin delete blog images" ON storage.objects;
CREATE POLICY "Admin delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

-- ---------------------------------------------------------------
-- post_comments — threaded comments per blog post
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug   TEXT        NOT NULL,
  parent_id   UUID        REFERENCES post_comments(id) ON DELETE CASCADE,
  author_name TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_comments_slug_idx   ON post_comments (post_slug);
CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON post_comments (parent_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON post_comments;
CREATE POLICY "Public read comments" ON post_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert comments" ON post_comments;
CREATE POLICY "Public insert comments" ON post_comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete comments" ON post_comments;
CREATE POLICY "Admin delete comments" ON post_comments
  FOR DELETE USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- post_reactions — per-post emoji reactions (anonymous, fingerprinted)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug   TEXT        NOT NULL,
  reaction    TEXT        NOT NULL
                            CHECK (reaction IN ('like', 'heart', 'fire', 'mind_blown')),
  fingerprint TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_slug, reaction, fingerprint)
);

CREATE INDEX IF NOT EXISTS post_reactions_slug_idx ON post_reactions (post_slug);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reactions" ON post_reactions;
CREATE POLICY "Public read reactions" ON post_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert reactions" ON post_reactions;
CREATE POLICY "Public insert reactions" ON post_reactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete reactions" ON post_reactions;
CREATE POLICY "Public delete reactions" ON post_reactions
  FOR DELETE USING (true);
