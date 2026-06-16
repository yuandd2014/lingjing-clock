// build/scripts/patch-aliyun-to-download.js
// 把 build/tmp/aliyun-share.json 里的 share URL 写进 website-site/download.html
// 用 node split-join 避免 Edit 工具假成功 (历史教训: 多次复现)
//
// 用法:
//   node build/scripts/patch-aliyun-to-download.js
//   node build/scripts/patch-aliyun-to-download.js --json <path>   # 自定义 json
//   node build/scripts/patch-aliyun-to-download.js --html <path>   # 自定义 html
//   node build/scripts/patch-aliyun-to-download.js --dry-run      # 干跑, 只打印 diff

const fs = require('fs');
const path = require('path');

const REPO = 'd:/桌面时钟';
const DEFAULT_JSON = path.join(REPO, 'build', 'tmp', 'aliyun-share.json');
const DEFAULT_HTML = path.join(REPO, 'website-site', 'download.html');

// ========== 解析参数 ==========
const argv = process.argv.slice(2);
const getArg = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d;
};
const DRY_RUN = argv.includes('--dry-run');

const jsonPath = getArg('--json', DEFAULT_JSON);
const htmlPath = getArg('--html', DEFAULT_HTML);

// ========== 校验 ==========
if (!fs.existsSync(jsonPath)) {
  console.error(`[FAIL] 找不到: ${jsonPath}`);
  console.error('  请先跑: node build/scripts/upload-aliyunpan.js');
  process.exit(1);
}
const share = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (!share.files || !share.files.setup || !share.files.portable) {
  console.error('[FAIL] aliyun-share.json 缺关键字段:');
  console.error('  需要 files.setup.url 和 files.portable.url');
  console.error('  实际:', JSON.stringify(share, null, 2));
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error(`[FAIL] 找不到: ${htmlPath}`);
  process.exit(1);
}

const setupUrl = share.files.setup.url;
const portableUrl = share.files.portable.url;
const setupPwd = share.files.setup.pwd;
const portablePwd = share.files.portable.pwd;

console.log(`[info] 写入安装版: ${setupUrl}`);
console.log(`[info] 写入便携版: ${portableUrl}`);

// ========== 读 + 替换 ==========
let html = fs.readFileSync(htmlPath, 'utf8');
const before = html;

// 用 data-aliyun="<key>" 锚定整段 <a> 标签, 段内再改 href
// (href 可能在 data-aliyun 之前或之后, 都要 handle)
function patchAttr(html, value, key) {
  const re = new RegExp(`<a\\b([^>]*\\bdata-aliyun="${key}"[^>]*)>`, 'g');
  let hit = 0;
  const newHtml = html.replace(re, (_m, attrs) => {
    hit++;
    // 改 href="..." (保留其他属性)
    let newAttrs;
    if (/\bhref="[^"]*"/.test(attrs)) {
      newAttrs = attrs.replace(
        /\bhref="[^"]*"/,
        `href="${value}" data-pwd="${share.files[key].pwd || ''}"`
      );
    } else {
      newAttrs = `href="${value}" data-pwd="${share.files[key].pwd || ''}" ` + attrs;
    }
    return `<a${newAttrs}>`;
  });
  if (hit === 0) {
    console.error(`[FAIL] 没找到 data-aliyun="${key}" 锚点, html 可能没改成功`);
    process.exit(1);
  }
  return newHtml;
}

html = patchAttr(html, setupUrl, 'setup');
html = patchAttr(html, portableUrl, 'portable');

// ========== 校验 ==========
if (html === before) {
  console.error('[FAIL] html 没变, 替换失败');
  process.exit(1);
}

// grep 验证
if (!html.includes(`href="${setupUrl}"`)) {
  console.error(`[FAIL] grep 验证失败: 找不到 href="${setupUrl}"`);
  process.exit(1);
}
if (!html.includes(`href="${portableUrl}"`)) {
  console.error(`[FAIL] grep 验证失败: 找不到 href="${portableUrl}"`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log('[ok] 干跑 OK, 实际未写文件');
  // 打印 diff
  const beforeLines = before.split('\n');
  const afterLines = html.split('\n');
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    if (beforeLines[i] !== afterLines[i]) {
      console.log(`--- L${i + 1} (before) ---`);
      console.log(beforeLines[i]);
      console.log(`+++ L${i + 1} (after) +++`);
      console.log(afterLines[i]);
    }
  }
  process.exit(0);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`[ok] 已写入: ${htmlPath}`);
console.log('');
console.log('下一步:');
console.log('  git add website-site/download.html');
console.log('  git commit -m "feat(download): 阿里云盘下载链接 v' + share.version + '"');
console.log('  git push');
console.log('  (一键: node build/tmp/push-website-cn-mirror.js)');
