import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /*
   * Limite les workers de génération statique à 2.
   * Défaut Next = nb de CPU - 1 (7 workers sur le VPS Coolify 8 cœurs) :
   * chaque worker est un process Node séparé qui charge le bundle complet
   * → pic mémoire instantané → OOM killer SIGKILL sans aucun message
   * (« Generating static pages (0/155) » puis mort silencieuse).
   */
  experimental: {
    cpus: 2,
  },
  /* config options here */
  serverExternalPackages: ['nodemailer', 'pdf-lib', 'qrcode', 'archiver'],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    formats: ['image/webp'],
    qualities: [75, 90],
  },
};

export default nextConfig;
