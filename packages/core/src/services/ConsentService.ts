import type {
  ConsentRecord,
  GrantConsentInput,
  RevokeConsentInput,
  IConsentDataAdapter,
} from "@open-source-consent/types";

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

  async findActiveConsentsBySubject(
    subjectId: string
  ): Promise<ConsentRecord[]> {
    const allConsents = await this.dataAdapter.findConsentsBySubject(subjectId);
    return allConsents.filter(
      (consent: ConsentRecord) =>
        consent.status === "granted" &&
        (!consent.revokedAt || consent.revokedAt > new Date())
    );
  }

  async getSubjectConsentStatus(
    subjectId: string,
    scopes: readonly string[]
  ): Promise<Record<string, boolean>> {
    const activeConsents = await this.findActiveConsentsBySubject(subjectId);
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
