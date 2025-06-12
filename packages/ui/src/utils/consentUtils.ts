// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { ConsentRecord, PolicyScope } from '@open-source-consent/types';

/**
 * Deserializes date strings within a raw consent object into Date objects.
 * Handles top-level dates and nested dates within grantedScopes and revokedScopes.
 */
export const deserializeConsentRecord = (rawConsent: any): ConsentRecord => {
  const deserialized: any = { ...rawConsent };

  if (rawConsent.consentedAt) {
    deserialized.consentedAt = new Date(rawConsent.consentedAt);
  }
  if (rawConsent.createdAt) {
    deserialized.createdAt = new Date(rawConsent.createdAt);
  }
  if (rawConsent.updatedAt) {
    deserialized.updatedAt = new Date(rawConsent.updatedAt);
  }
  if (rawConsent.revokedAt) {
    deserialized.revokedAt = new Date(rawConsent.revokedAt);
  }

  if (rawConsent.grantedScopes) {
    const mutableGrantedScopes: Record<
      string,
      PolicyScope & { grantedAt: Date }
    > = {};
    for (const [key, val] of Object.entries(rawConsent.grantedScopes)) {
      const scopeData = val as any;

      // Ensure we have all required PolicyScope properties
      const policyScope: PolicyScope = {
        key: scopeData.key || key,
        name: scopeData.name || key,
        description: scopeData.description || '',
        required: scopeData.required || false,
      };

      mutableGrantedScopes[key] = {
        ...policyScope,
        grantedAt: new Date(scopeData.grantedAt),
      };
    }
    deserialized.grantedScopes = mutableGrantedScopes;
  }

  if (rawConsent.revokedScopes) {
    const mutableRevokedScopes: Record<
      string,
      PolicyScope & { revokedAt: Date }
    > = {};
    for (const [key, val] of Object.entries(rawConsent.revokedScopes)) {
      const scopeData = val as any;

      // Ensure we have all required PolicyScope properties
      const policyScope: PolicyScope = {
        key: scopeData.key || key,
        name: scopeData.name || key,
        description: scopeData.description || '',
        required: scopeData.required || false,
      };

      mutableRevokedScopes[key] = {
        ...policyScope,
        revokedAt: new Date(scopeData.revokedAt),
      };
    }
    deserialized.revokedScopes = mutableRevokedScopes;
  }

  return deserialized as ConsentRecord;
};
