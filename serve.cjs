const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname + '/dist';
http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  let fp = path.join(dir, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(fp)) fp = path.join(dir, 'index.html');
  const ext = path.extname(fp);
  const types = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
  const base = {'Content-Type': types[ext] || 'text/plain'};
  const name = path.basename(fp);
  if (name === 'sw.js' || name === 'index.html') {
    base['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0';
    base['Pragma'] = 'no-cache';
    base['Expires'] = '0';
  } else if (ext === '.js' || ext === '.css') {
    base['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    base['Cache-Control'] = 'no-cache';
  }
  res.writeHead(200, base);
  fs.createReadStream(fp).pipe(res);
}).listen(8080, '0.0.0.0', () => console.log('RadioFlow on :8080'));
