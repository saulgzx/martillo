/**
 * Generate RSA 2048-bit key pair for JWT RS256 signing.
 * Run: npx ts-node scripts/generate-keys.ts
 *
 * Copy the output to your .env file or Railway environment variables.
 * Use \n for newlines in env vars (Railway handles this automatically).
 */
import { generateKeyPairSync, randomBytes } from 'crypto';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const encryptionKey = randomBytes(32).toString('hex');

console.log('=== JWT PRIVATE KEY ===');
console.log(privateKey);
console.log('=== JWT PUBLIC KEY ===');
console.log(publicKey);
console.log('=== ENCRYPTION KEY (AES-256) ===');
console.log(encryptionKey);
console.log('\n=== ENV FORMAT (for .env file) ===');
console.log(`JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
console.log(`JWT_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('\n=== Instructions ===');
console.log('1. Copy the ENV FORMAT values above to your .env file');
console.log('2. In Railway: paste the PEM keys directly (Railway handles multi-line)');
console.log('3. NEVER commit these keys to git');
