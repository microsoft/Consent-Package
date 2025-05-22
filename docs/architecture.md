# Architecture (WIP)

## NOTE

As of 2025-05-22, This doc is now stale. Updates coming before 2025-05-28!

## Background

1.  **Existing Landscape:** Commercial Consent Management Platforms (CMPs) focus heavily on cookie consent (Usercentrics, Osano, Segment Consent Manager, etc.). Open-source options are less common, especially for *medical research* data consent (granularity, proxies, audit) where no mature Open Source Software (OSS) solutions were found. Relevant: `Pryv.io` , `Kairon Consents`. Relevant commercial: `ConsentGrid`, `Osano`.
2.  **Gap:** Opportunity exists for an OSS, developer-focused CMP for medical research using Microsoft tools.
3.  **Key Needs:** Granular data types, proxy consent, age-specific flows, revocation/updates, auditability, extensibility.

## Proposed Architecture & Structure

A monorepo structure (`pnpm workspaces`).

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
│   ├── ui/                     # Frontend: React/Fluent UI library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── AgeSelect/
│   │   │   ├── ConsentFlow/    # Supporting steps components for stepping through the consent flow
│   │   │   ├── hooks/          # e.g., useConsent*, usePolicy*
│   │   │   ├── Policy/
│   │   │   ├── Profile/        # Display Personal Information, Managed Subjects and status of Consents
│   │   │   ├── RoleSelect/     
│   │   │   ├── Signature/
│   │   │   ├── index.css       # Base styles
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types / # Relevant types and interfaces
│   │   ├── src/
│   │   │   ├── types/          # Defines various type interfaces and records
│   │   │   └── index.ts        # Exports types from the types/ directory
│   │   └── package.json
│   │
│   └── data-adapter-cosmosdb/  # Cosmos DB adapter implementation
│       ├── src/
│       │   └── index.ts        # Implements IConsentDataAdapter 
│       └── package.json
│
└── tests/                      # Tests (may end up co-locating)
```

### Tech Stack, Patterns

*   **TypeScript**
*   **pnpm**
*   **React**
*   **Fluent UI**
*   **Azure Functions**
*   **Cosmos DB (SQL API)**
*   **Adapter Pattern**
*   **Monorepo**
