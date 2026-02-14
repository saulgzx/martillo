/* eslint-disable no-console */
require('dotenv').config();

const target = process.env.HEADER_CHECK_URL || process.env.SMOKE_API_BASE_URL;

const requiredHeaders = [
  'x-content-type-options',
  'x-frame-options',
  'strict-transport-security',
  'content-security-policy',
];

if (!target) {
  console.error(
    'Missing HEADER_CHECK_URL (or SMOKE_API_BASE_URL). Example: https://martillo.up.railway.app',
  );
  process.exit(1);
}

async function main() {
  const url = `${target.replace(/\/+$/, '')}/health`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Health endpoint returned status ${response.status}`);
  }

  const missing = requiredHeaders.filter((header) => !response.headers.get(header));

  if (missing.length > 0) {
    throw new Error(`Missing required security headers: ${missing.join(', ')}`);
  }

  console.log('[check-headers] PASS');
  for (const header of requiredHeaders) {
    console.log(`${header}: ${response.headers.get(header)}`);
  }
}

main().catch((error) => {
  console.error('[check-headers] FAIL:', error.message);
  process.exit(1);
});
