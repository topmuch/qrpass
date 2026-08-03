import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/agence/',
          '/api/',
          '/checklist/',
          '/reset-password/',
          '/verify-email/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/agence/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://passhajj.com/sitemap.xml',
    host: 'https://passhajj.com',
  };
}
