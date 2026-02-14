/* eslint-disable no-console */
require('dotenv').config();

const { io } = require('socket.io-client');

const API_BASE_URL = process.env.SMOKE_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
const SOCKET_URL = process.env.SMOKE_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_TOKEN = process.env.SMOKE_SOCKET_TOKEN || '';

if (!API_BASE_URL) {
  console.error('Missing SMOKE_API_BASE_URL');
  process.exit(1);
}

async function checkHealth() {
  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/health`);
  const body = await response.text();
  console.log(`[smoke] GET /health -> ${response.status} ${body.slice(0, 180)}`);
  if (!response.ok) throw new Error('/health failed');
}

async function checkInvalidLogin() {
  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid@martillo.com', password: 'invalid' }),
  });
  console.log(`[smoke] POST /api/auth/login (invalid) -> ${response.status}`);
}

async function checkPublicAuctions() {
  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/auctions/public`);
  console.log(`[smoke] GET /api/auctions/public -> ${response.status}`);
}

async function checkSocket() {
  if (!SOCKET_URL || !SOCKET_TOKEN) {
    console.log('[smoke] socket check skipped (SMOKE_SOCKET_URL/SMOKE_SOCKET_TOKEN missing)');
    return;
  }

  await new Promise((resolve, reject) => {
    const socket = io(`${SOCKET_URL.replace(/\/+$/, '')}/auction`, {
      transports: ['websocket'],
      auth: { token: SOCKET_TOKEN },
      timeout: 8000,
    });

    socket.on('connect', () => {
      console.log('[smoke] socket connected');
      socket.disconnect();
      resolve(null);
    });

    socket.on('connect_error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  await checkHealth();
  await checkInvalidLogin();
  await checkPublicAuctions();
  await checkSocket();
  console.log('[smoke] all checks done');
}

main().catch((error) => {
  console.error('[smoke] failed:', error.message);
  process.exit(1);
});
