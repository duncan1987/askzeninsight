export interface SeriesMeta {
  key: string
  /** Series tag used as the pre-migration fallback grouping key */
  tag: string
  names: { en: string; zh: string }
  descriptions: { en: string; zh: string }
}

/**
 * Registry of published blog series (专题).
 * Add an entry here when starting a new series, and keep the series
 * columns (supabase/migrations/20261108_blog_series.sql) in sync.
 */
export const SERIES_META: Record<string, SeriesMeta> = {
  'the-truth-of-zen': {
    key: 'the-truth-of-zen',
    tag: 'The Truth of Zen',
    names: { en: 'The Truth of Zen', zh: '禅的真相' },
    descriptions: {
      en: 'What is Zen, really? A multi-part series on the true meaning of Zen practice — seeing into one\'s own nature as the sole gate to awakening and liberation.',
      zh: '禅到底是什么？本系列层层展开禅法的真实义理——以明心见性为唯一法门，以见性为觉悟与解脱之门。',
    },
  },
}

export function getSeriesMeta(seriesKey: string): SeriesMeta | null {
  return SERIES_META[seriesKey] || null
}

/**
 * Resolve the series key for a post that may predate the series columns.
 * Falls back to matching the known series tags carried on the post.
 */
export function resolveSeriesKey(series: string | null | undefined, tags: string[]): string | null {
  if (series) return series
  for (const meta of Object.values(SERIES_META)) {
    if (tags.includes(meta.tag)) return meta.key
  }
  return null
}

/** Derive the 1-based part number from a slug like `the-truth-of-zen-part-12`. */
export function parseSeriesPartFromSlug(slug: string): number | null {
  const match = slug.match(/part-(\d{1,4})(?:$|-)/)
  return match ? parseInt(match[1], 10) : null
}
