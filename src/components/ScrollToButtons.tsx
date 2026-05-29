import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ScrollToButtonsProps {
  scrollContainerRef: React.RefObject<HTMLElement>;
  playerCardRef?: React.RefObject<HTMLElement>;
}

const FRAME_SCROLL_RATIO = 0.85;
const DOUBLE_CLICK_DELAY = 350;

const LEDBarButton: React.FC<{
  direction: 'up' | 'down';
  onClick: () => void;
  onDoubleClick: () => void;
}> = ({ direction, onClick, onDoubleClick }) => {
  const [auraGlow, setAuraGlow] = useState(false);
  const lastClickRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const isUp = direction === 'up';

  const handleClick = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAuraGlow(true);
    const now = Date.now();
    if (now - lastClickRef.current < DOUBLE_CLICK_DELAY) {
      onDoubleClick();
      timers.current.push(setTimeout(() => setAuraGlow(false), 400));
    } else {
      onClick();
      timers.current.push(setTimeout(() => setAuraGlow(false), 700));
    }
    lastClickRef.current = now;
  };

  return (
    <button
      onClick={handleClick}
      className={`h-14 w-9 rounded-xl shadow-lg border border-white/10 bg-card/80 backdrop-blur-md hover:bg-card hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-[4px] focus:outline-none ${isUp ? 'led-up' : 'led-down'} ${auraGlow ? (isUp ? 'aura-up' : 'aura-down') : ''}`}
      aria-label={isUp ? 'Scroll up (double-click for top)' : 'Scroll down (double-click for bottom)'}
    >
      <div className="bar" />
      <div className="bar" />
      <div className="bar" />
    </button>
  );
};

const ScrollToButtons: React.FC<ScrollToButtonsProps> = ({ scrollContainerRef }) => {
  const lastFrameDir = useRef<'up' | 'down'>('down');

  const animateScroll = useCallback((targetPosition: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const clamped = Math.max(0, Math.min(targetPosition, maxScroll));
    container.scrollTo({ top: clamped, behavior: 'smooth' });
  }, [scrollContainerRef]);

  const scrollByFrame = useCallback((direction: 'up' | 'down') => {
    const c = scrollContainerRef.current;
    if (!c) return;
    lastFrameDir.current = direction;
    const frame = c.clientHeight * FRAME_SCROLL_RATIO;
    const max = Math.max(0, c.scrollHeight - c.clientHeight);
    const target = direction === 'down'
      ? Math.min(c.scrollTop + frame, max)
      : Math.max(c.scrollTop - frame, 0);
    animateScroll(target);
  }, [scrollContainerRef, animateScroll]);

  const scrollToTop = useCallback(() => animateScroll(0), [animateScroll]);

  const scrollToBottom = useCallback(() => {
    const c = scrollContainerRef.current;
    if (c) animateScroll(c.scrollHeight - c.clientHeight);
  }, [scrollContainerRef, animateScroll]);

  const handleUpClick = useCallback(() => scrollByFrame('up'), [scrollByFrame]);
  const handleDownClick = useCallback(() => scrollByFrame('down'), [scrollByFrame]);

  return (
    <>
      <style>{`
        .bar {
          height: 3px;
          width: 20px;
          border-radius: 999px;
          background-color: currentColor;
        }

        .led-up { color: #F59E0B; }
        .led-down { color: #06B6D4; }

        @keyframes ledPulseUp {
          0%, 100% { opacity: 0.1; box-shadow: none; }
          10%, 32% { opacity: 1; box-shadow: 0 0 6px rgba(245,158,11,0.5), 0 0 14px rgba(245,158,11,0.2); }
        }
        @keyframes ledPulseDown {
          0%, 100% { opacity: 0.1; box-shadow: none; }
          10%, 32% { opacity: 1; box-shadow: 0 0 6px rgba(6,182,212,0.5), 0 0 14px rgba(6,182,212,0.2); }
        }

        .led-up .bar:nth-child(1) { animation: ledPulseUp 1.5s ease-in-out infinite; animation-delay: 0.6s; }
        .led-up .bar:nth-child(2) { animation: ledPulseUp 1.5s ease-in-out infinite; animation-delay: 0.3s; }
        .led-up .bar:nth-child(3) { animation: ledPulseUp 1.5s ease-in-out infinite; animation-delay: 0s; }

        .led-down .bar:nth-child(1) { animation: ledPulseDown 1.5s ease-in-out infinite; animation-delay: 0s; }
        .led-down .bar:nth-child(2) { animation: ledPulseDown 1.5s ease-in-out infinite; animation-delay: 0.3s; }
        .led-down .bar:nth-child(3) { animation: ledPulseDown 1.5s ease-in-out infinite; animation-delay: 0.6s; }

        .aura-up {
          box-shadow: 0 0 24px rgba(245,158,11,0.6), 0 0 50px rgba(245,158,11,0.25), 0 0 80px rgba(245,158,11,0.1) !important;
          border-color: rgba(245,158,11,0.4) !important;
        }
        .aura-down {
          box-shadow: 0 0 24px rgba(6,182,212,0.6), 0 0 50px rgba(6,182,212,0.25), 0 0 80px rgba(6,182,212,0.1) !important;
          border-color: rgba(6,182,212,0.4) !important;
        }
      `}</style>
      <div className="fixed right-3 z-[100] flex flex-col gap-2 items-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <LEDBarButton direction="up" onClick={handleUpClick} onDoubleClick={scrollToTop} />
        <LEDBarButton direction="down" onClick={handleDownClick} onDoubleClick={scrollToBottom} />
      </div>
    </>
  );
};

export default ScrollToButtons;
