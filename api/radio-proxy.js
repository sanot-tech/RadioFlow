import https from 'https';
import http from 'http';
import { URL } from 'url';

const RADIO_BROWSER_SERVERS = [
  'https://de1.api.radio-browser.info/json',
  'https://de2.api.radio-browser.info/json',
  'https://at1.api.radio-browser.info/json',
];

function proxyRequest(targetUrl) {
  const parsed = new URL(targetUrl);
  const mod = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = mod.get(targetUrl, {
      headers: {
        'User-Agent': 'RadioFlow/1.0 (Vercel Proxy)',
        'Accept': 'application/json',
      },
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

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
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const reqUrl = new URL(req.url, 'http://localhost');
    const path = reqUrl.pathname.replace(/^\/api\/radio-proxy/, '') || '/stations/search';
    const params = reqUrl.searchParams;

    const errors = [];

    for (const server of RADIO_BROWSER_SERVERS) {
      try {
        const targetUrl = `${server}${path}?${params.toString()}`;
        const result = await proxyRequest(targetUrl);

        if (result.statusCode >= 200 && result.statusCode < 300) {
          res.setHeader('Content-Type', result.headers['content-type'] || 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=30');
          res.status(result.statusCode);
          res.end(result.data);
          return;
        }

        errors.push({ server, status: result.statusCode });
      } catch (err) {
        errors.push({ server, error: err.message });
      }
    }

    res.statusCode = 502;
    res.end(JSON.stringify({
      error: 'All radio-browser servers failed',
      details: errors,
    }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
