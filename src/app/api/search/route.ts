import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source, {
  localeMap: {
    // Korean stemmer not available in Orama; 'english' is the closest fallback.
    // Korean search quality may be limited for morphological analysis.
    ko: 'english',
  },
});
