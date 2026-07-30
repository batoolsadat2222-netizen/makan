/**
 * نگهبان ماکان — اجرای سرور + راه‌اندازی مجدد خودکار
 */
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const serverDir = path.join(ROOT, 'server');
const PORT = process.env.PORT || '8080';
const PID_FILE = path.join(ROOT, '.makan.pid');
const HEALTH_MS = 15000;
const MAX_FAILS = 3;

let child = null;
let failCount = 0;
let restarts = 0;
let stopping = false;

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('fa-IR')}] ${msg}`);
}

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function writePid(pid) {
  try {
    fs.writeFileSync(PID_FILE, String(pid));
  } catch {
    /* ignore */
  }
}

function clearPid() {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch {
    /* ignore */
  }
}

function killChild() {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    /* ignore */
  }
}

function startChild() {
  killChild();
  child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    stdio: 'inherit',
    env: { ...process.env, PORT },
  });

  writePid(child.pid);
  log(`سرور راه افتاد (PID ${child.pid})`);

  child.on('exit', (code, signal) => {
    clearPid();
    child = null;
    if (stopping || signal === 'SIGTERM') return;
    restarts += 1;
    if (restarts > 100) {
      console.error('تعداد راه‌اندازی مجدد زیاد شد.');
      process.exit(1);
    }
    log(`سرور متوقف شد (code=${code}). راه‌اندازی مجدد در ۳ ثانیه...`);
    setTimeout(startChild, 3000);
  });
}

async function waitForReady(maxSec = 45) {
  for (let i = 0; i < maxSec; i += 1) {
    if (await isServerUp()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function watchdog() {
  if (!child) return;
  const up = await isServerUp();
  if (up) {
    failCount = 0;
    return;
  }
  failCount += 1;
  log(`بررسی سلامت ناموفق (${failCount}/${MAX_FAILS})`);
  if (failCount >= MAX_FAILS) {
    failCount = 0;
    log('سرور پاسخ نمی‌دهد — راه‌اندازی مجدد...');
    startChild();
    await waitForReady(30);
  }
}

async function main() {
  if (await isServerUp()) {
    log(`✓ ماکان از قبل روی http://localhost:${PORT} در حال اجراست.`);
    return;
  }

  log('ماکان — نگهبان فعال شد');
  log(`http://localhost:${PORT}`);

  startChild();
  const ready = await waitForReady();
  if (ready) log('✓ سرور آماده است');
  else log('⚠ سرور دیر بالا آمد — نگهبان ادامه می‌دهد');

  setInterval(watchdog, HEALTH_MS);
}

function shutdown() {
  stopping = true;
  killChild();
  clearPid();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
