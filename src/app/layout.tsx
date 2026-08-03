import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/pwa-registration";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PassHajj – Protection bagages & pèlerins Hajj Omrah | QR Code sécurisé",
    template: "%s | PassHajj – Hajj & Omrah",
  },
  description: "PassHajj protège vos bagages et votre identité pendant le Hajj et l'Omrah. Étiquette QR code pour valises, bracelet d'urgence pour pèlerins à la Mecque et Médine. Sans application, sans batterie. Utilisé dans 45+ pays : Sénégal, Mali, Maroc, Algérie, Tunisie, Guinée, Côte d'Ivoire, Cameroun, Burkina Faso, Niger, Tchad, RDC, Congo, Bénin, Togo, Gabon, Mauritanie, Comores, Djibouti, Rwanda, Burundi, Haïti, France, Belgique, Suisse, Canada, Luxembourg, Monaco.",
  keywords: [
    // Core brand & product
    "PassHajj", "pass hajj", "passhajj.com",
    // Hajj & Omrah keywords
    "hajj", "haj", "hadj", "omrah", "omra", "umrah", "pélerinage", "pèlerinage",
    "mecque", "la mecque", "makkah", "médine", "medine", "madinah",
    "kaaba", "ka'ba", "tawaf", "sa'i", "mina", "arafat", "muzdalifah",
    "safa", "marwa", "jamarat", "ihram", "talbiya",
    // Product keywords
    "QR code bagage", "étiquette bagage", "étiquette valise", "valise trouvée",
    "bagage perdu", "bagages perdus", "luggage tracker", "qr code valise",
    "bracelet identité", "bracelet urgence", "bracelet pèlerin", "bracelet médical",
    "identification pèlerin", "sécurité pèlerin", "protection bagage",
    "sans application", "sans batterie", "sans GPS",
    // Travel & aviation
    "aéroport", "avion", "vol", "compagnie aérienne", "sécurité voyage",
    "perte bagage aéroport", "bagage égaré", "valise égarée",
    // Francophone countries
    "sénégal", "dakar", "mali", "bamako", "maroc", "rabat", "casablanca",
    "algérie", "alger", "oran", "tunisie", "tunis", "guinée", "conakry",
    "côte d'ivoire", "abidjan", "cameroun", "yaoundé", "douala",
    "burkina faso", "ouagadougou", "niger", "niamey", "tchad", "ndjamena",
    "rdc", "congo", "kinshasa", "brazzaville", "bénin", "cotonou",
    "togo", "lomé", "gabon", "libreville", "mauritanie", "nouakchott",
    "comores", "djibouti", "rwanda", "kigali", "burundi", "bujumbura",
    "haïti", "port-au-prince", "france", "paris", "belgique", "bruxelles",
    "suisse", "genève", "canada", "montréal", "québec", "luxembourg",
    "monaco", "afrique", "maghreb", "francophonie", "pays francophone",
    // Agency & partnership
    "agence de voyage", "agence hajj", "agence omrah", "partenaire agence",
    "voyage organisé", "tour operator hajj",
    // General
    "qr code", "sécurité", "protection", "identité", "urgence médicale",
    "groupe sanguin", "allergie", "personne âgée", "pèlerin perdu",
  ],
  authors: [{ name: "PassHajj Team" }, { name: "MMASOLUTION" }],
  creator: "MMASOLUTION",
  publisher: "PassHajj",
  metadataBase: new URL("https://passhajj.com"),

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#ffffff" },
    ],
  },

  // Open Graph — rich social sharing
  openGraph: {
    title: "PassHajj – Protection bagages & pèlerins pour le Hajj et l'Omrah",
    description: "Étiquette QR code pour valises et bracelet d'urgence pour pèlerins à la Mecque. Protégez vos bagages et vos proches pendant le Hajj & Omrah. Sans application. Sans batterie. 850+ agences dans 45 pays.",
    url: "https://passhajj.com",
    siteName: "PassHajj",
    type: "website",
    locale: "fr_FR",
    alternateLocale: [
      "fr_SN", "fr_ML", "fr_MA", "fr_DZ", "fr_TN", "fr_GN", "fr_CI",
      "fr_CM", "fr_BF", "fr_NE", "fr_TD", "fr_CD", "fr_CG", "fr_BJ",
      "fr_TG", "fr_GA", "fr_MR", "fr_KM", "fr_DJ", "fr_RW", "fr_BI",
      "fr_HT", "fr_FR", "fr_BE", "fr_CH", "fr_CA", "fr_LU", "fr_MC",
      "en_US", "ar_SA",
    ],
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "PassHajj – Protection bagages & pèlerins Hajj Omrah",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "PassHajj – Protection bagages & pèlerins Hajj Omrah",
    description: "Étiquette QR code pour valises et bracelet d'urgence pour pèlerins. Sans application. Sans batterie. 850+ agences dans 45 pays.",
    images: ["/icons/icon-512x512.png"],
    creator: "@PassHajj",
    site: "@PassHajj",
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "PassHajj",
  appleWebApp: {
    capable: true,
    title: "PassHajj – Hajj & Omrah",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px)" },
    ],
  },

  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Robots — full indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Alternates — canonical + hreflang for francophone countries
  alternates: {
    canonical: "https://passhajj.com",
    languages: {
      "fr": "https://passhajj.com",
      "fr-sn": "https://passhajj.com",
      "fr-ml": "https://passhajj.com",
      "fr-ma": "https://passhajj.com",
      "fr-dz": "https://passhajj.com",
      "fr-tn": "https://passhajj.com",
      "fr-ci": "https://passhajj.com",
      "fr-cm": "https://passhajj.com",
      "fr-bf": "https://passhajj.com",
      "fr-gn": "https://passhajj.com",
      "fr-ht": "https://passhajj.com",
      "fr-fr": "https://passhajj.com",
      "fr-be": "https://passhajj.com",
      "fr-ch": "https://passhajj.com",
      "fr-ca": "https://passhajj.com",
      "en": "https://passhajj.com",
      "ar": "https://passhajj.com",
      "x-default": "https://passhajj.com",
    },
  },

  // Category
  category: "travel",

  // Classification
  classification: "Travel Security, Religious Tourism, Luggage Protection",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme script - runs before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PassHajj" />
        <meta name="application-name" content="PassHajj" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Geo targeting for francophone countries */}
        <meta name="geo.region" content="FR SN ML MA DZ TN GN CI CM BF NE TD CD CG BJ TG GA MR KM DJ RW BI HT BE CH CA LU MC" />
        <meta name="geo.placename" content="France, Sénégal, Mali, Maroc, Algérie, Tunisie, Guinée, Côte d'Ivoire, Cameroun, Burkina Faso, Niger, Tchad, RDC, Congo, Bénin, Togo, Gabon, Mauritanie, Comores, Djibouti, Rwanda, Burundi, Haïti, Belgique, Suisse, Canada, Luxembourg, Monaco" />
        <meta name="geo.position" content="48.8566;2.3522" />
        <meta name="ICBM" content="48.8566, 2.3522" />

        {/* Language targeting */}
        <meta name="language" content="fr" />
        <meta name="coverage" content="France, Sénégal, Mali, Maroc, Algérie, Tunisie, Guinée, Côte d'Ivoire, Cameroun, Burkina Faso, Niger, Tchad, RDC, Congo, Bénin, Togo, Gabon, Mauritanie, Comores, Djibouti, Rwanda, Burundi, Haïti, Belgique, Suisse, Canada, Luxembourg, Monaco" />
        <meta httpEquiv="content-language" content="fr, en, ar" />

        {/* Rating & audience */}
        <meta name="rating" content="general" />
        <meta name="audience" content="all" />
        <meta name="distribution" content="global" />

        {/* Verification placeholder — replace with real values */}
        <meta name="google-site-verification" content="PASSHAJJ_GOOGLE_VERIFICATION" />

        {/* PWA manifest & apple-touch-icon */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "PassHajj",
              "url": "https://passhajj.com",
              "logo": "https://passhajj.com/logo.png",
              "description": "PassHajj protège vos bagages et votre identité pendant le Hajj et l'Omrah. Étiquette QR code pour valises, bracelet d'urgence pour pèlerins.",
              "foundingDate": "2024",
              "founder": {
                "@type": "Organization",
                "name": "MMASOLUTION"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+33-7-45-34-93-39",
                "contactType": "customer service",
                "availableLanguage": ["French", "English", "Arabic"],
                "areaServed": {
                  "@type": "Place",
                  "name": "Francophone countries"
                }
              },
              "sameAs": [
                "https://facebook.com/PassHajj",
                "https://instagram.com/PassHajj",
                "https://twitter.com/PassHajj"
              ],
              "areaServed": [
                { "@type": "Country", "name": "France" },
                { "@type": "Country", "name": "Sénégal" },
                { "@type": "Country", "name": "Mali" },
                { "@type": "Country", "name": "Maroc" },
                { "@type": "Country", "name": "Algérie" },
                { "@type": "Country", "name": "Tunisie" },
                { "@type": "Country", "name": "Guinée" },
                { "@type": "Country", "name": "Côte d'Ivoire" },
                { "@type": "Country", "name": "Cameroun" },
                { "@type": "Country", "name": "Burkina Faso" },
                { "@type": "Country", "name": "Niger" },
                { "@type": "Country", "name": "Tchad" },
                { "@type": "Country", "name": "RD Congo" },
                { "@type": "Country", "name": "Congo" },
                { "@type": "Country", "name": "Bénin" },
                { "@type": "Country", "name": "Togo" },
                { "@type": "Country", "name": "Gabon" },
                { "@type": "Country", "name": "Mauritanie" },
                { "@type": "Country", "name": "Comores" },
                { "@type": "Country", "name": "Djibouti" },
                { "@type": "Country", "name": "Rwanda" },
                { "@type": "Country", "name": "Burundi" },
                { "@type": "Country", "name": "Haïti" },
                { "@type": "Country", "name": "Belgique" },
                { "@type": "Country", "name": "Suisse" },
                { "@type": "Country", "name": "Canada" },
                { "@type": "Country", "name": "Luxembourg" },
                { "@type": "Country", "name": "Monaco" }
              ]
            }),
          }}
        />

        {/* JSON-LD Structured Data — WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PassHajj",
              "url": "https://passhajj.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://passhajj.com/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "inLanguage": ["fr", "en", "ar"]
            }),
          }}
        />

        {/* JSON-LD Structured Data — Product (Pass Bagage) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Pass Bagage – Étiquette QR code pour valises",
              "description": "Étiquette QR code sécurisée pour identifier et retrouver vos bagages pendant le Hajj et l'Omrah. Sans application, sans batterie.",
              "brand": {
                "@type": "Brand",
                "name": "PassHajj"
              },
              "category": "Travel Security",
              "offers": {
                "@type": "Offer",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "2500"
              }
            }),
          }}
        />

        {/* JSON-LD Structured Data — Product (Pass Identity) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Pass Identity – Bracelet d'urgence pour pèlerins",
              "description": "Bracelet d'urgence avec QR code pour l'identification des pèlerins âgés et vulnérables pendant le Hajj et l'Omrah. Infos médicales, contact d'urgence, position GPS.",
              "brand": {
                "@type": "Brand",
                "name": "PassHajj"
              },
              "category": "Personal Safety",
              "offers": {
                "@type": "Offer",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "1800"
              }
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
