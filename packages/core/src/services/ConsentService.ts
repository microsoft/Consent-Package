import type { ConsentRecord } from "../types/ConsentRecord.js";

export interface IConsentDataAdapter {
  createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<ConsentRecord>;
  updateConsent(
    id: string,
    updates: Partial<Omit<ConsentRecord, "id" | "createdAt">>,
    currentVersion: number
  ): Promise<ConsentRecord>;
  findConsentById(id: string): Promise<ConsentRecord | null>;
  findActiveConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;
}

export interface GrantConsentInput {
  subjectId: string;
  policyId: string;
  consenter: {
    type: "self" | "proxy";
    userId: string;
    proxyDetails?: {
      relationship: string;
      subjectAgeGroup: "under13" | "13-17" | "18+";
    };
  };
  grantedScopes: string[];
  metadata: {
    consentMethod: "digital_form" | "paper_scan" | "api_call";
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface RevokeConsentInput {
  consentId: string;
  scopesToRevoke?: string[];
  currentVersion: number;
}

export class ConsentService {
  constructor(private dataAdapter: IConsentDataAdapter) {}

  async grantConsent(input: GrantConsentInput): Promise<ConsentRecord> {
    const now = new Date();
    const grantedScopesMap = input.grantedScopes.reduce(
      (acc, scope) => ({
        ...acc,
        [scope]: { grantedAt: now },
      }),
      {} as Record<string, { grantedAt: Date }>
    );

    return this.dataAdapter.createConsent({
      subjectId: input.subjectId,
      policyId: input.policyId,
      status: "granted",
      consentedAt: now,
      consenter: input.consenter,
      grantedScopes: grantedScopesMap,
      metadata: input.metadata,
    });
  }

  async revokeConsent(input: RevokeConsentInput): Promise<ConsentRecord> {
    const now = new Date();
    const updates: Partial<ConsentRecord> = input.scopesToRevoke
      ? {
          revokedScopes: input.scopesToRevoke.reduce(
            (acc, scope) => ({
              ...acc,
              [scope]: { revokedAt: now },
            }),
            {} as Record<string, { revokedAt: Date }>
          ),
        }
      : {
          status: "revoked",
          revokedAt: now,
        };

    return this.dataAdapter.updateConsent(
      input.consentId,
      updates,
      input.currentVersion
    );
  }

  async getConsentDetails(consentId: string): Promise<ConsentRecord | null> {
    return this.dataAdapter.findConsentById(consentId);
  }

  async getSubjectConsentStatus(
    subjectId: string,
    scopes: readonly string[]
  ): Promise<Record<string, boolean>> {
    const activeConsents =
      await this.dataAdapter.findActiveConsentsBySubject(subjectId);
    return scopes.reduce(
      (acc, scope) => {
        const isGranted = activeConsents.some(
          (consent: ConsentRecord) =>
            consent.grantedScopes[scope] &&
            (!consent.revokedScopes || !consent.revokedScopes[scope])
        );
        return { ...acc, [scope]: isGranted };
      },
      {} as Record<string, boolean>
    );
  }
}
