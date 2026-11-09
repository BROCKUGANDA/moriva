import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { assertReferrableService } from "@/domains/directory/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  providerServiceId: z.string().min(1),
  assessmentResultId: z.string().nullable().optional(),
  sharedFields: z.array(z.enum(["FIRST_NAME", "REFERRAL_REASON", "ASSESSMENT_SUMMARY", "CONTACT_DETAILS"])).min(1),
  purposeSummary: z.string().min(5).max(300),
});

const FIELD_DESCRIPTIONS: Record<string, string> = {
  FIRST_NAME: "Your display name (first name only as shown)",
  CONTACT_DETAILS: "Your email address, so the provider can reach you",
  REFERRAL_REASON: "The purpose summary you wrote for this referral",
  ASSESSMENT_SUMMARY: "Your result summary — the interpretation title and which questionnaire version produced it (not your individual answers)",
};

/**
 * POST /api/v1/referrals/preview — exact share preview before consent capture (FR-CN-005).
 * Shows exactly what will be shared, with whom, retention and consent scope. No writes.
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const service = await assertReferrableService(parsed.data.providerServiceId);

  let assessmentLine: string | null = null;
  if (parsed.data.assessmentResultId) {
    const result = await db.assessmentResult.findUnique({
      where: { id: parsed.data.assessmentResultId },
      include: { session: { include: { instrumentVersion: { include: { instrument: true } } } } },
    });
    if (!result || result.session.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
    assessmentLine = `${result.session.instrumentVersion.instrument.displayName} v${result.session.instrumentVersion.version} — result code ${result.interpretationCode}`;
  }

  const fields = parsed.data.sharedFields.map((f) => ({
    code: f,
    description: FIELD_DESCRIPTIONS[f] ?? f,
    value:
      f === "FIRST_NAME" ? user.displayName.split(" ")[0]
      : f === "CONTACT_DETAILS" ? user.email
      : f === "REFERRAL_REASON" ? parsed.data.purposeSummary
      : f === "ASSESSMENT_SUMMARY" ? assessmentLine
      : null,
  }));

  return jsonOk(
    {
      preview: {
        recipient: {
          providerId: service.providerId,
          providerDisplayName: service.provider.displayName,
          providerLegalName: service.provider.legalName,
          verificationStatus: service.provider.verificationStatus,
          demoData: service.provider.demoData,
          serviceName: service.serviceName,
          serviceLocation: service.location,
        },
        fields,
        purpose: parsed.data.purposeSummary,
        dataCategories: ["CONTACT_DETAILS", "REFERRAL_REASON", ...(parsed.data.sharedFields.includes("ASSESSMENT_SUMMARY") ? ["ASSESSMENT_SUMMARY"] : [])],
        retentionNote: "The provider retains referral information per their own professional record-keeping obligations. MORIVA keeps an audit record that a referral was made and its status — not a copy of the shared fields.",
        consentExpiryNote: "This consent covers this referral to this provider only. A different provider or additional fields require new consent.",
        simulated: service.provider.demoData,
      },
    }, requestId
  );
});
