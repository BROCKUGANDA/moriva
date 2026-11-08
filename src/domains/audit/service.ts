/**
 * audit domain — append-only audit trail for sensitive reads/mutations (PRD §3.6, §19).
 * No mutation/delete endpoints exist for audit rows. Content is redacted metadata only.
 */
import { db } from "@/lib/db";
import { log } from "@/lib/logging";

export type AuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  subjectId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  purpose?: string | null;
  outcome?: "ALLOW" | "DENY" | "ERROR";
  ipHash?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        subjectId: input.subjectId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        purpose: input.purpose ?? null,
        outcome: input.outcome ?? "ALLOW",
        ipHash: input.ipHash ?? null,
        correlationId: input.correlationId ?? null,
        metadataJson: JSON.stringify(input.metadata ?? {}),
      },
    });
  } catch (e) {
    // Audit must never break the primary flow; record the failure in logs instead.
    log.error("AUDIT_WRITE_FAILED", { action: input.action, resourceType: input.resourceType });
  }
}

/** Read helpers — access is restricted by the callers (ops/governance routes + own-history route). */
export async function listAuditForUser(userId: string, limit = 50) {
  return db.auditEvent.findMany({
    where: { OR: [{ actorId: userId }, { subjectId: userId }] },
    orderBy: { occurredAt: "desc" },
    take: Math.min(limit, 100),
    select: {
      id: true, action: true, resourceType: true, resourceId: true, outcome: true,
      occurredAt: true, purpose: true, actorRole: true,
    },
  });
}

export async function listAuditRestricted(limit = 100) {
  return db.auditEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: Math.min(limit, 200),
    select: {
      id: true, actorId: true, actorRole: true, subjectId: true, action: true,
      resourceType: true, resourceId: true, purpose: true, outcome: true, occurredAt: true,
    },
  });
}
