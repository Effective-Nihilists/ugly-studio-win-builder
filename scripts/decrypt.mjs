#!/usr/bin/env node
// Decrypt an AES-256-GCM encrypted tarball produced by the private repo's
// scripts/windows-release.ts. The wire format matches that encoder:
//   [12-byte IV] [16-byte auth tag] [ciphertext...]
// Key is supplied as a base64-encoded 32-byte value in WIN_BUILD_ENCRYPTION_KEY.
//
// Usage: node scripts/decrypt.mjs <input.enc> <output>
import crypto from 'node:crypto';
import fs from 'node:fs';

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error('usage: decrypt.mjs <input.enc> <output>');
  process.exit(1);
}
const keyB64 = process.env.WIN_BUILD_ENCRYPTION_KEY;
if (!keyB64) {
  console.error('WIN_BUILD_ENCRYPTION_KEY env var not set');
  process.exit(1);
}
const key = Buffer.from(keyB64, 'base64');
if (key.length !== 32) {
  console.error(`key must decode to 32 bytes, got ${key.length}`);
  process.exit(1);
}

const raw = fs.readFileSync(inPath);
if (raw.length < 12 + 16) {
  console.error('ciphertext too short');
  process.exit(1);
}
const iv = raw.subarray(0, 12);
const tag = raw.subarray(12, 28);
const ct = raw.subarray(28);

const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(tag);
const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
fs.writeFileSync(outPath, plain);
console.log(`decrypted ${ct.length} → ${plain.length} bytes to ${outPath}`);
