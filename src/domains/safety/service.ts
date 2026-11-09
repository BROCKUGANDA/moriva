/**
 * safety domain — region-configured urgent-help content (PRD §10, Phase 7).
 * Help Now must render even if the database, AI or provider services are unavailable:
 * the BUNDLED_FALLBACK below is the offline-safe source of record (verified 8 Nov 2026
 * from the build pack reference register). Never invent replacement numbers.
 */
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { log } from "@/lib/logging";

export type SafetyContact = {
  contactName: string;
  contactPhone: string; // digits for tel:
  displayPhone: string; // human-readable
  purpose: "EMERGENCY" | "SUPPORT_HOTLINE";
  isEmergency: boolean;
  sourceOrg: string;
  sourceUrl: string;
  lastVerifiedAt: string; // ISO
  expiresAt: string | null;
  notesEn: string;
  configExpired: boolean;
};

export type SafetyConfigResult = {
  regionCode: string;
  contacts: SafetyContact[];
  source: "database" | "bundled-fallback";
  demoMode: boolean;
};

export const SUPPORTED_REGIONS = [
  { code: "AE-AZ", label: "Abu Dhabi, UAE" },
] as const;

/**
 * Bundled fallback — the offline-safe copy. Mirrors SafetyResourceConfig seed values.
 * Last verified 2026-11-08 from:
 *  - https://www.adphc.gov.ae/en/Public-Health-Programs/Mental-Health (call 999 / nearest ED)
 *  - https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/
 */
export const BUNDLED_FALLBACK: SafetyContact[] = [
  {
    contactName: "Abu Dhabi Emergency (police/ambulance)",
    contactPhone: "999",
    displayPhone: "999",
    purpose: "EMERGENCY",
    isEmergency: true,
    sourceOrg: "Abu Dhabi Public Health Center",
    sourceUrl: "https://www.adphc.gov.ae/en/Public-Health-Programs/Mental-Health",
    lastVerifiedAt: "2026-11-08T00:00:00.000Z",
    expiresAt: "2027-02-08T00:00:00.000Z",
    notesEn:
      "For emergencies involving thoughts of harming self/others or severe disorganised behaviour: call 999 or go to the nearest emergency department.",
    configExpired: false,
  },
  {
    contactName: "DoH mental-health support hotline (800-SAKINA)",
    contactPhone: "800725462",
    displayPhone: "800-SAKINA / 800-725462",
    purpose: "SUPPORT_HOTLINE",
    isEmergency: false,
    sourceOrg: "Department of Health Abu Dhabi (announced 3 March 2026)",
    sourceUrl:
      "https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/",
    lastVerifiedAt: "2026-11-08T00:00:00.000Z",
    expiresAt: "2027-02-08T00:00:00.000Z",
    notesEn: "24/7 mental-health support hotline. An additional support route — not a substitute for emergency services.",
    configExpired: false,
  },
];

export async function getSafetyConfig(regionCode = "AE-AZ"): Promise<SafetyConfigResult> {
  try {
    const rows = await db.safetyResourceConfig.findMany({
      where: { regionCode, status: "ACTIVE" },
      orderBy: [{ version: "desc" }, { isEmergency: "desc" }],
    });
    // take the newest version per purpose
    const byPurpose = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      if (!byPurpose.has(r.contactPurpose)) byPurpose.set(r.contactPurpose, r);
    }
    if (byPurpose.size === 0) return bundled(regionCode);
    const now = Date.now();
    const contacts: SafetyContact[] = Array.from(byPurpose.values()).map((r) => ({
      contactName: r.contactName,
      contactPhone: r.contactPhone,
      displayPhone: r.contactPhone === "999" ? "999" : r.contactPhone === "800725462" ? "800-SAKINA / 800-725462" : r.contactPhone,
      purpose: r.contactPurpose === "EMERGENCY" ? "EMERGENCY" : "SUPPORT_HOTLINE",
      isEmergency: r.isEmergency,
      sourceOrg: r.sourceOrg,
      sourceUrl: r.sourceUrl,
      lastVerifiedAt: r.lastVerifiedAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      notesEn: r.notesEn,
      configExpired: r.expiresAt ? r.expiresAt.getTime() < now : false,
    }));
    return { regionCode, contacts, source: "database", demoMode: false };
  } catch (e) {
    // DB unavailable → offline-safe fallback (fail-safe behaviour, PRD §10.4)
    log.error("SAFETY_CONFIG_FALLBACK", { regionCode });
    return bundled(regionCode);
  }
}

function bundled(regionCode: string): SafetyConfigResult {
  return {
    regionCode,
    contacts: BUNDLED_FALLBACK.map((c) => ({ ...c })),
    source: "bundled-fallback",
    demoMode: false,
  };
}

/**
 * Record a minimum-necessary safety event (no free-text). Restricted access.
 * Not an emergency dispatch API — nothing is sent to any responder.
 */
export async function recordSafetyEvent(input: {
  subjectUserId: string | null;
  sourceType: "HELP_NOW_SELECTION" | "ASSESSMENT_RISK_ITEM" | "STAFF_ACTIVATION";
  triggerCode: string;
  regionCode: string;
  sessionId?: string | null;
  itemId?: string | null;
}) {
  const active = await db.safetyResourceConfig
    .findFirst({ where: { regionCode: input.regionCode, contactPurpose: "EMERGENCY", status: "ACTIVE" }, orderBy: { version: "desc" } })
    .catch(() => null);
  const sessionId = input.sessionId ?? null;
  const itemId = input.itemId ?? null;
  if (sessionId && itemId) {
    const prior = await db.safetyEvent.findUnique({
      where: { sessionId_itemId_triggerCode: { sessionId, itemId, triggerCode: input.triggerCode } },
    }).catch(() => null);
    if (prior) return prior;
  }
  try {
    return await db.safetyEvent.create({
      data: {
        subjectUserId: input.subjectUserId,
        sourceType: input.sourceType,
        triggerCode: input.triggerCode,
        configVersion: active?.version ?? 1,
        regionCode: input.regionCode,
        eventStatus: "OPEN",
        sessionId,
        itemId,
      },
    });
  } catch {
    if (sessionId && itemId) {
      const raced = await db.safetyEvent.findUnique({
        where: { sessionId_itemId_triggerCode: { sessionId, itemId, triggerCode: input.triggerCode } },
      }).catch(() => null);
      if (raced) return raced;
    }
    throw new MorivaError("DEPENDENCY_UNAVAILABLE");
  }
}
