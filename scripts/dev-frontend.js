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

function getPortPidWindows(port) {
  const res = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      // Return the first owning PID (or nothing).
      `(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: true },
  );
  const pid = Number.parseInt(String(res.stdout ?? '').trim(), 10);
  return Number.isFinite(pid) && pid > 0 ? pid : null;
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
// Next.js dev should work on 20/22 and is generally fine on 24 as well.
// If it misbehaves on a specific machine, set `MARTILLO_FRONTEND_MODE=stable`.
const allowed = new Set([20, 22, 24]);
const frontendCwd = path.resolve(__dirname, '..', 'apps', 'frontend');

// Prevent breaking a running server by deleting `.next` under it.
// If we fail to free port 3000, do NOT proceed with clean:next.
if (process.platform === 'win32') {
  const before = getPortPidWindows(3000);
  if (before) {
    killPortWindows(3000);
    const after = getPortPidWindows(3000);
    if (after) {
      console.error(
        `[martillo] Puerto 3000 sigue en uso (PID ${after}). ` +
          'Cierra el proceso/terminal que esta ejecutando Next y vuelve a correr el comando.',
      );
      process.exit(1);
    }
  }
}

const stableEnv = {
  MARTILLO_SKIP_NODE_CHECK: '1',
  NEXT_TELEMETRY_DISABLED: '1',
};

// Optional override for troubleshooting.
if (process.env.MARTILLO_FRONTEND_MODE === 'stable') {
  console.warn('[martillo] MARTILLO_FRONTEND_MODE=stable activo (build + start).');
  run('npm', ['run', 'clean:next'], stableEnv, frontendCwd).on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'build'], stableEnv, frontendCwd).on('exit', (buildCode) => {
      if (buildCode !== 0) process.exit(buildCode ?? 1);
      run('npm', ['run', 'start'], stableEnv, frontendCwd);
    });
  });
} else if (allowed.has(major)) {
  run('npm', ['run', 'clean:next'], {}, frontendCwd).on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'dev'], {}, frontendCwd);
  });
} else {
  console.warn(
    `[martillo] Node ${process.versions.node} detectado. ` +
      `Frontend se ejecutara en modo estable (clean + build + start) para evitar fallos de Next dev.`,
  );

  run('npm', ['run', 'clean:next'], stableEnv, frontendCwd).on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'build'], stableEnv, frontendCwd).on('exit', (buildCode) => {
      if (buildCode !== 0) process.exit(buildCode ?? 1);
      run('npm', ['run', 'start'], stableEnv, frontendCwd);
    });
  });
}
