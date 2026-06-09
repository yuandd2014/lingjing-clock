// v1.0.1 asset uploader — Node + https-proxy-agent + 进度条
const https = require('https');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');

const tok = fs.readFileSync('C:\\Users\\yuan5\\.desktop-clock-github-token', 'utf8').trim();
const REL_ID = 336346488;
const UPLOAD_BASE = `https://uploads.github.com/repos/yuandd2014/lingjing-clock/releases/${REL_ID}/assets`;
const proxy = 'http://127.0.0.1:7897';
const agent = new HttpsProxyAgent(proxy);

const files = [
  path.resolve('dist_v8\\LingJing.Clock.Setup.1.0.1.exe'),
  path.resolve('dist_v8\\LingJingClock-Portable.exe'),
  path.resolve('dist_v8\\LingJing.Clock.Setup.1.0.1.exe.blockmap'),
];

function uploadOne(file) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(file);
    const stat = fs.statSync(file);
    const total = stat.size;
    const url = `${UPLOAD_BASE}?name=${encodeURIComponent(filename)}`;

    const t0 = Date.now();
    const stream = fs.createReadStream(file);
    let uploaded = 0;
    let lastReport = 0;

    const req = https.request(url, {
      method: 'POST',
      agent,
      headers: {
        'Authorization': 'token ' + tok,
        'User-Agent': 'node-script',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': total,
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        const dt = (Date.now() - t0) / 1000;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const j = JSON.parse(body);
          console.log(`  [OK] ${filename}  ${(total/1e6).toFixed(1)}MB  ${dt.toFixed(1)}s  -> ${j.browser_download_url}`);
          resolve(j);
        } else {
          console.error(`  [FAIL ${res.statusCode}] ${filename}  body: ${body.substring(0, 300)}`);
          reject(new Error(`status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => { console.error('  [ERR]', filename, e.message); reject(e); });
    req.setTimeout(30 * 60 * 1000, () => { console.error(`  [TIMEOUT 30min]`, filename); req.destroy(); reject(new Error('timeout')); });

    stream.on('data', (chunk) => {
      uploaded += chunk.length;
      const now = Date.now();
      if (now - lastReport > 2000) {
        lastReport = now;
        const pct = ((uploaded / total) * 100).toFixed(1);
        const speed = uploaded / ((now - t0) / 1000) / 1e6;
        process.stdout.write(`  [..] ${filename}  ${pct}%  ${(uploaded/1e6).toFixed(1)}/${(total/1e6).toFixed(1)}MB  ${speed.toFixed(2)}MB/s\n`);
      }
    });
    stream.on('error', (e) => { console.error('  [STREAM ERR]', filename, e.message); reject(e); });

    stream.pipe(req);
  });
}

(async () => {
  for (const f of files) {
    console.log(`\n=== Uploading ${path.basename(f)} (${(fs.statSync(f).size/1e6).toFixed(1)} MB) ===`);
    try {
      await uploadOne(f);
    } catch (e) {
      console.error('Failed:', e.message);
      process.exit(1);
    }
  }
  console.log('\nAll 3 assets uploaded successfully.');
})();
