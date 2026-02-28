import { useState, useEffect } from 'react';

const DRIVE_FILE_ID = '1VHqWFMq8gZIVLz3zlGqLr4qg9otXDjO2';
const EMBED_URL = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`;

export default function IntroVideo({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  function handleFinish() {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('sas_intro_seen', 'true');
      onFinish();
    }, 800);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}
    >
      <iframe
        src={EMBED_URL}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          display: 'block',
        }}
        title="Stones & Spices Introduction"
      />

      <button
        onClick={handleFinish}
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: '24px',
          fontSize: '14px',
          letterSpacing: '1px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
      >
        SKIP INTRO ›
      </button>
    </div>
  );
}
