'use client';

import React from 'react';
import PWARegister from '@/components/pwa-register';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#6B21A8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Heai Açaí e Sorvetes - Admin"
  },
  icons: [
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/icon-192x192.png" },
    { rel: "mask-icon", url: "/icons/icon-192x192.png", color: "#6B21A8" }
  ]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PWARegister />
    </>
  );
} 