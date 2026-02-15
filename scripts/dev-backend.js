/* eslint-disable no-console */
const path = require('path');
const { spawn, spawnSync } = require('child_process');

function nodeMajor() {
  return Number.parseInt(String(process.versions.node).split('.')[0] ?? '0', 10);
}

function run(command, args, extraEnv, cwd) {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd,
    env: { ...process.env, ...extraEnv },
  });
}

function killPortWindows(port) {
  spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `$p=(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess; if ($p) { Stop-Process -Id $p -Force }`,
    ],
    { stdio: 'ignore', shell: true },
  );
}

const major = nodeMajor();
const allowed = new Set([20, 22]);
const backendCwd = path.resolve(__dirname, '..', 'apps', 'backend');

if (process.platform === 'win32') killPortWindows(4000);

const env = allowed.has(major)
  ? {}
  : {
      MARTILLO_SKIP_NODE_CHECK: '1',
    };

run('npm', ['run', 'dev'], env, backendCwd);

