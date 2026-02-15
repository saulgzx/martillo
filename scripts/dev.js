/* eslint-disable no-console */
const { spawn } = require('child_process');

function run(script) {
  return spawn('node', [script], { stdio: 'inherit', shell: true });
}

const children = [run('scripts/dev-backend.js'), run('scripts/dev-frontend.js')];

function shutdown(signal) {
  for (const child of children) {
    try {
      child.kill(signal);
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

