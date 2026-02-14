/* eslint-disable no-console */
require('dotenv').config();

const { io } = require('socket.io-client');

const SOCKET_URL = process.env.RECONNECT_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
const AUCTION_ID = process.env.RECONNECT_AUCTION_ID || '';
const LOT_ID = process.env.RECONNECT_LOT_ID || '';
const TOKEN = process.env.RECONNECT_TOKEN || '';
const BID_AMOUNT = Number(process.env.RECONNECT_BID_AMOUNT || 1000);
const DOWN_SECONDS = Number(process.env.RECONNECT_DOWN_SECONDS || 10);

if (!SOCKET_URL || !AUCTION_ID || !LOT_ID || !TOKEN) {
  console.error(
    [
      'Missing reconnect test config.',
      'Required env vars:',
      '- RECONNECT_SOCKET_URL',
      '- RECONNECT_AUCTION_ID',
      '- RECONNECT_LOT_ID',
      '- RECONNECT_TOKEN',
    ].join('\n'),
  );
  process.exit(1);
}

let socket = null;
let phase = 'init';

function connectClient() {
  socket = io(`${SOCKET_URL}/auction`, {
    transports: ['websocket'],
    auth: { token: TOKEN },
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log(`[reconnect-test] connected (${phase})`);
    socket.emit('auction:join', { auctionId: AUCTION_ID });

    if (phase === 'init') {
      socket.emit('bid:place', { auctionId: AUCTION_ID, lotId: LOT_ID, amount: BID_AMOUNT });
      socket.emit('bid:place', { auctionId: AUCTION_ID, lotId: LOT_ID, amount: BID_AMOUNT + 100 });
      socket.emit('bid:place', { auctionId: AUCTION_ID, lotId: LOT_ID, amount: BID_AMOUNT + 200 });

      phase = 'disconnecting';
      setTimeout(() => {
        console.log(`[reconnect-test] force disconnect for ${DOWN_SECONDS}s`);
        socket.disconnect();
        phase = 'reconnecting';
        setTimeout(() => {
          connectClient();
        }, DOWN_SECONDS * 1000);
      }, 1500);
      return;
    }

    if (phase === 'reconnecting') {
      console.log('[reconnect-test] reconnection flow completed');
      setTimeout(() => process.exit(0), 1000);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[reconnect-test] connect_error:', error.message);
  });
}

connectClient();
