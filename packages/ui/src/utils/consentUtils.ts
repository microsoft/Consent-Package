import type { ConsentRecord } from "@open-source-consent/types";

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
    const mutableGrantedScopes: Record<string, { grantedAt: Date }> = {};
    for (const [key, val] of Object.entries(
      rawConsent.grantedScopes as Record<string, { grantedAt: string }>
    )) {
      mutableGrantedScopes[key] = {
        ...(val as object), // Spread other potential properties
        grantedAt: new Date((val as { grantedAt: string }).grantedAt),
      };
    }
    deserialized.grantedScopes = mutableGrantedScopes;
  }

  if (rawConsent.revokedScopes) {
    const mutableRevokedScopes: Record<string, { revokedAt: Date }> = {};
    for (const [key, val] of Object.entries(
      rawConsent.revokedScopes as Record<string, { revokedAt: string }>
    )) {
      mutableRevokedScopes[key] = {
        ...(val as object), // Spread other potential properties
        revokedAt: new Date((val as { revokedAt: string }).revokedAt),
      };
    }
    deserialized.revokedScopes = mutableRevokedScopes;
  }

  return deserialized as ConsentRecord;
};
