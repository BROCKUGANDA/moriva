import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const tables = ["User","Session","ConsentPurpose","ConsentEvent","Instrument","InstrumentVersion","InstrumentItem","AssessmentSession","Referral","Provider","Organisation","SafetyResourceConfig","ContentItem","AuditEvent","FeatureFlag","JournalEntry","Notification","HealthContextShare","ConsentWithdrawal","DataExportRequest","DeletionRequest"];
  for (const t of tables) {
    try {
      const n = await (db as any)[t.charAt(0).toLowerCase() + t.slice(1)].count();
      console.log(`${t}: ${n}`);
    } catch { console.log(`${t}: (table missing)`); }
  }
  await db.$disconnect();
}
main();
