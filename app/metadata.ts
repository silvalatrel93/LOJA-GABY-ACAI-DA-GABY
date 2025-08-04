import type { Metadata } from 'next';

export const homeMetadata: Metadata = {
  metadataBase: new URL('https://pedi-facil-loja-2.vercel.app'),
  title: 'PediFacil - Sistema de Delivery Completo',
  description: 'Sistema completo de delivery com gestão de pedidos, cardápio digital e painel administrativo. Faça seu pedido online!',
  keywords: ['delivery', 'pedidos', 'restaurante', 'cardápio', 'sistema', 'pedifacil'],
  openGraph: {
    title: 'PediFacil - Sistema de Delivery',
    description: 'Sistema completo de delivery com gestão de pedidos e cardápio digital.',
    url: 'https://pedi-facil-loja-2.vercel.app',
    siteName: 'PediFacil',
    images: [
      {
        url: '/icons/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'PediFacil - Sistema de Delivery',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PediFacil - Sistema de Delivery',
    description: 'Sistema completo de delivery com gestão de pedidos e cardápio digital.',
    images: ['/icons/web-app-manifest-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://heai-acai.vercel.app',
  },
};
