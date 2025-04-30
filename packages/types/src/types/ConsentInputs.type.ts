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
