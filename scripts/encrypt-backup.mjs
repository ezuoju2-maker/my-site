import fs from "node:fs";
import crypto from "node:crypto";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error("Usage: node scripts/encrypt-backup.mjs <input> <output>");
  process.exit(2);
}

const secret = process.env.BACKUP_ENCRYPTION_KEY;

if (!secret) {
  console.error("BACKUP_ENCRYPTION_KEY is not configured");
  process.exit(2);
}

if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
  console.error("BACKUP_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
  process.exit(2);
}

const key = Buffer.from(secret, "hex");
const plaintext = fs.readFileSync(input);

const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

const ciphertext = Buffer.concat([
  cipher.update(plaintext),
  cipher.final(),
]);

const authTag = cipher.getAuthTag();
const magic = Buffer.from("MY-SITE-BACKUP-V1\n", "utf8");

fs.writeFileSync(
  output,
  Buffer.concat([
    magic,
    iv,
    authTag,
    ciphertext,
  ]),
);

console.log(`Encrypted backup written: ${output}`);
console.log(`Encrypted size: ${fs.statSync(output).size} bytes`);
