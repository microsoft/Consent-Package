**Phase 1: Core Setup & Local Foundation (Corresponds to Arch & Design: Apr 21 - May 5)**

1.  **Monorepo Setup:** Initialize `pnpm` workspace, configure root `package.json`, `tsconfig.base.json`.
2.  **Package Scaffolding:** Create basic structures for `core`, `api`, `ui`, `data-adapter-interface`, `data-adapter-cosmosdb`.
3.  **Core Types & Interfaces:** Implement initial versions of `ConsentRecord`, `Policy` (stubbed), `IConsentDataAdapter` based on Arch & Design.
4.  **Local Emulation Setup:**
    *   Set up Azure Functions Core Tools for local `api` execution.
5.  **Basic CI:** Set up initial GitHub Actions workflow for linting, type checking, and running `core` unit tests on push.
6.  **Stakeholder Review #1 (Apr 30 - May 5):** Review architecture, core types, initial setup.

**Phase 2: Core Implementation & Local Iteration (Corresponds to Core Implementation: Apr 30 - May 21)**

1.  **Data Adapter Implementation:** Build `data-adapter-cosmosdb` implementing `IConsentDataAdapter`, testing against Azurite.
2.  **Core Service Logic:** Implement `ConsentService` logic using the data adapter. Develop comprehensive unit tests.
3.  **API Endpoint Development:**
    *   Build Azure Function HTTP triggers (`api/src/functions`).
    *   Implement API-specific services (`api/src/services`) orchestrating `ConsentService`.
    *   Integrate basic request validation middleware.
    *   Test API endpoints locally using Functions Core Tools against Azurite.
4.  **UI Component Library:** Develop core React components (`ui/src/components`), hooks (`ui/src/hooks`), and contexts.
5.  **API Integration Testing:** Add integration tests verifying `api` interaction with the emulated data adapter. Add to CI/CD.
6.  **Stakeholder Review #2 (May 22 - 23):** Technical review of implemented `core`, `api`, `data-adapter`, and `ui` components. Demo local functionality (screen recording?).

**Phase 3: Refinement, Deployment & Documentation (Corresponds to Extension & Refinement / Release Prep: May 27 - Jun 12)**

1.  **Feedback Implementation:** Address feedback from Review #2 (May 27-28).
2.  **Initial Azure Deployment:**
    *   Set up basic Azure resources for test app (Resource Group, App Service Plan/Functions App, Cosmos DB account)
    *   Verify deployed API and potentially a simple UI deployment.
3.  **Internal QA & E2E Testing:** Conduct internal QA on the deployed environment (May 27-28)
4.  **Documentation & Examples:** Create developer documentation (`docs/`), usage examples, and refine READMEs (May 27-28, Jun 10-12). Develop the simple example site (Jun 10-12).
5.  **Stakeholder Review #3 (May 29 - Jun 9):** Final review, including Microsoft Compliance checks, using the deployed environment.
6.  **Release Preparation:** Finalize documentation, prepare packages for public release, merge into upstream (Jun 10-12)