# Architecture

## Architecture & Structure

A monorepo structure using `pnpm workspaces`.

```
/open-source-consent-package           
├── LICENSE                     # MIT
├── README.md                   # Overview, setup, contribution guide
├── package.json                # Monorepo root
├── docs/                       
│   ├── architecture.md         # This file - project architecture details
│   ├── api.md                  # API endpoint definitions
│   ├── data.md                 # Data structures and types
│   ├── usage_examples.md       # Usage examples
│   └── local_development.md    # Local development setup guide
├── packages/                   
│   ├── types/                  # Shared TypeScript types and interfaces
│   │   ├── src/
│   │   │   ├── types/          # Type definitions (ConsentRecord, Policy, etc.)
│   │   │   │   ├── ConsentRecord.type.ts
│   │   │   │   ├── ConsentInputs.type.ts
│   │   │   │   ├── Policy.type.ts
│   │   │   │   ├── PolicyInputs.type.ts
│   │   │   │   ├── IConsentDataAdapter.type.ts
│   │   │   │   ├── IPolicyDataAdapter.type.ts
│   │   │   │   └── IDataAdapter.type.ts
│   │   │   └── index.ts        # Exports all types
│   │   └── package.json
│   │
│   ├── core/                   # Platform-agnostic core business logic
│   │   ├── src/
│   │   │   ├── services/       # Business logic services
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api/                    # Backend: Azure Functions (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── functions/      # HTTP Triggers
│   │   │   │   ├── createConsent.ts
│   │   │   │   ├── getConsentById.ts
│   │   │   │   ├── findActiveConsentsBySubject.ts
│   │   │   │   ├── getConsentsByProxy.ts
│   │   │   │   ├── createPolicy.ts
│   │   │   │   ├── getPolicyById.ts
│   │   │   │   ├── listPolicies.ts
│   │   │   │   ├── getAllPolicyVersionsByGroupId.ts
│   │   │   │   └── getLatestActivePolicyByGroupId.ts
│   │   │   ├── shared/         # Shared API utilities
│   │   │   └── mock/           # Mock data for development
│   │   ├── host.json           
│   │   ├── local.settings.json # Local development settings
│   │   └── package.json
│   │
│   ├── ui/                     # Frontend: React component library
│   │   ├── src/
│   │   │   ├── AgeSelect/      # Age selection component
│   │   │   ├── ConsentFlow/    # Consent flow components
│   │   │   ├── hooks/          # React hooks for consent management
│   │   │   ├── Policy/         # Policy display components
│   │   │   ├── Profile/        # User profile and consent status
│   │   │   ├── RoleSelect/     # Role selection (self/proxy)
│   │   │   ├── Signature/      # Digital signature component
│   │   │   ├── utils/          # UI utilities
│   │   │   ├── index.css       # Base styles
│   │   │   ├── index.ts        
│   │   │   └── ThemeProvider.tsx # Theme customization
│   │   └── package.json
│   │
│   ├── demo/                   # Demo application
│   │   ├── src/                # Demo app source
│   │   ├── index.html          # Demo app HTML
│   │   └── package.json
│   │
│   ├── data-adapter-cosmosdb/  # Cosmos DB adapter implementation
│   │   ├── src/
│   │   │   └── index.ts        # Implements data adapter interfaces
│   │   └── package.json
│   │
│   └── data-adapter-indexeddb/ # IndexedDB adapter implementation
│       ├── src/
│       │   └── index.ts        # Implements data adapter interfaces
│       └── package.json
```

### Tech Stack

- **TypeScript** - Type-safe development across all packages
- **pnpm** - Fast, space-efficient package manager with workspace support
- **React** - UI component library framework
- **Azure Functions** - Serverless backend API
- **Cosmos DB** - Primary database for production environments
- **IndexedDB** - Browser-based storage for local/offline scenarios
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code quality and formatting

### Architectural Patterns

- **Monorepo** - Single repository with multiple related packages
- **Adapter Pattern** - Database adapters for different storage backends
- **Dependency Injection** - Services accept adapter interfaces
- **Component Library** - Reusable UI components with theming support
- **Immutable Records** - Consent records are versioned and immutable
- **Event Sourcing** - Audit trail through versioned consent records
