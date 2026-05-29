import { useEffect, useRef, useState } from 'react';

export function useFpsMonitor(enabled = false) {
  const [fps, setFps] = useState(0);
  const [minFps, setMinFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const minFpsRef = useRef(60);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setFps(0);
      return;
    }

    let running = true;
    const tick = (now: number) => {
      if (!running) return;
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        if (currentFps < minFpsRef.current) {
          minFpsRef.current = currentFps;
          setMinFps(currentFps);
        }
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [enabled]);

  return { fps, minFps };
}
