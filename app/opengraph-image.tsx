import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'Heai Açaí e Sorvetes';
export const size = {
  width: 1200,
  height: 630,
};
 
export const contentType = 'image/png';
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to right, #6B21A8, #9333EA)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <img
          src="https://i.postimg.cc/9QjPdk40/logo-heai.webp"
          alt="Heai Açaí e Sorvetes"
          width={200}
          height={200}
          style={{
            borderRadius: '50%',
            marginBottom: 24,
          }}
        />
        <h1 style={{ margin: 0, marginBottom: 16 }}>Heai Açaí e Sorvetes</h1>
        <p style={{ fontSize: 24, margin: 0, opacity: 0.8 }}>
          Deliciosos açaís, sorvetes e muito mais!
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
