# Architecture (WIP)

## Background

1.  **Existing Landscape:** Commercial CMPs focus heavily on cookie consent (Usercentrics, Osano, etc.). Open-source options are less common, especially for *medical* data consent (granularity, proxies, audit). Relevant: `Pryv.io` , `Kairon Consents` . Relevant commercial: `ConsentGrid`, `Osano` (granular features).
2.  **Gap:** Opportunity exists for an OSS, developer-focused CMP for medical research using React/TS/Azure.
3.  **Key Needs:** Granular data types, proxy consent, age-specific flows, revocation/updates, auditability, extensibility.

## Proposed Architecture & Structure

A monorepo structure (`pnpm workspaces`, potentially `bun`?).

```markdown
/msr-consent-platform           
├── LICENSE                     # MIT
├── README.md                   # Overview, setup, contribution guide
├── package.json                # Monorepo root
├── docs/                       
│   ├── architecture.md         # A finalized version of this file & further details
│   ├── api.md                  # API endpoint definitions
│   ├── customization.md        # Extensibility guide
│   └── setup.md                # Installation/config guide
├── packages/                   
│   ├── core/                   # Platform-agnostic core logic, types, interfaces
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/          # e.g., ConsentRecord, Policy interfaces
│   │   │   ├── services/       # Business logic (ConsentService, PolicyService)
│   │   │   └── errors/ 
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
│   │   │   ├── index.ts
│   │   │   ├── components/
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
    // Definition moved to data.md
    interface ConsentRecord { ... }
    ```

2.  **`packages/data-adapter-interface/src/index.ts`**
    ```typescript
    // Contract for persisting and retrieving consent data
    // Definition moved to data.md
    interface IConsentDataAdapter { ... }
    ```

3.  **`packages/core/services/ConsentService.ts`**
    ```typescript
    // Encapsulates core business logic for consent management
    class ConsentService {
      constructor(dataAdapter: IConsentDataAdapter /*, policyService?: IPolicyService */);
      // Input types (e.g., GrantConsentInput) defined in core/types and documented in data.md
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
      policyDetails: PolicyDetails; // Structure defined in core/types and documented in data.md
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
