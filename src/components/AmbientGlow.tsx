import React, { useEffect, useRef } from 'react';

const AmbientGlow: React.FC = () => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let running = true;
    let animId = 0;

    const tick = () => {
      if (!running) return;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animId); };
  }, []);

  return (
    <div
      ref={elRef}
      className="absolute inset-0 pointer-events-none z-0 animate-aurora-shift"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1), rgba(236,72,153,0.08), rgba(99,102,241,0.12))',
        backgroundSize: '400% 400%',
        borderRadius: 'inherit',
      }}
    />
  );
};

export default AmbientGlow;
