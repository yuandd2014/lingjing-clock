// build/scripts/test-patch-aliyun.js
// 单测: 验证 patch-aliyun-to-download.js 行为正确
// 1) dry-run 不写文件
// 2) 真跑后 grep 验证 href 出现
// 3) revert 回原状
// 4) 缺 json / 缺字段 / 锚点缺失 → fail

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'd:/桌面时钟';
const htmlPath = path.join(REPO, 'website-site', 'download.html');
const jsonPath = path.join(REPO, 'build', 'tmp', 'aliyun-share.json');

const original = fs.readFileSync(htmlPath, 'utf8');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
    failed++;
  }
}

function revert() {
  fs.writeFileSync(htmlPath, original, 'utf8');
}

function ensureMockJson() {
  const mock = {
    version: '1.3.2',
    generatedAt: '2026-06-16T12:00:00.000Z',
    files: {
      setup: {
        fileName: 'LingJing.Clock.Setup.1.3.2.exe',
        shareId: 'MOCK-SETUP-ID-XYZ',
        url: 'https://www.alipan.com/s/MOCK-SETUP-ID-XYZ?pwd=m3k8',
        pwd: 'm3k8',
      },
      portable: {
        fileName: 'LingJingClock-Portable.exe',
        shareId: 'MOCK-PORTABLE-ID-ABC',
        url: 'https://www.alipan.com/s/MOCK-PORTABLE-ID-ABC?pwd=n4l9',
        pwd: 'n4l9',
      },
    },
  };
  fs.writeFileSync(jsonPath, JSON.stringify(mock, null, 2), 'utf8');
  return mock;
}

function runScript(args) {
  return execSync(`node "${path.join(REPO, 'build/scripts/patch-aliyun-to-download.js')}" ${args}`, { stdio: 'pipe' });
}

// ========== Test 1: dry-run 不改文件 ==========
console.log('\n[1] dry-run 模式不改文件');
ensureMockJson();
try {
  runScript('--dry-run');
} catch (e) {
  console.error('  dry-run 异常:', e.message);
  failed++;
}
const afterDry = fs.readFileSync(htmlPath, 'utf8');
assert(afterDry === original, 'dry-run 后文件未变化');

// ========== Test 2: 真跑后, href 出现 ==========
console.log('\n[2] 真跑, grep 验证 href 注入');
try {
  runScript('');
} catch (e) {
  console.error('  真跑异常:', e.message);
  failed++;
}
const afterRun = fs.readFileSync(htmlPath, 'utf8');
const share = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
assert(afterRun.includes(`href="${share.files.setup.url}"`), 'setup href 已注入');
assert(afterRun.includes(`href="${share.files.portable.url}"`), 'portable href 已注入');
assert(afterRun.includes(`data-pwd="${share.files.setup.pwd}"`), 'setup pwd 已注入');
assert(afterRun.includes(`data-pwd="${share.files.portable.pwd}"`), 'portable pwd 已注入');

// ========== Revert ==========
revert();
console.log('\n[revert] 已恢复 download.html 原始内容');

// ========== Test 3: 缺 json 时 fail ==========
console.log('\n[3] 缺 json 时友好 fail');
const tmpJson = path.join(REPO, 'build', 'tmp', 'aliyun-share.json.bak');
if (fs.existsSync(jsonPath)) fs.renameSync(jsonPath, tmpJson);
try {
  runScript('');
  console.error('  期望 fail 但成功了');
  failed++;
} catch (e) {
  assert(e.status === 1, '退出码 = 1');
}
if (fs.existsSync(tmpJson)) fs.renameSync(tmpJson, jsonPath);

// ========== Test 4: 缺 setup 字段时 fail ==========
console.log('\n[4] 缺 setup 字段时 fail');
ensureMockJson();
const orig = fs.readFileSync(jsonPath, 'utf8');
const bad = JSON.parse(orig);
delete bad.files.setup;
fs.writeFileSync(jsonPath, JSON.stringify(bad, null, 2));
try {
  runScript('');
  console.error('  期望 fail 但成功了');
  failed++;
} catch (e) {
  assert(e.status === 1, '退出码 = 1');
}
fs.writeFileSync(jsonPath, orig);

// ========== Test 5: 锚点不存在时 fail (损坏 download.html) ==========
console.log('\n[5] data-aliyun 锚点缺失时 fail');
revert();
const broken = original.replace('data-aliyun="setup"', 'data-aliyunx="setup"');
fs.writeFileSync(htmlPath, broken, 'utf8');
try {
  runScript('');
  console.error('  期望 fail 但成功了');
  failed++;
} catch (e) {
  assert(e.status === 1, '退出码 = 1');
}
revert();

// ========== Cleanup ==========
if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
console.log('\n[cleanup] 删 mock aliyun-share.json');

console.log(`\n========== ${failed === 0 ? 'ALL PASS' : failed + ' FAILED'} ==========`);
process.exit(failed > 0 ? 1 : 0);
