// build/scripts/upload-aliyunpan.js
// 半自动上传灵境时钟安装包到阿里云盘, 拿到 share URL
//
// 用法:
//   node build/scripts/upload-aliyunpan.js                  # 默认: 读 package.json version, 上传到 /灵境时钟/vX.Y.Z
//   node build/scripts/upload-aliyunpan.js --dry-run        # 干跑, 只打印计划, 不真上传
//   node build/scripts/upload-aliyunpan.js --exe <path>     # 指定 aliyunpan.exe 路径
//   node build/scripts/upload-aliyunpan.js --dist <dir>     # 指定 dist 目录 (默认 dist_v18)
//
// 前置:
//   1. 跑过 build/scripts/install-aliyunpan.ps1 安装 aliyunpan CLI
//   2. 跑过一次 aliyunpan.exe login 完成扫码登录
//
// 输出:
//   - console 打印分享链接 + 提取码
//   - 写 build/tmp/aliyun-share.json (供后续 patch 进 download.html)
//
// 产品艺术:
//   - 4 位提取码是阿里云盘普通分享的标配, 复制到 download.html 时用 ?pwd=xxxx 后缀
//   - 链接稳定后不会变, 每次 release 只换 share URL 一次 (vX.Y.Z 子目录隔离)
//   - 半自动: 脚本不写 download.html, 用户手贴, 避免误推

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const REPO = 'd:/桌面时钟';
const DEFAULT_DIST = 'dist_v18';
const REMOTE_ROOT = '/灵境时钟';

// ========== 解析参数 ==========
const argv = process.argv.slice(2);
function getArg(name, fallback) {
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return fallback;
}
function hasFlag(name) {
  return argv.includes(name);
}

const DRY_RUN = hasFlag('--dry-run');
const EXE_PATH = getArg('--exe', null);
const DIST_DIR = getArg('--dist', DEFAULT_DIST);
const VERBOSE = hasFlag('--verbose');

// ========== 工具函数 ==========
function log(tag, msg, color = '36') {
  // 36=cyan, 33=yellow, 32=green, 31=red, 35=magenta
  const t = new Date().toISOString().slice(11, 19);
  console.log(`\x1b[${color}m[${tag} ${t}]\x1b[0m ${msg}`);
}

function fail(msg) {
  log('FAIL', msg, '31');
  process.exit(1);
}

function info(msg) { log('info', msg, '36'); }
function warn(msg) { log('warn', msg, '33'); }
function ok(msg) { log('ok  ', msg, '32'); }

function findExe() {
  if (EXE_PATH) {
    if (fs.existsSync(EXE_PATH)) return EXE_PATH;
    fail(`--exe 指定的文件不存在: ${EXE_PATH}`);
  }

  // 1) PATH
  try {
    const r = execSync('where aliyunpan', { encoding: 'utf8' }).trim();
    if (r) {
      info(`aliyunpan 已在 PATH: ${r.split(/\r?\n/)[0]}`);
      return 'aliyunpan';
    }
  } catch (_) { /* not in PATH */ }

  // 2) build/tmp/aliyunpan/aliyunpan.exe
  const local = path.join(REPO, 'build', 'tmp', 'aliyunpan', 'aliyunpan.exe');
  if (fs.existsSync(local)) {
    info(`aliyunpan 在本地: ${local}`);
    return local;
  }

  fail('找不到 aliyunpan.exe, 请先跑 build/scripts/install-aliyunpan.ps1');
}

function runExe(exe, args, opts = {}) {
  const cmd = `${exe} ${args.join(' ')}`;
  if (VERBOSE || DRY_RUN) info(`$ ${cmd}`);
  if (DRY_RUN) return '';
  try {
    return execFileSync(exe, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    });
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const stdout = (e.stdout || '').toString();
    fail(`命令失败: ${cmd}\n  stdout: ${stdout.trim()}\n  stderr: ${stderr.trim()}`);
  }
}

function loadPkg() {
  const pkgPath = path.join(REPO, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg;
}

function expectedArtifacts(distDir, version) {
  return [
    `LingJing.Clock.Setup.${version}.exe`,
    `LingJingClock-Portable.exe`,
  ];
}

function ensureArtifacts(distDir, files) {
  for (const f of files) {
    const p = path.join(REPO, distDir, f);
    if (!fs.existsSync(p)) {
      fail(`产物不存在: ${p}\n  请先跑: npm run dist`);
    }
  }
  ok(`产物检查通过: ${files.length} 个文件`);
}

function checkLogin(exe) {
  info('检查 aliyunpan 登录状态 ...');
  const out = runExe(exe, ['whoami']);
  if (!out || /未登录|no login|please login|not logged in/i.test(out)) {
    fail('aliyunpan 未登录, 请先跑一次:\n  aliyunpan login');
  }
  const m = out.match(/当前帐号\s*[:：]?\s*(\S+)/) || out.match(/UserName\s*[:：]?\s*(\S+)/) || out.match(/^(\S+)\s*$/m);
  const user = m ? m[1] : out.split('\n')[0].trim();
  ok(`已登录: ${user}`);
  return user;
}

function ensureDir(exe, dir) {
  info(`创建云端目录: ${dir}`);
  const out = runExe(exe, ['mkdir', dir]);
  // 已存在会报错 "folder already exist", 忽略
  if (out && /already\s+exist|已存在/i.test(out)) {
    info(`目录已存在, 跳过`);
  } else if (out) {
    ok(`目录就绪: ${dir}`);
  }
}

function uploadFile(exe, localRel, remoteDir) {
  const localAbs = path.join(REPO, DIST_DIR, localRel);
  info(`上传: ${localRel} -> ${remoteDir}/`);
  runExe(exe, ['upload', localAbs, remoteDir], { timeout: 600000 }); // 10 min
  ok(`上传完成: ${localRel}`);
}

function shareFiles(exe, remotePaths) {
  info('创建分享 (mode 1 普通分享, 4 位提取码) ...');
  const args = ['share', 'set', '-mode', '1', ...remotePaths];
  const out = runExe(exe, args);
  // 模式 1 可能拒绝 .exe 分享, 失败时退到 mode 3
  if (out && /不支持|not support|失败|fail|拒绝/i.test(out)) {
    warn('mode 1 被拒, 退到 mode 3 (快传, 无提取码但需登录阿里云盘) ...');
    const out3 = runExe(exe, ['share', 'set', '-mode', '3', ...remotePaths]);
    if (!out3) fail('mode 3 也失败, 分享未创建');
    ok('mode 3 分享创建成功');
    return { mode: 3, raw: out3 };
  }
  ok('mode 1 分享创建成功');
  return { mode: 1, raw: out };
}

function listShares(exe) {
  info('拉取 share list 拿 share_id + 提取码 ...');
  const out = runExe(exe, ['share', 'list']);
  if (VERBOSE) console.log(out);
  return out;
}

// 解析 share list 表格: 找出本次上传的 file 对应的 share_id + 提取码
// 格式 (实际 aliyunpan 输出):
//   #  SHARE_ID    分享链接                              提取码  文件名       过期时间        状态
//   1  aBcDeFgH    https://www.alipan.com/s/aBcDeFgH     6k8d    LingJing...  2099-12-31     有效
function parseShares(listOutput, expectedFileNames) {
  const lines = listOutput.split(/\r?\n/);
  const found = [];
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#') && !line.match(/\d/)) continue;
    // 跳过表头 (含"分享链接"或"SHARE_ID"且无数字)
    if (/分享链接|SHARE_ID/i.test(line) && !/\d{4,}/.test(line)) continue;
    // 匹配行: 数字 + share_id + URL + 提取码 + 文件名
    const m = line.match(/(\d+)\s+(\S+)\s+(https?:\/\/\S+)\s+(\S+)\s+(.+?)(?:\s+\d{4}-\d{2}-\d{2}|\s*$)/);
    if (!m) continue;
    const [_, num, shareId, url, pwd, fileName] = m;
    // 匹配预期文件
    for (const expected of expectedFileNames) {
      if (fileName.includes(expected) || expected.includes(fileName.trim())) {
        found.push({ num: +num, shareId, url, pwd, fileName: fileName.trim() });
        break;
      }
    }
  }
  return found;
}

function buildShareUrl(file) {
  // alipan.com 是阿里云盘新域名, 兼容 aliyundrive.com
  if (file.pwd && file.pwd !== '-') {
    return `${file.url}?pwd=${file.pwd}`;
  }
  return file.url;
}

// ========== 主流程 ==========
function main() {
  const pkg = loadPkg();
  const version = pkg.version;
  info(`版本: ${version}`);
  info(`dist 目录: ${DIST_DIR}`);
  if (DRY_RUN) warn('干跑模式: 不会真上传, 不会真分享');

  const expected = expectedArtifacts(DIST_DIR, version);
  ensureArtifacts(DIST_DIR, expected);

  const exe = findExe();
  checkLogin(exe);

  const remoteDir = `${REMOTE_ROOT}/v${version}`;
  ensureDir(exe, remoteDir);

  // 上传两个文件
  for (const f of expected) {
    uploadFile(exe, f, remoteDir);
  }

  // 分享: 把两个文件路径都传给 share set (一次性)
  const remoteFiles = expected.map(f => `${remoteDir}/${f}`);
  shareFiles(exe, remoteFiles);

  // 拉 share list 解析
  const listOut = listShares(exe);
  const parsed = parseShares(listOut, expected);

  if (parsed.length === 0) {
    warn('自动解析 share list 失败, 原文如下, 请手贴:');
    console.log(listOut);
    console.log('');
    info('请打开 https://www.alipan.com/ 复制 share_id + 提取码');
    return;
  }

  // 按文件名匹配
  const result = {
    version,
    generatedAt: new Date().toISOString(),
    files: {},
  };
  for (const f of parsed) {
    let key = null;
    if (f.fileName.includes(`Setup.${version}`) || f.fileName.includes(`LingJing.Clock.Setup.${version}.exe`)) {
      key = 'setup';
    } else if (f.fileName.includes('Portable')) {
      key = 'portable';
    }
    if (key) {
      result.files[key] = {
        fileName: f.fileName,
        shareId: f.shareId,
        url: buildShareUrl(f),
        pwd: f.pwd !== '-' ? f.pwd : null,
      };
    }
  }

  // 写 json
  const outJson = path.join(REPO, 'build', 'tmp', 'aliyun-share.json');
  fs.writeFileSync(outJson, JSON.stringify(result, null, 2) + '\n', 'utf8');
  ok(`分享信息已写入: ${outJson}`);

  console.log('');
  ok('========== 分享链接 ==========');
  if (result.files.setup) {
    console.log(`  安装版: ${result.files.setup.url}`);
  }
  if (result.files.portable) {
    console.log(`  便携版: ${result.files.portable.url}`);
  }
  console.log('');
  info('把这 2 个链接替换 website-site/download.html 里的 download-actions 即可');
  info('(如需我自动改 + 推官网, 跟我说一声)');
}

main();
