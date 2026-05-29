const https = require('https');
const http = require('http');
const { URL } = require('url');

const SHAZAM_API = 'https://amp.shazam.com/discovery/v5/en/US/android/-/recognize';
const SHAZAM_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';
const CAPTURE_DURATION_MS = 10000;
const CAPTURE_TIMEOUT_MS = 15000;

function parseIcyStreamTitle(title) {
  if (!title) return { track: null, artist: null };
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    return { track: parts.slice(1).join(' - ').trim(), artist: parts[0].trim() };
  }
  return { track: title.trim(), artist: null };
}

async function recognizeIcy(streamUrl) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(streamUrl); }
    catch { resolve({ track: null, artist: null, method: 'invalid-url' }); return; }
    const mod = parsed.protocol === 'https:' ? https : http;

    const req = mod.get(streamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadioFlow/1.0)', 'Icy-MetaData': '1', 'Accept': '*/*' },
      timeout: 5000,
    }, (res) => {
      const icyMetaint = parseInt(res.headers['icy-metaint'], 10);
      if (!icyMetaint) { res.destroy(); resolve({ track: null, artist: null, method: 'no-icy' }); return; }

      let chunkBuffer = Buffer.alloc(0);

      const onData = (chunk) => {
        chunkBuffer = Buffer.concat([chunkBuffer, chunk]);
        while (chunkBuffer.length >= icyMetaint) {
          chunkBuffer = chunkBuffer.subarray(icyMetaint);
          if (chunkBuffer.length < 1) return;
          const metaLen = chunkBuffer[0] * 16;
          chunkBuffer = chunkBuffer.subarray(1);
          if (metaLen > 0 && chunkBuffer.length >= metaLen) {
            const metaBlock = chunkBuffer.subarray(0, metaLen).toString('utf-8').replace(/\0+$/, '');
            chunkBuffer = chunkBuffer.subarray(metaLen);
            const match = metaBlock.match(/StreamTitle=['"]([^'"]+)['"]/);
            if (match) {
              const parsed = parseIcyStreamTitle(match[1]);
              res.destroy();
              resolve({ track: parsed.track, artist: parsed.artist, method: 'icy' });
              return;
            }
          }
        }
      };
      res.on('data', onData);
      res.on('error', () => resolve({ track: null, artist: null, method: 'error' }));
      res.on('end', () => resolve({ track: null, artist: null, method: 'no-data' }));
    });
    req.on('error', () => resolve({ track: null, artist: null, method: 'error' }));
    req.on('timeout', () => { req.destroy(); resolve({ track: null, artist: null, method: 'timeout' }); });
  });
}

function captureAudio(streamUrl, durationMs = CAPTURE_DURATION_MS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(streamUrl); }
    catch { reject(new Error('Invalid URL')); return; }
    const mod = parsed.protocol === 'https:' ? https : http;

    const chunks = [];
    let totalBytes = 0;
    const maxBytes = Math.ceil((durationMs / 1000) * 192 * 1024 / 8); // ~288KB for 12s at 192kbps

    const req = mod.get(streamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadioFlow/1.0)', 'Accept': '*/*', 'Icy-MetaData': '0' },
      timeout: CAPTURE_TIMEOUT_MS,
    }, (res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
        if (totalBytes >= maxBytes) {
          res.destroy();
          resolve(Buffer.concat(chunks));
        }
      });
      res.on('end', () => {
        if (chunks.length > 0) resolve(Buffer.concat(chunks));
        else reject(new Error('No data received'));
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      if (chunks.length > 0) resolve(Buffer.concat(chunks));
      else reject(new Error('Timeout'));
    });
  });
}

function recognizeWithShazam(audioData) {
  return new Promise((resolve, reject) => {
    const boundary = `----RadioFlow${Math.random().toString(36).slice(2, 10)}`;
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="sample"; filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), audioData, Buffer.from(footer)]);

    const url = new URL(SHAZAM_API);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': SHAZAM_USER_AGENT,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.track) {
            resolve({
              track: json.track.title || null,
              artist: json.track.subtitle || null,
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function recognizeTrack(streamUrl) {
  // Step 1: Fast path — ICY metadata
  const icyResult = await recognizeIcy(streamUrl);
  if (icyResult.track) {
    return icyResult;
  }

  // Step 2: Fallback — Shazam audio recognition
  try {
    const audioData = await captureAudio(streamUrl);
    const shazamResult = await recognizeWithShazam(audioData);
    if (shazamResult && shazamResult.track) {
      return { track: shazamResult.track, artist: shazamResult.artist, method: 'shazam' };
    }
    return { track: null, artist: null, method: 'no-match' };
  } catch (err) {
    return { track: null, artist: null, method: 'shazam-error', error: err.message };
  }
}

module.exports = { recognizeTrack };
