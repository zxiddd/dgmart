import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '32px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-4px',
          }}
        >
          🛵
        </div>
      </div>
    ),
    { ...size }
  );
}
