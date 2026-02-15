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
  // Best-effort; if port isn't in use, this is a no-op.
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
const frontendCwd = path.resolve(__dirname, '..', 'apps', 'frontend');

// Prevent breaking a running server by deleting `.next` under it.
if (process.platform === 'win32') killPortWindows(3000);

if (allowed.has(major)) {
  run('npm', ['run', 'clean:next'], {}, frontendCwd).on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'dev'], {}, frontendCwd);
  });
} else {
  console.warn(
    `[martillo] Node ${process.versions.node} detectado. ` +
      `Frontend se ejecutara en modo estable (clean + build + start) para evitar fallos de Next dev.`,
  );

  const env = {
    MARTILLO_SKIP_NODE_CHECK: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  };

  run('npm', ['run', 'clean:next'], env, frontendCwd).on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'build'], env, frontendCwd).on('exit', (buildCode) => {
      if (buildCode !== 0) process.exit(buildCode ?? 1);
      run('npm', ['run', 'start'], env, frontendCwd);
    });
  });
}
