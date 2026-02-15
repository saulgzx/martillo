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

const env = allowed.has(major)
  ? {}
  : {
      MARTILLO_SKIP_NODE_CHECK: '1',
    };

run('npm', ['run', 'dev', '-w', 'apps/backend'], env);

