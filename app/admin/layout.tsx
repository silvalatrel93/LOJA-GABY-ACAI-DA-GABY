'use client';

import React from 'react';
import PWARegister from '@/components/pwa-register';

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