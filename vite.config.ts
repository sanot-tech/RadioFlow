import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import http from 'http';
import https from 'https';
import { URL } from 'url';
import type { Connect } from 'vite';
import Parser from 'rss-parser';

const SHAZAM_API = 'https://amp.shazam.com/discovery/v5/en/US/android/-/recognize';
const SHAZAM_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

function parseIcyStreamTitle(title: string): { track: string | null; artist: string | null } {
  if (!title) return { track: null, artist: null };
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    return { track: parts.slice(1).join(' - ').trim(), artist: parts[0].trim() };
  }
  return { track: title.trim(), artist: null };
}

function recognizeIcy(streamUrl: string): Promise<{ track: string | null; artist: string | null; method: string }> {
  return new Promise((resolve) => {
    let parsed: URL;
    try { parsed = new URL(streamUrl); }
    catch { resolve({ track: null, artist: null, method: 'invalid-url' }); return; }
    const mod = parsed.protocol === 'https:' ? https : http;

    const req = mod.get(streamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadioFlow/1.0)', 'Icy-MetaData': '1', 'Accept': '*/*' },
      timeout: 10000,

  }, (res) => {
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
        if (totalBytes >= maxBytes) { res.destroy(); resolve(Buffer.concat(chunks)); }
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

function recognizeShazam(audioData: Buffer): Promise<{ track: string | null; artist: string | null } | null> {
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
          if (json.track) resolve({ track: json.track.title || null, artist: json.track.subtitle || null });
          else resolve(null);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function recognizeTrack(streamUrl: string): Promise<{ track: string | null; artist: string | null; method: string; error?: string }> {
  // Fast path: ICY metadata
  const icyResult = await recognizeIcy(streamUrl);
  if (icyResult.track) return icyResult;

  // Fallback: Shazam audio recognition
  try {
    const audioData = await captureAudio(streamUrl);
    const shazamResult = await recognizeShazam(audioData);
    if (shazamResult && shazamResult.track) {
      return { track: shazamResult.track, artist: shazamResult.artist, method: 'shazam' };
    }
    return { track: null, artist: null, method: 'no-match' };
  } catch (err: any) {
    return { track: null, artist: null, method: 'shazam-error', error: err.message };
  }
}

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'recognize-api',
      configureServer(server) {
        server.middlewares.use('/api/recognize', async (req: Connect.IncomingMessage, res: any) => {
          try {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.method === 'POST') {
              const chunks: Uint8Array[] = [];
              req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
              req.on('end', async () => {
                try {
                  const audioData = Buffer.concat(chunks as Buffer[]);
                  if (audioData.length < 1024) {
                    if (!res.writableEnded) res.end(JSON.stringify({ track: null, method: 'too-small' }));
                    return;
                  }
                  const result = await recognizeShazam(audioData);
                  if (result && result.track) {
                    if (!res.writableEnded) res.end(JSON.stringify({ track: result.track, artist: result.artist, method: 'shazam' }));
                  } else {
                    if (!res.writableEnded) res.end(JSON.stringify({ track: null, method: 'no-match' }));
                  }
                } catch (e: any) {
                  if (!res.writableEnded) res.end(JSON.stringify({ track: null, method: 'error', error: e.message }));
                }
              });
              return;
            }
            const url = new URL(req.url || '/', 'http://localhost');
            const streamUrl = url.searchParams.get('url');
            if (!streamUrl) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing url' })); return; }
            const result = await recognizeTrack(decodeURIComponent(streamUrl));
            if (!res.writableEnded) res.end(JSON.stringify(result));
          } catch (err: any) {
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.end(JSON.stringify({ track: null, method: 'error', error: err.message }));
            }
          }
        });
      },
    },
    {
      name: 'radio-proxy',
      configureServer(server) {
        server.middlewares.use('/api/radio-proxy', async (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
          try {
            const reqUrl = new URL(req.url || '/', 'http://localhost');
            const path = reqUrl.pathname.replace(/^\/api\/radio-proxy/, '') || '/stations/search';
            const params = reqUrl.searchParams;

            const RADIO_SERVERS = [
              'https://de1.api.radio-browser.info/json',
              'https://de2.api.radio-browser.info/json',
              'https://at1.api.radio-browser.info/json',
            ];

            for (const server of RADIO_SERVERS) {
              try {
                const targetUrl = `${server}${path}?${params.toString()}`;
                const parsed = new URL(targetUrl);
                const mod = parsed.protocol === 'https:' ? https : http;

                const result = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
                  const proxyReq = mod.get(targetUrl, {
                    headers: {
                      'User-Agent': 'RadioFlow/1.0 (Dev Proxy)',
                      'Accept': 'application/json',
                    },
                    timeout: 20000,
                  }, (proxyRes) => {
                    let data = '';
                    proxyRes.on('data', (chunk: string) => data += chunk);
                    proxyRes.on('end', () => resolve({ statusCode: proxyRes.statusCode || 502, data }));
                  });
                  proxyReq.on('error', reject);
                  proxyReq.on('timeout', () => { proxyReq.destroy(); reject(new Error('timeout')); });
                });

                if (result.statusCode >= 200 && result.statusCode < 300) {
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('Cache-Control', 'public, max-age=30');
                  res.statusCode = result.statusCode;
                  res.end(result.data);
                  return;
                }
              } catch {}
            }

            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'All servers failed' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
    {
      name: 'audio-proxy',
      configureServer(server) {
        server.middlewares.use('/audio-proxy', (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
          try {
            const url = new URL(req.url || '/', 'http://localhost');
            const streamUrl = url.searchParams.get('url');
            
            if (!streamUrl) {
              res.statusCode = 400;
              res.end('Missing url parameter');
              return;
            }

            const targetUrl = decodeURIComponent(streamUrl);
            const parsedUrl = new URL(targetUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const mod = isHttps ? https : http;
            const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

            const proxyReq = mod.get(targetUrl, {
              agent,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioFlow/1.0)',
                'Accept': '*/*',
                'Icy-MetaData': '0',
              },
              timeout: 10000,
            }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, {
                'access-control-allow-origin': '*',
                'content-type': typeof proxyRes.headers['content-type'] === 'string'
                  ? proxyRes.headers['content-type']
                  : (Array.isArray(proxyRes.headers['content-type']) ? proxyRes.headers['content-type'][0] : 'audio/mpeg'),
              });
              proxyRes.pipe(res);
            });

            proxyReq.on('error', () => {
              if (!res.destroyed) {
                res.statusCode = 502;
                res.end('Proxy failed');
              }
            });

            proxyReq.on('timeout', () => {
              proxyReq.destroy();
              if (!res.destroyed) {
                res.statusCode = 502;
                res.end('Proxy timeout');
              }
            });
          } catch (err) {
            if (!res.destroyed) {
              res.statusCode = 502;
              res.end('Proxy failed');
            }
          }
        });
      },
    },
    {
      name: 'rss-news',
      configureServer(server) {
        const rssParser = new Parser();
        const TOPIC_FEEDS: Record<string, { url: string; source: string; topic: string }[]> = {
          'New Music': [
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'New Music' },
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'New Music' },
            { url: 'https://www.billboard.com/music/music-news/feed/', source: 'Billboard', topic: 'New Music' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'New Music' },
            { url: 'https://consequence.net/category/music/feed/', source: 'Consequence', topic: 'New Music' },
          ],
          'Festivals': [
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Festivals' },
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Festivals' },
            { url: 'https://consequence.net/category/music/festivals/feed/', source: 'Consequence', topic: 'Festivals' },
            { url: 'https://www.nme.com/news/music/festivals', source: 'NME', topic: 'Festivals' },
            { url: 'https://www.billboard.com/c/music/concerts/feed/', source: 'Billboard', topic: 'Festivals' },
          ],
          'Artists': [
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Artists' },
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Artists' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Artists' },
            { url: 'https://consequence.net/category/music/interviews/feed/', source: 'Consequence', topic: 'Artists' },
            { url: 'https://www.billboard.com/c/music/features/feed/', source: 'Billboard', topic: 'Artists' },
          ],
          'Culture': [
            { url: 'https://www.thisiscolossal.com/feed/', source: 'Colossal', topic: 'Culture' },
            { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'Culture' },
            { url: 'https://www.rollingstone.com/culture/culture-news/feed/', source: 'Rolling Stone', topic: 'Culture' },
            { url: 'https://pitchfork.com/rss/reviews/albums/', source: 'Pitchfork', topic: 'Culture' },
            { url: 'https://www.nme.com/blogs/nme-blogs', source: 'NME', topic: 'Culture' },
          ],
          'Throwback': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Throwback' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Throwback' },
            { url: 'https://www.nme.com/features', source: 'NME', topic: 'Throwback' },
            { url: 'https://www.billboard.com/c/music/features/feed/', source: 'Billboard', topic: 'Throwback' },
            { url: 'https://consequence.net/category/music/classic-rock/feed/', source: 'Consequence', topic: 'Throwback' },
          ],
          'Trending': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Trending' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Trending' },
            { url: 'https://www.billboard.com/music/music-news/feed/', source: 'Billboard', topic: 'Trending' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Trending' },
            { url: 'https://consequence.net/feed/', source: 'Consequence', topic: 'Trending' },
          ],
          'Surprise': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Surprise' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Surprise' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Surprise' },
            { url: 'https://www.thisiscolossal.com/feed/', source: 'Colossal', topic: 'Surprise' },
            { url: 'https://consequence.net/feed/', source: 'Consequence', topic: 'Surprise' },
          ],
          'Night Life': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Night Life' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Night Life' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Night Life' },
            { url: 'https://consequence.net/category/music/feed/', source: 'Consequence', topic: 'Night Life' },
            { url: 'https://www.billboard.com/music/music-news/feed/', source: 'Billboard', topic: 'Night Life' },
          ],
          'Deep Focus': [
            { url: 'https://pitchfork.com/rss/reviews/albums/', source: 'Pitchfork', topic: 'Deep Focus' },
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Deep Focus' },
            { url: 'https://www.nme.com/features', source: 'NME', topic: 'Deep Focus' },
            { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'Deep Focus' },
            { url: 'https://www.thisiscolossal.com/feed/', source: 'Colossal', topic: 'Deep Focus' },
          ],
          'Global Beat': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Global Beat' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Global Beat' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Global Beat' },
            { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'Global Beat' },
            { url: 'https://consequence.net/feed/', source: 'Consequence', topic: 'Global Beat' },
          ],
          'High Energy': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'High Energy' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'High Energy' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'High Energy' },
            { url: 'https://consequence.net/feed/', source: 'Consequence', topic: 'High Energy' },
            { url: 'https://www.billboard.com/music/music-news/feed/', source: 'Billboard', topic: 'High Energy' },
          ],
          'Morning': [
            { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'Morning' },
            { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'Morning' },
            { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'Morning' },
            { url: 'https://www.thisiscolossal.com/feed/', source: 'Colossal', topic: 'Morning' },
            { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'Morning' },
          ],
          'Voices': [
            { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'Voices' },
            { url: 'https://www.rollingstone.com/culture/culture-news/feed/', source: 'Rolling Stone', topic: 'Voices' },
            { url: 'https://www.nme.com/blogs/nme-blogs', source: 'NME', topic: 'Voices' },
            { url: 'https://www.thisiscolossal.com/feed/', source: 'Colossal', topic: 'Voices' },
            { url: 'https://consequence.net/category/music/interviews/feed/', source: 'Consequence', topic: 'Voices' },
          ],
        };
        const FALLBACK_FEEDS = [
          { url: 'https://www.rollingstone.com/music/music-news/feed/', source: 'Rolling Stone', topic: 'General' },
          { url: 'https://pitchfork.com/rss/news', source: 'Pitchfork', topic: 'General' },
          { url: 'https://www.nme.com/news/music', source: 'NME', topic: 'General' },
          { url: 'https://feeds.npr.org/1039/rss.xml', source: 'NPR', topic: 'General' },
          { url: 'https://www.billboard.com/music/music-news/feed/', source: 'Billboard', topic: 'General' },
        ];
        server.middlewares.use('/api/rss-news', async (req: Connect.IncomingMessage, res: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          try {
            const url = new URL(req.url || '', 'http://localhost');
            const topic = url.searchParams.get('topic') || '';
            const feeds = (TOPIC_FEEDS[topic] || FALLBACK_FEEDS).slice(0, 5);
            const results = await Promise.allSettled(feeds.map(f =>
              Promise.race([
                rssParser.parseURL(f.url),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
              ])
            ));
            const items: { source: string; title: string; link: string; topic: string }[] = [];
            for (let i = 0; i < results.length; i++) {
              const r = results[i];
              if (r.status === 'fulfilled' && r.value.items) {
                for (const item of r.value.items.slice(0, 12)) {
                  if (item.title) {
                    items.push({
                      source: feeds[i].source,
                      title: item.title,
                      link: item.link || '',
                      topic,
                    });
                  }
                }
              }
            }
            items.sort(() => Math.random() - 0.5);
            res.end(JSON.stringify(items.slice(0, 50)));
          } catch {
            res.end(JSON.stringify([]));
          }
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/radio-proxy'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'radio-proxy-cache',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://de1.api.radio-browser.info',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'radio-api-cache',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://picsum.photos',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'RadioFlow — Internet Radio Player',
        short_name: 'RadioFlow',
        description: 'Listen to radio stations from around the world with AI-powered recommendations, track recognition, and smart chat assistant.',
        theme_color: '#0F0F23',
        background_color: '#0F0F23',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        start_url: '/',
        scope: '/',
        lang: 'en',
        orientation: 'portrait-primary',
        categories: ['entertainment', 'music', 'news'],
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: '/icon-512.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
