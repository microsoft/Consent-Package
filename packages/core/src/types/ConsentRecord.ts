export type ConsentStatus = 'granted' | 'revoked' | 'superseded';
export type ConsentMethod = 'digital_form' | 'paper_scan' | 'api_call';
export type AgeGroup = 'under13' | '13-17' | '18+';
export type ConsenterType = 'self' | 'proxy';

export interface ConsentRecord {
  readonly id: string;
  readonly version: number;
  readonly subjectId: string;
  readonly policyId: string;
  readonly status: ConsentStatus;
  readonly consentedAt: Date;
  readonly revokedAt?: Date;
  readonly consenter: {
    readonly type: ConsenterType;
    readonly userId: string;
    readonly proxyDetails?: {
      readonly relationship: string;
      readonly subjectAgeGroup: AgeGroup;
    };
  };
  readonly grantedScopes: Readonly<Record<string, { grantedAt: Date }>>;
  readonly revokedScopes?: Readonly<Record<string, { revokedAt: Date }>>;
  readonly metadata: {
    readonly consentMethod: ConsentMethod;
    readonly ipAddress?: string;
    readonly userAgent?: string;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
} 