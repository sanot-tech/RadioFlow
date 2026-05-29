import https from 'https';
import http from 'http';
import { URL } from 'url';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  try {
    const reqUrl = new URL(req.url, 'http://localhost');
    const streamUrl = reqUrl.searchParams.get('url');

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
      timeout: 15000,
    }, (proxyRes) => {
      const contentType = typeof proxyRes.headers['content-type'] === 'string'
        ? proxyRes.headers['content-type']
        : (Array.isArray(proxyRes.headers['content-type'])
          ? proxyRes.headers['content-type'][0]
          : 'audio/mpeg');

      res.writeHead(proxyRes.statusCode || 200, {
        'access-control-allow-origin': '*',
        'content-type': contentType,
        'Cache-Control': 'no-cache',
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
      res.statusCode = 500;
      res.end('Proxy error');
    }
  }
};
