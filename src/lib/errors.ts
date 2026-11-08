/**
 * PRD §17 error catalogue + typed ApiProblem contract (Phase 11.1).
 * Client-facing messages never contain stack traces, SQL, vendor bodies, internal IDs
 * or clinical interpretation.
 */
export type ApiProblem = {
  code: string;
  message: string;
  requestId: string;
  retryable: boolean;
  details?: Record<string, string | number | boolean>;
};

export const ERROR_CODES = {
  AUTH_REQUIRED: { http: 401, retryable: false, message: "Please sign in to continue." },
  AUTH_FORBIDDEN: { http: 403, retryable: false, message: "You don't have access to this information." },
  CONSENT_REQUIRED: { http: 403, retryable: false, message: "Your consent is needed before this information can be shared." },
  CONSENT_REVOKED: { http: 403, retryable: false, message: "This sharing permission has been withdrawn." },
  CONSENT_EXPIRED: { http: 403, retryable: false, message: "This sharing permission has expired. Review and approve it again before information is shared." },
  INSTRUMENT_NOT_APPROVED: { http: 409, retryable: false, message: "This questionnaire is not available for scored use. You can explore general support options." },
  INSTRUMENT_VERSION_EXPIRED: { http: 409, retryable: false, message: "This questionnaire version has been retired. Please start again with the current version." },
  ASSESSMENT_INCOMPLETE: { http: 422, retryable: true, message: "There isn't enough information to calculate this assessment. You can complete the missing items or explore general support options." },
  SCORING_CONFIG_INVALID: { http: 500, retryable: false, message: "This result cannot be calculated right now. Your answers have been saved." },
  URGENT_SUPPORT_TRIGGERED: { http: 200, retryable: false, message: "Urgent support guidance is being shown now." },
  PATHWAY_UNAVAILABLE: { http: 503, retryable: true, message: "Personalised options are temporarily unavailable. Here are general support options and urgent help." },
  PROVIDER_UNVERIFIED: { http: 409, retryable: false, message: "This provider isn't eligible to receive referrals right now." },
  PROVIDER_SERVICE_EXPIRED: { http: 409, retryable: false, message: "This service is being re-verified and can't receive new referrals." },
  REFERRAL_DUPLICATE: { http: 409, retryable: false, message: "A referral with this reference already exists." },
  REFERRAL_STATE_CONFLICT: { http: 409, retryable: false, message: "This referral was updated elsewhere. Refresh to see its current status." },
  REFERRAL_DELIVERY_UNKNOWN: { http: 202, retryable: true, message: "We can't confirm that the referral was sent yet. We're checking its status. Please don't submit it again." },
  REFERRAL_DELIVERY_FAILED: { http: 503, retryable: true, message: "The referral could not be sent. You can safely try again." },
  PROVIDER_UNAVAILABLE: { http: 503, retryable: true, message: "Provider information is temporarily unavailable. You can try again or view other verified options." },
  AI_DISABLED: { http: 403, retryable: false, message: "The reflection assistant is unavailable. Your assessment and support options are still available." },
  AI_PROVIDER_TIMEOUT: { http: 504, retryable: true, message: "The reflection assistant timed out. Your assessment and support options are still available." },
  AI_SAFETY_BLOCK: { http: 200, retryable: false, message: "Urgent support guidance is being shown now." },
  RATE_LIMITED: { http: 429, retryable: true, message: "Too many requests. Please try again in a moment." },
  VALIDATION_FAILED: { http: 422, retryable: true, message: "Please check the highlighted fields and try again." },
  RESOURCE_NOT_FOUND: { http: 404, retryable: false, message: "We couldn't find that page or record." },
  REQUEST_IDEMPOTENCY_CONFLICT: { http: 409, retryable: false, message: "This request key was already used with different content." },
  DEPENDENCY_UNAVAILABLE: { http: 503, retryable: true, message: "A service is temporarily unavailable. Please try again shortly." },
  INTERNAL_ERROR: { http: 500, retryable: true, message: "Something went wrong on our side. Your saved information has not been changed." },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class MorivaError extends Error {
  constructor(
    public code: ErrorCode,
    public opts: { details?: Record<string, string | number | boolean>; httpOverride?: number; messageOverride?: string } = {}
  ) {
    super(opts.messageOverride ?? ERROR_CODES[code].message);
    this.name = "MorivaError";
  }
  get http(): number {
    return this.opts.httpOverride ?? ERROR_CODES[this.code].http;
  }
  get retryable(): boolean {
    return ERROR_CODES[this.code].retryable;
  }
}

export function toApiProblem(err: unknown, requestId: string): { status: number; body: ApiProblem } {
  if (err instanceof MorivaError) {
    return {
      status: err.http,
      body: {
        code: err.code,
        message: err.message,
        requestId,
        retryable: err.retryable,
        ...(err.opts.details ? { details: err.opts.details } : {}),
      },
    };
  }
  // Unknown errors: generic safe message; internals are logged, never returned.
  return {
    status: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: ERROR_CODES.INTERNAL_ERROR.message,
      requestId,
      retryable: ERROR_CODES.INTERNAL_ERROR.retryable,
    },
  };
}
