import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#6B21A8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Loja Virtual - Admin"
  },
  icons: [
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/icon-192x192.png" },
    { rel: "mask-icon", url: "/icons/icon-192x192.png", color: "#6B21A8" }
  ]
};
