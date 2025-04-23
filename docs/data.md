# Data Structures

## `ConsentRecord`

Represents the state of consent for a specific subject regarding a specific policy version. This is the primary record stored and audited.

```typescript
// Found in: packages/core/types/ConsentRecord.ts

interface ConsentRecord {
  readonly id: string; // Unique identifier for the consent record
  readonly version: number; // Version number for optimistic concurrency control and audit trail
  readonly subjectId: string; // Identifier for the individual whose data is concerned
  readonly policyId: string; // Identifier for the specific policy version this consent applies to
  readonly status: 'granted' | 'revoked' | 'superseded'; // Current status of the consent
  readonly consentedAt: Date; // Timestamp when the consent was initially granted
  readonly revokedAt?: Date; // Timestamp when the consent was revoked, if applicable
  readonly consenter: {
    readonly type: 'self' | 'proxy'; // Indicates if consent was given by the subject or a proxy
    readonly userId: string; // Identifier of the individual *providing* the consent (subject or proxy)
    readonly proxyDetails?: {
      readonly relationship: string; // e.g., 'parent', 'legal_guardian', 'researcher'
      readonly subjectAgeGroup: 'under13' | '13-17' | '18+'; // Age group of the subject, relevant for proxy rules
    };
  };
  // Record of specific data scopes/categories granted within this consent instance
  // Uses immutable collections if practical, otherwise treat as immutable
  readonly grantedScopes: Readonly<Record<string, { grantedAt: Date }>>; // e.g., { "nutrition_log": { grantedAt: ... }, "activity_data": { grantedAt: ... } }
  // Record of specific data scopes/categories explicitly revoked within this consent instance
  readonly revokedScopes?: Readonly<Record<string, { revokedAt: Date }>>; // e.g., { "activity_data": { revokedAt: ... } }
  // Metadata is useful for non-repudiation, can be optional
  readonly metadata: {
    readonly ipAddress?: string; // IP address associated with digital consent capture
    readonly userAgent?: string; // User agent string associated with digital consent capture
  };
  readonly createdAt: Date; // Timestamp when the record was created in the system
  readonly updatedAt: Date; // Timestamp when the record was last updated
}
```

## `Policy` / `PolicyDetails`

Represents a specific version of a consent policy document or agreement presented to the user. `PolicyDetails` is a subset or processed version of the full `Policy` structure, tailored for display or specific actions.

```typescript
// Conceptual structure

interface Policy {
  readonly id: string; // Unique identifier for this specific policy *version*
  readonly policyGroupId: string; // Identifier linking different versions of the same logical policy
  readonly version: number; // Version number of this policy document
  readonly effectiveDate: Date; // Date when this policy version becomes active
  readonly title: string; // Human-readable title of the policy
  readonly description: string; // Brief summary or purpose of the policy
  readonly contentUrl?: string; // Link to the full policy document (e.g., PDF, HTML)
  readonly contentText?: string; // Inline text of the policy (alternative or supplement to URL)
  // Defines the data scopes/categories covered by this policy
  readonly availableScopes: Readonly<Array<{
    readonly key: string; // Unique machine-readable key (e.g., 'nutrition_log', 'genomic_data')
    readonly name: string; // Human-readable name (e.g., 'Nutrition Logs')
    readonly description: string; // Explanation of what this scope entails
    readonly required?: boolean; // Whether consent for this scope is mandatory for the policy
  }>>;
  readonly jurisdiction?: string; // e.g., 'EU', 'USA', 'CA-QC' - may influence required elements
  readonly requiresProxyForMinors?: boolean; // Flag indicating if proxy consent is needed for specific age groups
  readonly status: 'draft' | 'active' | 'archived'; // Lifecycle status of the policy version
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Likely a projection or subset of the full Policy, possibly used by UI components
// Conceptual structure, potentially in: packages/core/types/Policy.ts or packages/ui/src/types.ts
interface PolicyDetails extends Pick<Policy, 'id' | 'version' | 'title' | 'description' | 'availableScopes'> {
  // May include additional processed information for display
  // e.g., pre-filtered required scopes
}

```

## `IConsentDataAdapter`

Defines the contract (interface) for how consent data is persisted and retrieved. Implementations (like `data-adapter-cosmosdb`) will conform to this interface.

```typescript
// Found in: packages/data-adapter-interface/src/index.ts

interface IConsentDataAdapter {
  // Creates a new consent record
  createConsent(data: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ConsentRecord>;

  // Updates an existing consent record, using version for optimistic concurrency
  updateConsent(id: string, updates: Partial<Omit<ConsentRecord, 'id' | 'createdAt'>>, currentVersion: number): Promise<ConsentRecord>;

  // Retrieves a specific consent record by its unique ID
  findConsentById(id: string): Promise<ConsentRecord | null>;

  // Finds all currently active consent records for a given subject ID
  findActiveConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;

  // Potentially add methods for more specific queries, e.g.:
  // findConsentByPolicyAndSubject(policyId: string, subjectId: string): Promise<ConsentRecord | null>;
  // findConsentsWithScope(scopeKey: string, subjectId?: string): Promise<ConsentRecord[]>;
  // etc.
}
```

## `GrantConsentInput`

Represents the necessary information required by the `ConsentService` to grant consent.

```typescript
// Conceptual structure, likely found in: packages/core/types/inputs.ts

interface GrantConsentInput {
  readonly subjectId: string;
  readonly policyId: string; // The specific policy version being consented to
  readonly consenter: {
    readonly type: 'self' | 'proxy';
    readonly userId: string;
    readonly proxyDetails?: {
      readonly relationship: string;
      readonly subjectAgeGroup: 'under13' | '13-17' | '18+';
    };
  };
  readonly grantedScopes: readonly string[]; // Array of scope keys being granted
  readonly metadata: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    // Other relevant metadata for this specific grant action
  };
}
```

## `RevokeConsentInput`

Represents the necessary information required by the `ConsentService` to revoke consent. This could target an entire `ConsentRecord` or specific scopes within it.

```typescript

interface RevokeConsentInput {
  readonly consentRecordId: string; // The ID of the ConsentRecord to modify
  readonly reason: string; // Optional reason for revocation for audit purposes
  readonly revokerUserId: string; // ID of the user performing the revocation
  // Optionally, specify specific scopes to revoke, otherwise the whole record is revoked
  readonly scopesToRevoke?: readonly string[];
  readonly metadata: { // Metadata related to the revocation action
    readonly ipAddress?: string;
    readonly userAgent?: string;
  };
}
``` 