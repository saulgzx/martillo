/* eslint-disable no-console */
const { spawn } = require('child_process');

function nodeMajor() {
  return Number.parseInt(String(process.versions.node).split('.')[0] ?? '0', 10);
}

function run(command, args, extraEnv) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  return child;
}

const major = nodeMajor();
const allowed = new Set([20, 22]);

if (allowed.has(major)) {
  run('npm', ['run', 'dev', '-w', 'apps/frontend'], {});
} else {
  console.warn(
    `[martillo] Node ${process.versions.node} detectado. ` +
      `Frontend se ejecutara en modo estable (build + start) para evitar fallos de Next dev.`,
  );

  const env = {
    MARTILLO_SKIP_NODE_CHECK: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  };

  const build = run('npm', ['run', 'build', '-w', 'apps/frontend'], env);
  build.on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('npm', ['run', 'start', '-w', 'apps/frontend'], env);
  });
}

