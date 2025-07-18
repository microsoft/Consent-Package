// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { PolicyScope } from './Policy.type.js';

export type ConsentStatus = 'granted' | 'revoked' | 'superseded';
export type ConsentMethod = 'digital_form' | undefined;
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
  readonly dateOfBirth?: Date;
  readonly consenter: {
    readonly type: ConsenterType;
    readonly userId: string;
    readonly proxyDetails?: {
      readonly relationship: string;
      readonly subjectAgeGroup: AgeGroup;
    };
  };
  readonly grantedScopes: Readonly<
    Record<string, PolicyScope & { grantedAt: Date }>
  >;
  readonly revokedScopes?: Readonly<
    Record<string, PolicyScope & { revokedAt: Date }>
  >;
  readonly metadata: {
    readonly consentMethod: ConsentMethod;
    readonly ipAddress?: string;
    readonly userAgent?: string;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
