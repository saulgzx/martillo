/* eslint-disable no-console */
require('dotenv').config();

const { io } = require('socket.io-client');

const SOCKET_URL = process.env.LOAD_TEST_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
const AUCTION_ID = process.env.LOAD_TEST_AUCTION_ID || '';
const LOT_ID = process.env.LOAD_TEST_LOT_ID || '';
const TOKENS = (process.env.LOAD_TEST_TOKENS || '')
  .split(',')
  .map((token) => token.trim())
  .filter(Boolean);
const CLIENTS = Number(process.env.LOAD_TEST_CLIENTS || TOKENS.length || 0);
const DURATION_SECONDS = Number(process.env.LOAD_TEST_DURATION_SECONDS || 60);
const BID_INTERVAL_MS = Number(process.env.LOAD_TEST_BID_INTERVAL_MS || 3000);

if (!SOCKET_URL || !AUCTION_ID || !LOT_ID || CLIENTS <= 0 || TOKENS.length < CLIENTS) {
  console.error(
    [
      'Missing load test config.',
      'Required env vars:',
      '- LOAD_TEST_SOCKET_URL',
      '- LOAD_TEST_AUCTION_ID',
      '- LOAD_TEST_LOT_ID',
      '- LOAD_TEST_TOKENS (comma-separated, at least one per client)',
      '- Optional: LOAD_TEST_CLIENTS, LOAD_TEST_DURATION_SECONDS, LOAD_TEST_BID_INTERVAL_MS',
    ].join('\n'),
  );
  process.exit(1);
}

const metrics = {
  connected: 0,
  emittedBids: 0,
  receivedBidUpdates: 0,
  rejectedBids: 0,
  connectionErrors: 0,
};

const sockets = [];
const timers = [];

function randomDelay() {
  return Math.floor((Math.random() - 0.5) * 1000);
}

function createClient(index) {
  const token = TOKENS[index];
  const socket = io(`${SOCKET_URL}/auction`, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
  });

  socket.on('connect', () => {
    metrics.connected += 1;
    socket.emit('auction:join', { auctionId: AUCTION_ID });
  });

  socket.on('bid:update', () => {
    metrics.receivedBidUpdates += 1;
  });

  socket.on('bid:rejected', () => {
    metrics.rejectedBids += 1;
  });

  socket.on('connect_error', () => {
    metrics.connectionErrors += 1;
  });

  const timer = setInterval(() => {
    const amount = Number(process.env.LOAD_TEST_BID_AMOUNT || 1000) + index;
    metrics.emittedBids += 1;
    socket.emit('bid:place', { auctionId: AUCTION_ID, lotId: LOT_ID, amount });
  }, Math.max(250, BID_INTERVAL_MS + randomDelay()));

  sockets.push(socket);
  timers.push(timer);
}

for (let i = 0; i < CLIENTS; i += 1) {
  createClient(i);
}

console.log(
  `[load-test] running ${CLIENTS} clients for ${DURATION_SECONDS}s against ${SOCKET_URL}/auction`,
);

setTimeout(() => {
  timers.forEach((timer) => clearInterval(timer));
  sockets.forEach((socket) => socket.disconnect());
  console.log('[load-test] finished');
  console.table(metrics);
  process.exit(0);
}, DURATION_SECONDS * 1000);
