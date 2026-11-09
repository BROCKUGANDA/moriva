import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";
const db = new PrismaClient();
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}
function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const hash = Buffer.from(hashB64, "base64");
    const check = scryptSync(password, salt, hash.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return check.equals(hash);
  } catch { return false; }
}
async function main() {
  const users = await db.user.findMany({ select: { email: true, role: true, status: true, passwordHash: true } });
  console.log("USER COUNT:", users.length);
  for (const u of users) {
    const ok = verifyPassword("Moriva-Demo-2026!", u.passwordHash);
    console.log(`${u.email} | ${u.role} | ${u.status} | pw-ok=${ok} | hash=${u.passwordHash.slice(0, 30)}...`);
  }
  await db.$disconnect();
}
main();
