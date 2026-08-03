import type { MetadataRoute } from 'next';

const BASE_URL = 'https://passhajj.com';

// All public pages to index
const PAGES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/a-propos', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/devenir-partenaire', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/confidentialite', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/cgu', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/select', priority: 0.9, changeFrequency: 'daily' as const },
  { url: '/inscrire', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/forgot-password', priority: 0.5, changeFrequency: 'yearly' as const },
  { url: '/hajj-omra', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/fonctionnalites/securite-rgpd', priority: 0.6, changeFrequency: 'monthly' as const },
  { url: '/fonctionnalites/sans-application', priority: 0.6, changeFrequency: 'monthly' as const },
  { url: '/voyageurs-standard', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/demo', priority: 0.6, changeFrequency: 'monthly' as const },
];

// Francophone country codes for hreflang
const FRANCOPHONE_LANGS = [
  'fr', 'fr-sn', 'fr-ml', 'fr-ma', 'fr-dz', 'fr-tn', 'fr-gn', 'fr-ci',
  'fr-cm', 'fr-bf', 'fr-ne', 'fr-td', 'fr-cd', 'fr-cg', 'fr-bj',
  'fr-tg', 'fr-ga', 'fr-mr', 'fr-km', 'fr-dj', 'fr-rw', 'fr-bi',
  'fr-ht', 'fr-fr', 'fr-be', 'fr-ch', 'fr-ca', 'fr-lu', 'fr-mc',
  'en', 'ar', 'x-default',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    const fullUrl = `${BASE_URL}${page.url}`;

    // Main entry (French default)
    entries.push({
      url: fullUrl,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  return entries;
}
