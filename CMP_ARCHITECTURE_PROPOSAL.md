# MSR Consent - Architecture Proposal

## Research Findings Summary

1.  **Existing Landscape:** Commercial CMPs focus heavily on cookie consent (Usercentrics, Osano, etc.). Open-source options are less common, especially for *medical* data consent's complexities (granularity, proxies, audit). Relevant OSS: `Pryv.io` (privacy focus), `Kairon Consents` (patient-centric). Relevant commercial: `ConsentGrid`, `Osano` (granular features).
2.  **Gap:** Opportunity exists for a modern, OSS, developer-focused CMP for medical research using React/TS/Azure.
3.  **Key Needs:** Granular data types, proxy consent, age-specific flows, revocation/updates, auditability, extensibility.

## Proposed Architecture & Structure

A monorepo structure (`pnpm workspaces`, potentially `bun`?).

```markdown
/msr-consent-platform           
├── LICENSE                     # e.g., MIT or Apache 2.0
├── README.md                   # Overview, setup, contribution guide
├── package.json                # Monorepo root
├── docs/                       
│   ├── architecture.md         # This file & further details
│   ├── api.md                  # API endpoint definitions
│   ├── customization.md        # Extensibility guide
│   └── setup.md                # Installation/config guide
├── packages/                   
│   ├── core/                   # Platform-agnostic core logic, types, interfaces
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/          # e.g., ConsentRecord, Policy interfaces
│   │   │   ├── services/       # Business logic (ConsentService, PolicyService) - focus on pure functions where possible
│   │   │   └── errors/         # Custom error types
│   │   └── package.json
│   │
│   ├── api/                    # Backend: Azure Functions (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── functions/      # HTTP Triggers (thin wrappers)
│   │   │   ├── services/       # API-specific orchestration (uses core services)
│   │   ├── middleware/     # Composable request validation, auth hooks
│   │   └── lib/            # Shared API utilities
│   │   ├── host.json           
│   │   ├── local.settings.json.sample 
│   │   └── package.json
│   │
│   ├── ui/                     # Frontend: React/Tailwind UI library & optional demo app
│   │   ├── src/
│   │   │   ├── index.ts        # Library entry point
│   │   │   ├── components/     # Reusable: ConsentForm, ConsentViewer, etc.
│   │   │   ├── hooks/          # e.g., useConsentApi, usePolicy
│   │   │   ├── contexts/       # State management, config provider
│   │   │   ├── styles/         # Tailwind config, base styles
│   │   │   ├── lib/            # Client-side API client
│   │   │   └── app/            # Example app (mocked server?)
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── package.json
│   │
│   ├── data-adapter-interface/ # Data storage adapter interface contract
│   │   ├── src/
│   │   │   └── index.ts        # Defines IConsentDataAdapter
│   │   └── package.json
│   │
│   └── data-adapter-cosmosdb/  # Cosmos DB adapter implementation
│       ├── src/
│       │   └── index.ts        # Implements IConsentDataAdapter 
│       └── package.json
│
└── tests/                      # End-to-end / integration tests
```


*   **Separation of Concerns:** `core` contains pure business logic (data structures, validation rules, state transitions), independent of delivery mechanisms. `api` handles HTTP concerns (routing, request/response shaping, auth) and orchestrates calls to `core`.
*   **Reusability:** `core` logic can be reused by other potential consumers (CLIs, migration tools, different API frameworks) without Azure Functions or HTTP dependencies.
*   **Immutability:** Treat data structures (e.g., `ConsentRecord`) as immutable. Updates should produce new states/versions.
*   **Pure Functions:** Design `core` services and utility functions to be "pure" where practical, enhancing testability and predictability.
*   **Composition:** Utilize function composition, particularly for `api` middleware (validation, authentication, logging).

### Key Component Signatures (Conceptual)

1.  **`packages/core/types/ConsentRecord.ts`**
    ```typescript
    // Represents the state of consent for a subject regarding a specific policy
    interface ConsentRecord {
      readonly id: string; 
      readonly version: number; // For optimistic concurrency
      readonly subjectId: string; 
      readonly policyId: string; // Refers to Policy definition/version
      readonly status: 'granted' | 'revoked' | 'superseded';
      readonly consentedAt: Date;
      readonly revokedAt?: Date;
      readonly consenter: {
        readonly type: 'self' | 'proxy';
        readonly userId: string; // ID of the individual providing consent
        readonly proxyDetails?: {
          readonly relationship: string; // e.g., 'parent', 'legal_guardian'
          readonly subjectAgeGroup: 'under13' | '13-17' | '18+'; // At time of consent
        };
      };
      // Use immutable collections if practical, otherwise treat as immutable
      readonly grantedScopes: Readonly<Record<string, { grantedAt: Date }>>; // e.g., { "nutrition_log": { grantedAt: ... } }
      readonly revokedScopes?: Readonly<Record<string, { revokedAt: Date }>>;
      readonly metadata: {
        readonly consentMethod: 'digital_form' | 'paper_scan' | 'api_call'; 
        readonly ipAddress?: string; 
        readonly userAgent?: string; 
        // Other audit metadata
      };
      readonly createdAt: Date;
      readonly updatedAt: Date;
    }
    ```

2.  **`packages/data-adapter-interface/src/index.ts`**
    ```typescript
    // Contract for persisting and retrieving consent data
    interface IConsentDataAdapter {
      createConsent(data: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ConsentRecord>;
      // Use version for optimistic concurrency control during updates
      updateConsent(id: string, updates: Partial<Omit<ConsentRecord, 'id' | 'createdAt'>>, currentVersion: number): Promise<ConsentRecord>; 
      findConsentById(id: string): Promise<ConsentRecord | null>;
      findActiveConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;
      // Potentially add methods for querying consent status for specific scopes/subjects
    }
    ```

3.  **`packages/core/services/ConsentService.ts`**
    ```typescript
    // Encapsulates core business logic for consent management
    // Prefer functional style where possible, e.g., functions processing ConsentRecord
    class ConsentService {
      constructor(dataAdapter: IConsentDataAdapter /*, policyService?: IPolicyService */);
      // Input types (e.g., GrantConsentInput) defined in core/types
      grantConsent(input: GrantConsentInput): Promise<ConsentRecord>;
      revokeConsent(input: RevokeConsentInput): Promise<ConsentRecord>;
      getConsentDetails(consentId: string): Promise<ConsentRecord | null>;
      // Example: Check if specific scopes are actively granted for a subject
      getSubjectConsentStatus(subjectId: string, scopes: readonly string[]): Promise<Readonly<Record<string, boolean>>>;
    }
    ```

4.  **`packages/api/src/functions/consents-crud.ts`** (Conceptual Azure Function Structure)
    ```typescript
    // HTTP Trigger for POST /consents
    // Handles request validation, calls ConsentService.grantConsent, formats response
    async function createConsentHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;

    // HTTP Trigger for GET /consents/{id}
    async function getConsentByIdHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
    
    // HTTP Trigger for PATCH /consents/{id} (e.g., revoke)
    async function updateConsentHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;

    // HTTP Trigger for GET /subjects/{subjectId}/consents?scope=nutrition_log&scope=symptoms
    async function getConsentsBySubjectHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
    ```

5.  **`packages/ui/src/components/ConsentForm.tsx`**
    ```typescript
    interface ConsentFormProps {
      policyDetails: PolicyDetails; // Structure defined in core/types
      consentMode: 'initial' | 'update';
      userType: 'self' | 'proxy';
      subjectAgeGroup?: 'under13' | '13-17' | '18+'; // Required for proxy
      initialConsent?: ConsentRecord; // Passed for update mode
      // onSubmit likely interacts with a hook (e.g., useConsentApi) which calls the backend
      onSubmit: (grantedScopes: readonly string[]) => Promise<void>; 
      onCancel: () => void;
      // Theming/style props
    }
    function ConsentForm(props: ConsentFormProps): React.ReactElement;
    ```

### Tech Stack Choices & Rationale

*   **TypeScript:** Enforces type safety across packages.
*   **React & Tailwind:** Efficient UI development and customization.
*   **Azure Functions:** Scalable, serverless backend. Node.js runtime aligns with TS.
*   **Cosmos DB (SQL API):** Flexible NoSQL storage suitable for evolving consent schemas.
*   **Adapter Pattern:** Decouples `core` logic from specific data storage implementation (`data-adapter-interface`).
*   **Monorepo:** Centralized management, easier code/type sharing and dependency handling.

## Areas for Further Definition

*   Policy Management Details
*   Authentication & Authorization Strategy
*   Auditing Requirements & Implementation
*   Data Adapter (Cosmos DB) Specifics (Partitioning, Indexing)
*   Concrete Extensibility Points & Mechanisms
*   Detailed Error Handling and Propagation Strategy
*   Comprehensive Testing Strategy (Unit, Integration, E2E)
*   Deployment Process & Infrastructure Management (IaC?)
*   Specific Security Threat Mitigations
*   Detailed Consent Flow Logic (Age, Proxy, Revocation/Update)

## Development Approach & Timeline

This section outlines the planned development sequence, emphasizing local development with emulators and key deployment milestones aligned with the project timeline.

**Phase 1: Core Setup & Local Foundation (Corresponds to Arch & Design: Apr 21 - May 5)**

1.  **Monorepo Setup:** Initialize `pnpm` workspace, configure root `package.json`, `tsconfig.base.json`.
2.  **Package Scaffolding:** Create basic structures for `core`, `api`, `ui`, `data-adapter-interface`, `data-adapter-cosmosdb`.
3.  **Core Types & Interfaces:** Implement initial versions of `ConsentRecord`, `Policy` (stubbed), `IConsentDataAdapter` based on Arch & Design.
4.  **Local Emulation Setup:**
    *   Configure `Azurite` for local Cosmos DB emulation.
    *   Set up Azure Functions Core Tools for local `api` execution.
    *   Add `.env` / `local.settings.json.sample` for environment variables.
5.  **Basic CI:** Set up initial GitHub Actions workflow for linting, type checking, and potentially running `core` unit tests on push.
6.  **Stakeholder Review #1 (Apr 30 - May 5):** Review architecture, core types, initial setup.

**Phase 2: Core Implementation & Local Iteration (Corresponds to Core Implementation: Apr 30 - May 21)**

1.  **Data Adapter Implementation:** Build `data-adapter-cosmosdb` implementing `IConsentDataAdapter`, testing against Azurite.
2.  **Core Service Logic:** Implement `ConsentService` logic using the data adapter. Develop comprehensive unit tests.
3.  **API Endpoint Development:**
    *   Build Azure Function HTTP triggers (`api/src/functions`).
    *   Implement API-specific services (`api/src/services`) orchestrating `ConsentService`.
    *   Integrate basic request validation middleware.
    *   Test API endpoints locally using Functions Core Tools against Azurite.
4.  **UI Component Library:** Develop core React components (`ui/src/components`), hooks (`ui/src/hooks`), and contexts. Use Storybook or similar for isolated development and documentation. Implement styling (Tailwind) and basic accessibility checks.
5.  **API Integration Testing:** Add integration tests verifying `api` interaction with the emulated data adapter. Enhance CI/CD pipeline to include these tests.
6.  **Stakeholder Review #2 (May 22 - 23):** Technical review of implemented `core`, `api`, `data-adapter`, and `ui` components. Demo local functionality.

**Phase 3: Refinement, Deployment & Documentation (Corresponds to Extension & Refinement / Release Prep: May 27 - Jun 12)**

1.  **Feedback Implementation:** Address feedback from Review #2 (May 27-28).
2.  **Initial Azure Deployment:**
    *   Set up basic Azure resources (Resource Group, App Service Plan/Functions App, Cosmos DB account) - potentially using IaC.
    *   Configure CI/CD pipeline for automated deployment to a 'dev' or 'staging' environment in Azure.
    *   Verify deployed API and potentially a simple UI deployment.
3.  **Internal QA & E2E Testing:** Conduct internal QA on the deployed environment (May 27-28). Implement end-to-end tests covering key user flows (e.g., granting consent via UI -> API -> DB).
4.  **Documentation & Examples:** Create developer documentation (`docs/`), usage examples, and refine READMEs (May 27-28, Jun 10-12). Develop the simple example site (Jun 10-12).
5.  **Stakeholder Review #3 (May 29 - Jun 9):** Final review, including Microsoft Compliance checks, using the deployed environment.
6.  **Release Preparation:** Finalize documentation, prepare package structure for OSS release, transfer repository ownership if necessary (Jun 10-12). Package for release (Jun 12th).
