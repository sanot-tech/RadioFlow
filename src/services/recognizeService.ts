export interface RecognizeResult {
  track: string | null;
  artist?: string | null;
  method: string;
}

export async function recognizeTrack(streamUrl: string): Promise<RecognizeResult> {
  try {
    const encoded = encodeURIComponent(streamUrl);
    const res = await fetch(`/api/recognize?url=${encoded}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return { track: null, method: 'error' };
    return await res.json();
  } catch {
    return { track: null, method: 'error' };
  }
}

export async function recognizeTrackFromAudio(audioBlob: Blob): Promise<RecognizeResult> {
  try {
    const res = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': audioBlob.type || 'application/octet-stream' },
      body: audioBlob,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { track: null, method: 'error' };
    return await res.json();
  } catch {
    return { track: null, method: 'error' };
  }
}

export async function captureAudioFromElement(
  audioEl: HTMLAudioElement,
  durationMs = 10000
): Promise<Blob | null> {
  try {
    if (!audioEl.captureStream) {
      console.warn('captureStream not supported');
      return null;
    }
    const stream = audioEl.captureStream();
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return null;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start();
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => { recorder.stop(); resolve(); }, durationMs);
      recorder.onstop = () => { clearTimeout(timeout); resolve(); };
    });
    if (chunks.length === 0) return null;
    return new Blob(chunks, { type: 'audio/webm' });
  } catch (err) {
    console.warn('Audio capture failed:', err);
    return null;
  }
}
