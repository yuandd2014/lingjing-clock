// push-website-aliyun.js — 推官网 download.html 阿里云盘段 + 取消注释
// 半自动: 假定 patch-aliyun-to-download.js 已跑 (改 href) + 阿里云盘段 HTML 注释已手动打开
// 走 GitHub API + Token (复用 push-website-cn-mirror.js 套路)
// commit msg 含版本号, 方便审计每次 release 改了哪次 share link

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const TOKEN = (function () {
  const p = path.join('d:/桌面时钟/build/tmp', '.gh-token.b64');
  if (fs.existsSync(p)) return Buffer.from(fs.readFileSync(p, 'utf8').trim(), 'base64').toString('utf8');
  return null;
})();
if (!TOKEN) { console.error('缺 token'); process.exit(1); }

const OWNER = 'yuandd2014';
const SITE_REPO = 'lingjing-clock-website';
const ROOT = 'D:/桌面时钟';

const argv = process.argv.slice(2);
const VERSION = (() => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return pkg.version;
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));

const apiCall = (url, method = 'GET', body = null) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    method, hostname: u.hostname, port: 443, path: u.pathname + u.search, agent: null,
    headers: {
      'Authorization': `token ${TOKEN}`,
      'User-Agent': 'lingjing-pusher',
      'Accept': 'application/vnd.github.v3+json',
    },
  };
  if (body) {
    const data = Buffer.from(JSON.stringify(body));
    opts.headers['Content-Type'] = 'application/json; charset=utf-8';
    opts.headers['Content-Length'] = data.length;
    body = data;
  }
  const req = https.request(opts, (res) => {
    let chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try { resolve(JSON.parse(text)); } catch (e) { resolve(text); }
      } else { reject(new Error(`API ${res.statusCode}: ${text.slice(0, 300)}`)); }
    });
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

(async () => {
  try {
    console.log(`=== 推官网阿里云盘 v${VERSION} ===`);

    // 0) 安全检查: download.html 不能还在 ghproxy 状态
    const htmlPath = path.join(ROOT, 'website-site', 'download.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (html.includes('ghproxy.net')) {
      console.error('[FAIL] download.html 还有 ghproxy.net 残留, 请先清掉');
      process.exit(1);
    }
    ok('download.html 看起来已就绪');

    const ref = await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/ref/heads/main`);
    const parentSha = ref.object.sha;
    const parentCommit = await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/commits/${parentSha}`);
    const baseTreeSha = parentCommit.tree.sha;
    console.log('parent: ' + parentSha.slice(0, 8));

    const siteRoot = path.join(ROOT, 'website-site');
    function walk(rel) {
      const full = path.join(siteRoot, rel);
      if (!fs.existsSync(full)) return [];
      const s = fs.statSync(full);
      if (s.isFile()) return [{ path: rel, content: fs.readFileSync(full) }];
      let r = [];
      for (const e of fs.readdirSync(full)) {
        if (e.startsWith('.')) continue;
        r = r.concat(walk(path.posix.join(rel, e)));
      }
      return r;
    }
    const files = walk('');
    console.log('官网文件数: ' + files.length);

    const blobs = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isBin = /\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|svg)$/i.test(f.path);
      const body = isBin
        ? { encoding: 'base64', content: f.content.toString('base64') }
        : { encoding: 'utf-8', content: f.content.toString('utf8').replace(/\r\n/g, '\n') };
      const blob = await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/blobs`, 'POST', body);
      blobs.push({ path: f.path, sha: blob.sha });
      if ((i + 1) % 5 === 0 || i === files.length - 1) {
        process.stdout.write(`  blob ${i+1}/${files.length}\n`);
      }
      if (i < files.length - 1) await sleep(100);
    }

    const tree = await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/trees`, 'POST', {
      base_tree: baseTreeSha,
      tree: blobs.map(b => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
    });

    const commitMsg = argv.includes('--msg') 
      ? argv[argv.indexOf('--msg') + 1]
      : `feat(download): 阿里云盘下载链接 v${VERSION}`;

    const commit = await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/commits`, 'POST', {
      message: commitMsg,
      tree: tree.sha,
      parents: [parentSha],
    });
    await apiCall(`https://api.github.com/repos/${OWNER}/${SITE_REPO}/git/refs/heads/main`, 'PATCH', {
      sha: commit.sha, force: true,
    });
    console.log('官网 main 已更新 -> ' + commit.sha);
    console.log('URL: https://github.com/' + OWNER + '/' + SITE_REPO + '/commit/' + commit.sha);
    console.log('\n=== 完成 ===');
    console.log('1-2 分钟后 GitHub Pages 自动部署');
    console.log(`download.html 现在有 4 个下载按钮 (GitHub 直连 + 阿里云盘 v${VERSION})`);
  } catch (e) {
    console.error('推送失败: ' + e.message);
    process.exit(1);
  }
})();

function ok(msg) { console.log(`\x1b[32m[ok]\x1b[0m ${msg}`); }
