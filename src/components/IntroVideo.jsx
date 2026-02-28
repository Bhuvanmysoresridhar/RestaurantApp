import { useRef, useState } from 'react';

export default function IntroVideo({ onFinish }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [fading, setFading] = useState(false);

  function handleFinish() {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      sessionStorage.setItem('sas_intro_seen', 'true');
      onFinish();
    }, 800);
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleFinish}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      <button
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#fff',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

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
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      >
        SKIP INTRO ›
      </button>
    </div>
  );
}
