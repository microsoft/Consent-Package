**Phase 1: Core Setup & Local Foundation (Corresponds to Arch & Design: Apr 21 - May 5)**

1.  **Monorepo Setup:** Initialize `pnpm` workspace, configure root `package.json`, `tsconfig.base.json`.
2.  **Package Scaffolding:** Create basic structures for `core`, `api`, `ui`, `data-adapter-interface`, `data-adapter-cosmosdb`.
3.  **Core Types & Interfaces:** Implement initial versions of `ConsentRecord`, `Policy` (stubbed), `IConsentDataAdapter` based on Arch & Design.
4.  **Local Emulation Setup:**
    *   Set up Azure Functions Core Tools for local `api` execution.
5.  **Basic CI:** Set up initial GitHub Actions workflow for linting, type checking, and running `core` unit tests on push.
6.  **Stakeholder Review #1 (Apr 30 - May 5):** Review architecture, core types, initial setup.

**Phase 2: Core Implementation & Local Iteration (Corresponds to Core Implementation: Apr 30 - May 21)**

1.  **Data Adapter Implementation:** Build `data-adapter-cosmosdb` implementing `IConsentDataAdapter`
2.  **Core Service Logic:** Implement `ConsentService` logic using the data adapter. Develop comprehensive unit tests.
3.  **API Endpoint Development:**
    *   Build Azure Function HTTP triggers (`api/src/functions`).
    *   Implement API-specific services (`api/src/services`) orchestrating `ConsentService`.
    *   Integrate basic request validation middleware.
4.  **UI Component Library:** Develop core React components (`ui/src/components`), hooks (`ui/src/hooks`), and contexts.
5.  **API Integration Testing:** Add integration tests verifying `api` interaction with the emulated data adapter. Add to CI/CD.
7.  **Initial Azure Deployment:**
    *   Set up basic Azure resources for test app
8.  **Stakeholder Review #2 (May 22 - 23):** Technical review of implemented `core`, `api`, `data-adapter`, and `ui` components. Test app.

**Phase 3: Refinement, Deployment & Documentation (Corresponds to Extension & Refinement / Release Prep: May 27 - Jun 12)**

1.  **Feedback Implementation:** Address feedback from Review #2 (May 27-28).
2.  **Internal QA:** Conduct internal QA on the deployed environment (May 27-28)
3.  **Documentation & Examples:** Create developer documentation (`docs/`), usage examples, and refine READMEs (May 27-28, Jun 10-12). Develop the simple example site (Jun 10-12).
4.  **Stakeholder Review #3 (May 29 - Jun 9):** Final review, including Microsoft Compliance checks, using the deployed environment.
5.  **Release Preparation:** Finalize documentation, prepare packages for public release, merge into upstream (Jun 10-12)