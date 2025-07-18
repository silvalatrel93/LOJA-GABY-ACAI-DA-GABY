import type { Metadata } from 'next';

export const homeMetadata: Metadata = {
  title: 'Loja Virtual - Deliciosos produtos para você',
  description: 'Experimente nossos deliciosos açaís, sorvetes e muito mais. Faça seu pedido online e receba em casa!',
      keywords: ['açaí', 'sorvete', 'delivery', 'sobremesa', 'loja virtual'],
  openGraph: {
    title: 'Loja Virtual',
    description: 'Deliciosos açaís, sorvetes e muito mais! Peça agora e receba em casa.',
    url: 'https://heai-acai.vercel.app',
    siteName: 'Loja Virtual',
    images: [
      {
        url: 'https://i.postimg.cc/9QjPdk40/logo-heai.webp',
        width: 800,
        height: 600,
        alt: 'Loja Virtual',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loja Virtual',
    description: 'Deliciosos açaís, sorvetes e muito mais! Peça agora e receba em casa.',
    images: ['https://i.postimg.cc/9QjPdk40/logo-heai.webp'],
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
