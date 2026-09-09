import fs from "node:fs";
import crypto from "node:crypto";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error("Usage: node scripts/decrypt-backup.mjs <input> <output>");
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
const data = fs.readFileSync(input);
const magic = Buffer.from("MY-SITE-BACKUP-V1\n", "utf8");

if (!data.subarray(0, magic.length).equals(magic)) {
  console.error("Invalid backup format");
  process.exit(1);
}

const offset = magic.length;
const iv = data.subarray(offset, offset + 12);
const authTag = data.subarray(offset + 12, offset + 28);
const ciphertext = data.subarray(offset + 28);

if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
  console.error("Invalid encrypted backup structure");
  process.exit(1);
}

try {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  fs.writeFileSync(output, plaintext);

  console.log(`Decrypted backup written: ${output}`);
  console.log(`Decrypted size: ${plaintext.length} bytes`);
} catch {
  console.error("Backup authentication failed");
  process.exit(1);
}
