import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  manifest: "/manifest.json",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6B21A8"
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
