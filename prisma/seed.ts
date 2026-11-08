/**
 * MORIVA — idempotent demo seed. SYNTHETIC DATA ONLY.
 * Run: bunx tsx prisma/seed.ts  (or bun prisma/seed.ts)
 * Everything is labelled demo/synthetic. No real person, provider or clinical content.
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes, createHash } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export const DEMO_PASSWORD = "Moriva-Demo-2026!"; // demo-mode only; startup refuses demo mode in production

async function seedConsentPurposes() {
  const purposes = [
    { code: "ACCOUNT_SECURITY", required: true, titleEn: "Account and security processing", wordingEn: "Process your email and account state to authenticate you, secure the service and keep records required by law. This is required to provide the service.", dataCategoriesEn: "Identifier and contact · Security and audit records" },
    { code: "ASSESSMENT_STORAGE", required: true, titleEn: "Wellbeing assessment storage", wordingEn: "Store your questionnaire responses and results so you can see your history, resume where you left off, and choose to share a result later. This is required for assessments to work.", dataCategoriesEn: "Assessment responses · Assessment results" },
    { code: "JOURNAL_STORAGE", required: false, titleEn: "Optional private journal", wordingEn: "Store private notes you choose to write. Notes are never analysed, scored or shared automatically. Declining does not affect any other feature.", dataCategoriesEn: "Journal text" },
    { code: "AI_PROCESSING", required: false, titleEn: "Optional AI reflection assistance", wordingEn: "Allow optional processing of selected, redacted context by an external AI model for reflection support. This feature is disabled in this prototype; granting now stores your choice for a future version.", dataCategoriesEn: "Selected redacted context" },
    { code: "REFERRAL", required: false, titleEn: "Referral to a named provider", wordingEn: "Share the exact fields shown in the preview with the provider you select, so they can understand the reason for the referral. One consent per named provider and referral.", dataCategoriesEn: "Selected assessment summary · Contact details · Referral reason" },
    { code: "HEALTH_CONTEXT_SHARE", required: false, titleEn: "Health-context sharing with a named provider", wordingEn: "Share selected health-context fields with a named provider for a limited time. You choose every field, see the exact preview, and can withdraw at any time.", dataCategoriesEn: "Selected health-context fields" },
    { code: "FOLLOWUP_NOTIFICATIONS", required: false, titleEn: "Optional follow-up notifications", wordingEn: "Receive neutral reminders (for example, \"You have an update in MORIVA\") about referral progress. Notifications never include clinical details.", dataCategoriesEn: "Notification delivery status" },
    { code: "RESEARCH", required: false, titleEn: "Optional research use", wordingEn: "Permit de-identified use of your data for research under a separate governance route. Declining changes nothing else.", dataCategoriesEn: "De-identified assessment data" },
    { code: "MARKETING", required: false, titleEn: "Marketing (separate from care)", wordingEn: "Receive product news. Marketing consent is never bundled with care workflows and declining never blocks any feature.", dataCategoriesEn: "Email address" },
  ];
  for (const p of purposes) {
    const existing = await db.consentPurpose.findFirst({ where: { code: p.code, version: 1 } });
    if (!existing) {
      await db.consentPurpose.create({
        data: {
          code: p.code, version: 1, titleEn: p.titleEn, titleAr: null,
          wordingEn: p.wordingEn, wordingAr: null, dataCategoriesEn: p.dataCategoriesEn,
          required: p.required, effectiveAt: new Date("2026-11-08T00:00:00Z"),
        },
      });
    }
  }
}

const DEMO_INSTRUMENT_ITEMS = [
  { ordinal: 1, itemKey: "mood_overall", promptEn: "Over the last two weeks, how has your overall mood been?", helperEn: "Demonstration item — synthetic content, not a validated questionnaire.", responseSchema: JSON.stringify({ type: "ordinal", min: 0, max: 3, labels: ["Very low", "Low", "Up and down", "Steady"] }) },
  { ordinal: 2, itemKey: "coping_daily", promptEn: "Over the last two weeks, how well have you felt you coped with day-to-day tasks?", helperEn: "Demonstration item — synthetic content.", responseSchema: JSON.stringify({ type: "ordinal", min: 0, max: 3, labels: ["With great difficulty", "With difficulty", "Fairly well", "Well"] }) },
  { ordinal: 3, itemKey: "sleep_rest", promptEn: "Over the last two weeks, how restful has your sleep been?", helperEn: "Demonstration item — synthetic content.", responseSchema: JSON.stringify({ type: "ordinal", min: 0, max: 3, labels: ["Not restful at all", "Mostly unrefreshing", "Mixed", "Restful"] }) },
  { ordinal: 4, itemKey: "connection_people", promptEn: "Over the last two weeks, how connected have you felt to people around you?", helperEn: "Demonstration item — synthetic content.", responseSchema: JSON.stringify({ type: "ordinal", min: 0, max: 3, labels: ["Very disconnected", "Somewhat disconnected", "Fairly connected", "Connected"] }) },
  { ordinal: 5, itemKey: "safety_urgent_thoughts", promptEn: "In the past two weeks, have you had thoughts of harming yourself?", helperEn: "If you select either of the last two options, urgent support guidance will be shown immediately.", responseSchema: JSON.stringify({ type: "ordinal", min: 0, max: 3, labels: ["Never", "Briefly, with no intent", "Yes, with some intent", "Yes, frequently"] }) },
];

async function seedInstrument() {
  const code = "MORIVA-DEMO-WBC";
  const version = "1.0.0-demo";
  let instrument = await db.instrument.findUnique({ where: { code } });
  if (!instrument) {
    instrument = await db.instrument.create({
      data: {
        code,
        displayName: "MORIVA Wellbeing Check (Synthetic Demonstration)",
        ownerSource: "MORIVA prototype — authored demonstration content",
        construct: "General self-reported wellbeing (synthetic)",
        intendedPopulation: "Adults 18+ (demonstration only)",
        status: "SIMULATION_ONLY",
      },
    });
  }
  let ver = await db.instrumentVersion.findFirst({ where: { instrumentId: instrument.id, version, locale: "en" } });
  if (!ver) {
    const checksum = createHash("sha256").update(JSON.stringify(DEMO_INSTRUMENT_ITEMS)).digest("hex");
    ver = await db.instrumentVersion.create({
      data: {
        instrumentId: instrument.id,
        version,
        locale: "en",
        timeframe: "LAST_TWO_WEEKS",
        contentChecksum: checksum,
        scoringVersion: "demo-scoring-1.0.0",
        licenceStatus: "SYNTHETIC_NO_RIGHTS_REQUIRED",
        validityNotes: "Synthetic demonstration content. Not validated, not clinically approved, not a diagnostic tool. Shipped under PRD §8.4 because no clinical approver is available.",
        limitationsEn: "This check is a synthetic demonstration. It cannot tell you whether you have a condition, and it cannot predict what will happen. It does not measure all aspects of wellbeing, and it is not a validated clinical questionnaire. Only a qualified professional can help you understand what you are experiencing.",
        interpretationEn: JSON.stringify([
          { min: 0, max: 5, code: "DEMO_LOWER", titleEn: "Lower wellbeing in this period", bodyEn: "Your responses suggest your wellbeing may have been lower over the last two weeks. This is not a diagnosis, and it cannot say why. Many people find it useful to look at support options or talk to someone — a professional can help you understand this." },
          { min: 6, max: 10, code: "DEMO_MIXED", titleEn: "Mixed or changing wellbeing", bodyEn: "Your responses suggest things have been up and down recently. This is not a diagnosis. You know your situation best — you can explore support options, save this result, or simply come back later." },
          { min: 11, max: 15, code: "DEMO_STEADIER", titleEn: "Steadier wellbeing in this period", bodyEn: "Your responses suggest things have felt steadier over the last two weeks. This is not a diagnosis and doesn't measure everything. Support options remain available whenever you want them." },
        ]),
        riskItemKey: "safety_urgent_thoughts",
        clinicalApprover: "NONE — synthetic demonstration (no clinical approver exists)",
        approvedAt: new Date("2026-11-08T00:00:00Z"),
        status: "APPROVED_SIMULATION",
      },
    });
    for (const item of DEMO_INSTRUMENT_ITEMS) {
      await db.instrumentItem.create({
        data: {
          instrumentVersionId: ver.id,
          ordinal: item.ordinal,
          itemKey: item.itemKey,
          promptEn: item.promptEn,
          helperEn: item.helperEn,
          responseSchema: item.responseSchema,
          required: item.itemKey !== "safety_urgent_thoughts" ? false : true, // risk item is always shown
        },
      });
    }
  }
  // link active version
  await db.instrument.update({ where: { id: instrument.id }, data: { activeVersionId: ver.id } });
  return { instrument, ver };
}

async function seedPathway() {
  const version = "2026.11-demo";
  const existing = await db.pathwayRule.findFirst({ where: { version, jurisdiction: "AE-AZ" } });
  if (existing) return;
  const rules = {
    note: "DEMONSTRATION RULES — no clinical approval exists. Synthetic thresholds exercise the deterministic engine only.",
    bundles: [
      {
        id: "urgent-safety",
        when: { kind: "URGENT_RISK_RESPONSE" },
        action: "SAFETY_OVERRIDE",
        rationaleCode: "R-URGENT-SAFETY",
      },
      {
        id: "elevated-demo",
        when: { kind: "RESULT_CODE", codes: ["DEMO_LOWER"] },
        offer: ["PRIMARY_CARE", "TELEMH", "COMMUNITY", "SELF_GUIDED"],
        order: ["TELEMH", "PRIMARY_CARE", "COMMUNITY", "SELF_GUIDED"],
        rationaleCode: "R-DEMO-LOWER",
        rationaleTextEn: "Your responses suggest it may help to talk with a qualified service. You can also choose any other option below — the choice is yours.",
      },
      {
        id: "mixed-demo",
        when: { kind: "RESULT_CODE", codes: ["DEMO_MIXED"] },
        offer: ["COMMUNITY", "SELF_GUIDED", "TELEMH", "PRIMARY_CARE"],
        order: ["COMMUNITY", "SELF_GUIDED", "TELEMH", "PRIMARY_CARE"],
        rationaleCode: "R-DEMO-MIXED",
        rationaleTextEn: "Your responses suggest a mix of self-guided and community options could be useful, with professional options available if you prefer.",
      },
      {
        id: "steadier-demo",
        when: { kind: "RESULT_CODE", codes: ["DEMO_STEADIER"] },
        offer: ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH"],
        order: ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH"],
        rationaleCode: "R-DEMO-STEADIER",
        rationaleTextEn: "Your responses suggest things have been steadier. Self-guided and community options are shown first; you can still choose professional support.",
      },
      {
        id: "fallback-general",
        when: { kind: "NO_RESULT" },
        offer: ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH"],
        order: ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH"],
        rationaleCode: "R-NO-RESULT",
        rationaleTextEn: "There isn't a result to personalise these options yet. These are general options, and urgent help is always available.",
      },
    ],
  };
  await db.pathwayRule.create({
    data: {
      version,
      jurisdiction: "AE-AZ",
      status: "DEMO_APPROVED",
      contentHash: createHash("sha256").update(JSON.stringify(rules)).digest("hex"),
      rulesJson: JSON.stringify(rules),
      clinicalApproverId: "NONE_DEMO",
      approvedAt: new Date("2026-11-08T00:00:00Z"),
      effectiveAt: new Date("2026-11-08T00:00:00Z"),
      expiryAt: new Date("2027-11-08T00:00:00Z"),
    },
  });
}

async function seedDirectory() {
  const [org] = await Promise.all([
    db.organisation.upsert({
      where: { code: "DEMO-ORG-001" },
      update: {},
      create: { code: "DEMO-ORG-001", name: "Demo Care Organisation (simulated)", orgType: "PROVIDER" },
    }),
  ]);

  const providers = [
    {
      code: "demo-provider-primary-01",
      legalName: "Example Primary Care Service LLC (simulated)",
      displayName: "Example Primary Care Service",
      verificationStatus: "DEMO_VERIFIED_SIMULATED",
      services: [
        { serviceCode: "PC-GENERAL", serviceName: "General primary-care consultation", careLevel: "PRIMARY_CARE", languages: "en|ar", eligibility: "Adults 18+. Walk-in and booked appointments.", location: "Central Abu Dhabi (demo location)", accessibility: "Wheelchair accessible (simulated)" },
        { serviceCode: "PC-TELEMH", serviceName: "Tele-mental-health consultation", careLevel: "TELEMH", languages: "en|ar", eligibility: "Adults 18+. Video or phone.", location: "Remote (demo)", accessibility: "Subtitles available (simulated)" },
      ],
    },
    {
      code: "demo-provider-mental-01",
      legalName: "Example Mental Health Service LLC (simulated)",
      displayName: "Example Mental Health Service",
      verificationStatus: "DEMO_VERIFIED_SIMULATED",
      services: [
        { serviceCode: "MH-SPECIALIST", serviceName: "Specialist mental-health assessment", careLevel: "SPECIALIST", languages: "en|ar", eligibility: "Adults 18+. Referral or self-request accepted for discussion.", location: "Abu Dhabi Island (demo location)", accessibility: "Step-free access (simulated)" },
        { serviceCode: "MH-TELEMH", serviceName: "Tele-mental-health session", careLevel: "TELEMH", languages: "en", eligibility: "Adults 18+. Evening slots.", location: "Remote (demo)", accessibility: "Screen-reader friendly booking (simulated)" },
      ],
    },
    {
      code: "demo-provider-expired-01",
      legalName: "Expired Verification Clinic (simulated)",
      displayName: "Expired Verification Clinic",
      verificationStatus: "EXPIRED",
      services: [
        { serviceCode: "EXP-01", serviceName: "Outdated listing example", careLevel: "SPECIALIST", languages: "en", eligibility: "Example only — must never receive referrals.", location: "Abu Dhabi (demo)", accessibility: "" },
      ],
    },
    {
      code: "demo-provider-suspended-01",
      legalName: "Suspended Listing Centre (simulated)",
      displayName: "Suspended Listing Centre",
      verificationStatus: "SUSPENDED",
      services: [
        { serviceCode: "SUS-01", serviceName: "Suspended service example", careLevel: "PRIMARY_CARE", languages: "en", eligibility: "Example only — must never receive referrals.", location: "Abu Dhabi (demo)", accessibility: "" },
      ],
    },
  ];

  const now = new Date("2026-11-08T00:00:00Z");
  for (const p of providers) {
    const existing = await db.provider.findFirst({ where: { legalName: p.legalName } });
    if (existing) continue;
    const created = await db.provider.create({
      data: {
        organisationId: org.id,
        legalName: p.legalName,
        displayName: p.displayName,
        jurisdiction: "AE-AZ",
        verificationStatus: p.verificationStatus,
        verificationScope: "SIMULATED_ONLY — no real verification performed",
        verifiedAt: p.verificationStatus === "DEMO_VERIFIED_SIMULATED" ? now : null,
        recheckDueAt: p.verificationStatus === "DEMO_VERIFIED_SIMULATED" ? new Date("2027-02-08T00:00:00Z") : now,
        sourceRef: "demo_assets/synthetic_demo_seed.json",
        demoData: true,
      },
    });
    for (const s of p.services) {
      await db.providerService.create({
        data: {
          providerId: created.id,
          serviceCode: s.serviceCode,
          serviceName: s.serviceName,
          careLevel: s.careLevel,
          languages: s.languages,
          eligibility: s.eligibility,
          accessibility: s.accessibility,
          location: s.location,
          availabilitySource: "NOT_PUBLISHED",
          status: p.verificationStatus === "EXPIRED" ? "EXPIRED" : p.verificationStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
          demoData: true,
          lastVerifiedAt: p.verificationStatus === "DEMO_VERIFIED_SIMULATED" ? now : null,
          recheckDueAt: p.verificationStatus === "DEMO_VERIFIED_SIMULATED" ? new Date("2027-02-08T00:00:00Z") : now,
        },
      });
    }
  }

  // support resources
  const resources = [
    { resourceType: "SELF_GUIDED", titleEn: "Understanding stress and sleep (demo resource)", sourceOrg: "Demo Health Information Portal (simulated)", sourceUrl: "https://example.invalid/demo/stress-sleep", eligibility: "Open to all adults.", providerServiceId: null },
    { resourceType: "COMMUNITY", titleEn: "Community wellbeing circle (demo programme)", sourceOrg: "Demo Community Association (simulated)", sourceUrl: "https://example.invalid/demo/circle", eligibility: "Adults 18+, English/Arabic sessions.", providerServiceId: null },
    { resourceType: "INFORMATION", titleEn: "Talking to your family doctor about wellbeing (demo guide)", sourceOrg: "Demo Health Information Portal (simulated)", sourceUrl: "https://example.invalid/demo/gp-guide", eligibility: "Open to all adults.", providerServiceId: null },
  ];
  for (const r of resources) {
    const existing = await db.supportResource.findFirst({ where: { titleEn: r.titleEn } });
    if (!existing) {
      await db.supportResource.create({
        data: { ...r, locale: "en", regionCode: "AE-AZ", verifiedAt: now, recheckDueAt: new Date("2027-02-08T00:00:00Z"), status: "ACTIVE", demoData: true },
      });
    }
  }
  return org;
}

async function seedSafetyConfig() {
  const rows = [
    {
      regionCode: "AE-AZ", version: 1, contactName: "Abu Dhabi Emergency (police/ambulance)", contactPhone: "999",
      contactPurpose: "EMERGENCY", isEmergency: true,
      sourceUrl: "https://www.adphc.gov.ae/en/Public-Health-Programs/Mental-Health",
      sourceOrg: "Abu Dhabi Public Health Center",
      lastVerifiedAt: new Date("2026-11-08T00:00:00Z"),
      expiresAt: new Date("2027-02-08T00:00:00Z"),
      notesEn: "For emergencies involving thoughts of harming self/others or severe disorganised behaviour: call 999 or go to the nearest emergency department.",
    },
    {
      regionCode: "AE-AZ", version: 1, contactName: "DoH mental-health support hotline (800-SAKINA)", contactPhone: "800725462",
      contactPurpose: "SUPPORT_HOTLINE", isEmergency: false,
      sourceUrl: "https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/",
      sourceOrg: "Department of Health Abu Dhabi (announced 3 March 2026)",
      lastVerifiedAt: new Date("2026-11-08T00:00:00Z"),
      expiresAt: new Date("2027-02-08T00:00:00Z"),
      notesEn: "24/7 mental-health support hotline. An additional support route — not a substitute for emergency services.",
    },
  ];
  for (const r of rows) {
    const existing = await db.safetyResourceConfig.findFirst({ where: { regionCode: r.regionCode, version: r.version, contactPurpose: r.contactPurpose } });
    if (!existing) await db.safetyResourceConfig.create({ data: r });
  }
}

async function seedUsers(org: { id: string }) {
  const users = [
    { email: "demo.individual@moriva.demo", displayName: "Demo User 01", role: "INDIVIDUAL" },
    { email: "demo.clinician@moriva.demo", displayName: "Demo Clinician 01", role: "PROFESSIONAL_SIMULATED" },
    { email: "demo.coordinator@moriva.demo", displayName: "Demo Coordinator 01", role: "PROVIDER_COORDINATOR_SIMULATED" },
    { email: "demo.ops@moriva.demo", displayName: "Demo Operations 01", role: "OPS_ADMIN_SIMULATED" },
    { email: "demo.governance@moriva.demo", displayName: "Demo Governance 01", role: "CLINICAL_GOVERNANCE_SIMULATED" },
  ];
  const created = {} as Record<string, { id: string }>;
  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) { created[u.role] = existing; continue; }
    created[u.role] = await db.user.create({
      data: {
        email: u.email,
        displayName: u.displayName,
        passwordHash: hashPassword(DEMO_PASSWORD),
        role: u.role,
        demoData: true,
        profile: { create: { locale: "en", regionCode: "AE-AZ" } },
      },
    });
  }
  // coordinator owns the demo provider org's first provider
  const provider = await db.provider.findFirst({ where: { legalName: { contains: "Example Mental Health" } } });
  if (provider && !provider.coordinatorId) {
    await db.provider.update({ where: { id: provider.id }, data: { coordinatorId: created["PROVIDER_COORDINATOR_SIMULATED"].id } });
  }
  return created;
}

async function seedFlags() {
  const flags = [
    { key: "AI_REFLECTION_ENABLED", enabled: false, config: { reason: "ADR-0005: approvals absent; fail-closed" } },
    { key: "DEMO_MODE", enabled: true, config: { note: "Synthetic data only" } },
    { key: "SMALL_CELL_THRESHOLD", enabled: true, config: { value: 5 } },
  ];
  for (const f of flags) {
    await db.featureFlag.upsert({ where: { key: f.key }, update: {}, create: { key: f.key, environment: "development", enabled: f.enabled, configJson: JSON.stringify(f.config), updatedBy: "seed" } });
  }
}

async function seedContent() {
  const blocks = [
    { contentType: "RESULT_BLOCK", title: "Screening is not diagnosis", body: "A screening result describes your own answers over a recent period. It cannot tell you whether you have a condition, and it does not replace a conversation with a qualified professional.", sourceRef: "CLINICAL_SAFETY_BOUNDARIES.md §1" },
    { contentType: "RESULT_BLOCK", title: "What this result cannot establish", body: "This result cannot explain causes, predict outcomes, or measure everything about wellbeing. It reflects only the items you answered, for the period asked about.", sourceRef: "PRD §7.4" },
    { contentType: "LEGAL", title: "Health disclaimer (prototype)", body: "MORIVA is a prototype demonstration. It is not a medical device, not a licensed healthcare provider, and not an emergency service. Nothing here is medical advice. If you need urgent help, call 999 or go to the nearest emergency department.", sourceRef: "PRD §1.4/§6.1" },
  ];
  for (const b of blocks) {
    const existing = await db.contentItem.findFirst({ where: { title: b.title } });
    if (!existing) {
      await db.contentItem.create({
        data: { ...b, locale: "en", version: 1, status: "REVIEWED", authorId: "MORIVA_BUILD_PACK", reviewerId: "NONE_DEMO", reviewDueAt: new Date("2027-02-08T00:00:00Z") },
      });
    }
  }
}

async function main() {
  await seedConsentPurposes();
  await seedInstrument();
  await seedPathway();
  const org = await seedDirectory();
  const users = await seedUsers(org);
  await seedSafetyConfig();
  await seedFlags();
  await seedContent();
  console.log(JSON.stringify({ level: "info", code: "SEED_DONE", users: Object.keys(users).length }));
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ level: "error", code: "SEED_FAILED", message: e instanceof Error ? e.message : String(e) }));
    process.exit(1);
  })
  .finally(() => db.$disconnect());
