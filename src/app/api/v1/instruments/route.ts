import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { getActiveInstrument } from "@/domains/assessment/service";

export const GET = withApi({ rate: "read" })(async ({ requestId }) => {
  await requireUser();
  const active = await getActiveInstrument();
  if (!active) return jsonOk({ instruments: [] }, requestId);
  return jsonOk(
    {
      instruments: [
        {
          id: active.instrument.id,
          code: active.instrument.code,
          displayName: active.instrument.displayName,
          ownerSource: active.instrument.ownerSource,
          construct: active.instrument.construct,
          intendedPopulation: active.instrument.intendedPopulation,
          status: active.instrument.status,
          simulationOnly: active.instrument.status === "SIMULATION_ONLY",
          version: {
            id: active.version.id,
            version: active.version.version,
            locale: active.version.locale,
            timeframe: active.version.timeframe,
            licenceStatus: active.version.licenceStatus,
            validityNotes: active.version.validityNotes,
            limitationsEn: active.version.limitationsEn,
            scoringVersion: active.version.scoringVersion,
            clinicalApprover: active.version.clinicalApprover,
            itemCount: active.items.length,
            estimatedMinutes: 3,
          },
        },
      ],
    }, requestId
  );
});
