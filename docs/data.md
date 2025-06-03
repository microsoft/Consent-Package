# Data Structures

## NOTE

As of 2025-05-22, This doc is now stale. Updates coming before 2025-05-28! Refer to the types package for the latest definitions.

## `ConsentRecord`

Represents the state of consent for a specific subject regarding a specific policy version. This is the primary record stored and audited.

```typescript

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
    readonly consentMethod: 'digital_form' | undefined;
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

interface Policy {
  readonly id: string; // Unique identifier for this specific policy *version*
  readonly policyGroupId: string; // Identifier linking different versions of the same logical policy
  readonly version: number; // Version number of this policy document
  readonly effectiveDate: Date; // Date when this policy version becomes active
  readonly contentSections: ReadonlyArray<{ // Collection of distinct content sections
    readonly title: string; // Section title
    readonly description: string; // Section description
    readonly content: string; // Rich text or HTML content for this section. Sanitized by the API.
  }>;
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
interface PolicyDetails extends Pick<Policy, 'id' | 'version' | 'contentSections' | 'availableScopes'> {
  // May include additional processed information for display
  // e.g., pre-filtered required scopes
}

```

## `IConsentDataAdapter`

Defines the contract (interface) for how consent data is persisted and retrieved. Implementations (like `data-adapter-cosmosdb`) will conform to this interface.

```typescript

interface IConsentDataAdapter {
  // Creates a new consent record
  createConsent(data: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsentRecord>;

  // Updates the status of an existing consent record, using version for optimistic concurrency
  updateConsentStatus(id: string, status: ConsentRecord['status'], expectedVersion: number): Promise<ConsentRecord>;

  // Retrieves a specific consent record by its unique ID
  findConsentById(id: string): Promise<ConsentRecord | null>;

  // Finds all consent records for a given subject ID
  findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;

  // Finds the latest consent record for a given subject ID and policy ID
  findLatestConsentBySubjectAndPolicy(subjectId: string, policyId: string): Promise<ConsentRecord | null>;

  // Finds all versions of consent records for a given subject ID and policy ID
  findAllConsentVersionsBySubjectAndPolicy(subjectId: string, policyId: string): Promise<ConsentRecord[]>;

  // Retrieves all consent records
  getAllConsents(): Promise<ConsentRecord[]>;
}
```

## `CreateConsentInput`

Represents the necessary information required by the `ConsentService` to grant consent.

```typescript

interface CreateConsentInput {
  subjectId: string;
  policyId: string; // The specific policy version being consented to
  consenter: {
    type: 'self' | 'proxy';
    userId: string;
    proxyDetails?: {
      relationship: string;
      subjectAgeGroup: 'under13' | '13-17' | '18+';
    };
  };
  grantedScopes: string[]; // Array of scope keys being granted
  metadata: {
    consentMethod: 'digital_form'; // Note: 'undefined' is not allowed by current type
    ipAddress?: string;
    userAgent?: string;
    // Other relevant metadata for this specific grant action
  };
}
```

### Example App Content Considerations (Common rule informed consent)

- Research purposes
- Expected duration of the study
- Research procedures
- Risks and benefits
- Confidentiality of records
- Compensation
- Contact Information
