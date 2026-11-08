/**
 * Unit tests — referral state machine (PRD §14 vectors): every legal transition,
 * illegal jumps, and the no-evidence shortcut prevention.
 */
import { describe, it, expect } from "vitest";
import { canTransition, TRANSITIONS, REFERRAL_STATES, type ReferralState } from "@/domains/referrals/service";

describe("referral transition map", () => {
  it("happy path: DRAFT → … → CLOSED", () => {
    const path: ReferralState[] = [
      "DRAFT", "AWAITING_USER_CONSENT", "READY_TO_SEND", "PENDING_PROVIDER_ACKNOWLEDGEMENT",
      "ACKNOWLEDGED", "APPOINTMENT_SCHEDULED", "CONTACT_CONFIRMED", "FOLLOW_UP_DUE", "FOLLOW_UP_COMPLETED", "CLOSED",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1]), `${path[i]} → ${path[i + 1]}`).toBe(true);
    }
  });

  it("acknowledgement branches", () => {
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "ACKNOWLEDGED")).toBe(true);
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "NEEDS_INFORMATION")).toBe(true);
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "DECLINED")).toBe(true);
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "PROVIDER_UNAVAILABLE")).toBe(true);
    expect(canTransition("NEEDS_INFORMATION", "ACKNOWLEDGED")).toBe(true);
    expect(canTransition("ACKNOWLEDGED", "APPOINTMENT_OFFERED")).toBe(true);
    expect(canTransition("APPOINTMENT_OFFERED", "APPOINTMENT_SCHEDULED")).toBe(true);
  });

  it("forbids PENDING → FOLLOW_UP_COMPLETED without evidence (PRD §14.2)", () => {
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "FOLLOW_UP_COMPLETED")).toBe(false);
    expect(canTransition("ACKNOWLEDGED", "FOLLOW_UP_COMPLETED")).toBe(false);
    expect(canTransition("CONTACT_CONFIRMED", "FOLLOW_UP_COMPLETED")).toBe(false); // must pass through FOLLOW_UP_DUE
  });

  it("forbids skipping the consent gate", () => {
    expect(canTransition("DRAFT", "PENDING_PROVIDER_ACKNOWLEDGEMENT")).toBe(false);
    expect(canTransition("AWAITING_USER_CONSENT", "ACKNOWLEDGED")).toBe(false);
  });

  it("terminal states have no outgoing transitions", () => {
    for (const s of ["CANCELLED_BY_USER", "EXPIRED", "WITHDRAWN_CONSENT", "CLOSED"] as ReferralState[]) {
      expect((TRANSITIONS[s] ?? []).length, s).toBe(0);
    }
  });

  it("consent withdrawal path exists from pre-send states", () => {
    expect(canTransition("AWAITING_USER_CONSENT", "WITHDRAWN_CONSENT")).toBe(true);
    expect(canTransition("READY_TO_SEND", "WITHDRAWN_CONSENT")).toBe(true);
    expect(canTransition("PENDING_PROVIDER_ACKNOWLEDGEMENT", "WITHDRAWN_CONSENT")).toBe(true);
  });

  it("delivery failure can retry to READY_TO_SEND, and every state appears in the map", () => {
    expect(canTransition("DELIVERY_FAILED", "READY_TO_SEND")).toBe(true);
    for (const s of REFERRAL_STATES) {
      expect(Array.isArray(TRANSITIONS[s]), s).toBe(true);
    }
  });
});
