import { useRef, useCallback, useEffect, useState } from 'react';
import { audioEngine } from '@/lib/audioVisualizerEngine';

interface AudioAnalyzerState {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  bassLevel: number;
  midLevel: number;
  highLevel: number;
  isActive: boolean;
}

export function useAudioAnalyzer(): AudioAnalyzerState {
  const startedRef = useRef(false);

  const computeState = useCallback((): AudioAnalyzerState => ({
    frequencyData: new Uint8Array(audioEngine.frequencyData),
    waveformData: new Uint8Array(audioEngine.waveformData),
    bassLevel: audioEngine.bassLevel,
    midLevel: audioEngine.midLevel,
    highLevel: audioEngine.highLevel,
    isActive: audioEngine.isActive,
  }), []);

  const [state, setState] = useState<AudioAnalyzerState>(computeState);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      audioEngine.resume();
    }

    const unsub = audioEngine.subscribe(() => {
      setState(computeState());
    });

    return () => {
      unsub();
    };
  }, [computeState]);

  return state;
}
