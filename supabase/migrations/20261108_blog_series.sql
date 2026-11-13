-- Blog series (专题) support.
-- Backs multi-part series such as "The Truth of Zen" (禅的真相, 105 parts).
-- Until this migration is applied, the series pages fall back to
-- tag-based grouping + part numbers parsed from slugs (see lib/blog-db.ts),
-- so shipping code before running this SQL is safe.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS series_part INT;

CREATE INDEX IF NOT EXISTS idx_blog_posts_series
  ON blog_posts(series, series_part)
  WHERE is_published = true;

COMMENT ON COLUMN blog_posts.series IS 'Series key, e.g. the-truth-of-zen. NULL for standalone posts.';
COMMENT ON COLUMN blog_posts.series_part IS '1-based part number within the series. NULL for standalone posts.';

-- Backfill: the first post of "The Truth of Zen" series.
UPDATE blog_posts
SET series = 'the-truth-of-zen', series_part = 1
WHERE slug = 'the-truth-of-zen-part-1';
