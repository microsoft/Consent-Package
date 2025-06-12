// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

export interface CreateConsentInput {
  subjectId: string;
  policyId: string;
  dateOfBirth?: Date;
  consenter: {
    type: 'self' | 'proxy';
    userId: string;
    proxyDetails?: {
      relationship: string;
      subjectAgeGroup: 'under13' | '13-17' | '18+';
    };
  };
  grantedScopes: string[];
  revokedScopes?: string[];
  metadata: {
    consentMethod: 'digital_form';
    ipAddress?: string;
    userAgent?: string;
  };
}
