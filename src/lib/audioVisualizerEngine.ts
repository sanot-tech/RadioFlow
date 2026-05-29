import { logger } from "./logger";

let _isActive = false;
let rafId = 0;
let _realMode = false;
const listeners = new Set<() => void>();

const freqData = new Uint8Array(128);
const waveData = new Uint8Array(128);

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let connectedAudioEl: HTMLAudioElement | null = null;
const analyserFreq = new Uint8Array(128);
const analyserWave = new Uint8Array(128);

let phase = 0;

function isSameOrigin(url: string): boolean {
  try {
    const target = new URL(url);
    return target.origin === window.location.origin;
  } catch {
    return false;
  }
}

function updateLoop() {
  if (!_isActive) return;

  if (_realMode && analyserNode) {
    analyserNode.getByteFrequencyData(analyserFreq);
    analyserNode.getByteTimeDomainData(analyserWave);
    for (let i = 0; i < 128; i++) {
      freqData[i] = analyserFreq[i];
      waveData[i] = analyserWave[i];
    }
  } else {
    phase += 0.05;
    for (let i = 0; i < 128; i++) {
      const t = Date.now() / 1000;
      const noise = Math.sin(i * 0.3 + t * 2) * 0.5 + 0.5;
      const harmonics = Math.sin(i * 0.1 + t * 3.7) * 0.3;
      const bass = i < 10 ? Math.sin(t * 1.2) * 0.3 + 0.3 : 0;
      freqData[i] = Math.min(255, Math.max(0, Math.floor((noise + harmonics + bass) * 255)));
      const wave = Math.sin(i / 128 * Math.PI * 2 + phase) * 64 + 128;
      waveData[i] = Math.min(255, Math.max(0, Math.floor(wave)));
    }
  }

  if (Math.floor(performance.now() / 1000) % 5 === 0) {
    logger.debug({ bassLevel: audioEngine.bassLevel, midLevel: audioEngine.midLevel, highLevel: audioEngine.highLevel, realMode: _realMode }, "audio engine tick");
  }

  listeners.forEach(fn => fn());
  rafId = requestAnimationFrame(updateLoop);
}

function ensureAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export const audioEngine = {
  connect(el: HTMLAudioElement): void {
    const src = el.src || el.currentSrc || '';
    connectedAudioEl = el;

    if (!src || !isSameOrigin(src)) {
      _realMode = false;
      logger.info({ src, sameOrigin: false }, "audio engine: synthetic mode (CORS or external)");
      return;
    }

    // If already connected to the same element, just refresh analyser if needed
    if (sourceNode && connectedAudioEl === el) {
      if (!analyserNode) {
        try {
          const ctx = ensureAudioContext();
          analyserNode = ctx.createAnalyser();
          analyserNode.fftSize = 256;
          sourceNode.connect(analyserNode);
          analyserNode.connect(ctx.destination);
        } catch (err) {
          logger.error({ err }, "audio engine: failed to re-connect analyser");
        }
      }
      _realMode = true;
      return;
    }

    // Clean up previous connection
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (analyserNode) {
      analyserNode.disconnect();
      analyserNode = null;
    }

    try {
      const ctx = ensureAudioContext();
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      sourceNode = ctx.createMediaElementSource(el);
      sourceNode.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      _realMode = true;
      logger.info({ src, sameOrigin: true }, "audio engine: real mode with AnalyserNode");
    } catch (err) {
      _realMode = false;
      logger.error({ err }, "audio engine: failed to connect AnalyserNode, fallback to synthetic");
    }
  },

  resetSource(): void {
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (analyserNode) {
      analyserNode.disconnect();
      analyserNode = null;
    }
    connectedAudioEl = null;
    _realMode = false;
  },

  disconnect(): void {
    cancelAnimationFrame(rafId);
    _isActive = false;
    this.resetSource();
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  },

  resume(): void {
    if (!_isActive) {
      _isActive = true;
      rafId = requestAnimationFrame(updateLoop);
    }
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  get frequencyData(): Uint8Array { return freqData; },
  get waveformData(): Uint8Array { return waveData; },
  get isActive(): boolean { return _isActive; },

  get bassLevel(): number {
    const sum = freqData[0] + freqData[1] + freqData[2] + freqData[3];
    return sum / 4 / 255;
  },

  get midLevel(): number {
    let sum = 0;
    for (let i = 4; i < 16; i++) sum += freqData[i];
    return sum / 12 / 255;
  },

  get highLevel(): number {
    let sum = 0;
    for (let i = 16; i < 32; i++) sum += freqData[i];
    return sum / 16 / 255;
  },
};
