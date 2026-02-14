/* eslint-disable no-console */
require('dotenv').config();
const { spawn } = require('child_process');

function runCommand(command, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  const apiBase = process.env.SMOKE_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const socketBase = process.env.SMOKE_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;

  const checks = [
    {
      name: 'Smoke API/Socket baseline',
      run: () =>
        runCommand('node', ['scripts/smoke-test.js'], {
          SMOKE_API_BASE_URL: apiBase || '',
          SMOKE_SOCKET_URL: socketBase || '',
          SMOKE_SOCKET_TOKEN: process.env.SMOKE_SOCKET_TOKEN || '',
        }),
    },
  ];

  console.log('[e2e-check] starting automated checklist');
  let passed = 0;

  for (const check of checks) {
    console.log(`\n[e2e-check] ${check.name}`);
    // eslint-disable-next-line no-await-in-loop
    const ok = await check.run();
    if (ok) {
      passed += 1;
      console.log(`[e2e-check] PASS: ${check.name}`);
    } else {
      console.log(`[e2e-check] FAIL: ${check.name}`);
    }
  }

  console.log('\n[e2e-check] TODO manual/next automation steps:');
  console.log('- Register -> Login -> Refresh -> Logout end-to-end flow');
  console.log('- Create auction -> add lot/media -> publish');
  console.log('- Bidder apply -> admin approve -> bid in live room');
  console.log('- Adjudicate -> payment order -> webhook payment');
  console.log(`\n[e2e-check] summary: ${passed}/${checks.length} automated checks passed`);

  if (passed !== checks.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[e2e-check] unexpected error:', error.message);
  process.exit(1);
});
