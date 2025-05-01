import { vi } from "vitest";

export interface MockRequest {
  url?: string;
  params?: Record<string, string>;
  query?: Map<string, string>;
  json?(): Promise<any>;
}

export interface MockContext {
  log: ReturnType<typeof vi.fn>;
  error?: ReturnType<typeof vi.fn>;
}

export const createMockContext = (): MockContext => ({
  log: vi.fn(),
  error: vi.fn(),
});

export const setupMockDataAdapter = (mockData?: any) => {
  const getAllConsents = vi.fn().mockResolvedValue(
    mockData || [
      { id: "test-consent-1", status: "granted" },
      { id: "test-consent-2", status: "revoked" },
    ]
  );

  const dataAdapter = {
    getAllConsents,
  };

  const getInitializedDataAdapter = vi.fn().mockResolvedValue(dataAdapter);

  return { getInitializedDataAdapter, dataAdapter };
};

export const setupMockConsentService = (mockImplementation?: any) => {
  const defaultImplementation = {
    grantConsent: vi
      .fn()
      .mockResolvedValue({ id: "new-consent-id", status: "granted" }),
    getConsentDetails: vi.fn().mockImplementation((id) => {
      if (id === "test-consent-id") {
        return Promise.resolve({ id: "test-consent-id", status: "granted" });
      }
      if (id === "not-found") {
        return Promise.resolve(null);
      }
      if (id === "error-id") {
        return Promise.reject(new Error("Failed to retrieve consent"));
      }
      return Promise.resolve({ id, status: "granted" });
    }),
    findActiveConsentsBySubject: vi.fn().mockImplementation((subjectId) => {
      if (subjectId === "test-subject-id") {
        return Promise.resolve([
          {
            id: "active-consent-1",
            status: "granted",
            subjectId: "test-subject-id",
          },
          {
            id: "active-consent-2",
            status: "granted",
            subjectId: "test-subject-id",
          },
        ]);
      }
      if (subjectId === "empty-subject") {
        return Promise.resolve([]);
      }
      if (subjectId === "error-subject") {
        return Promise.reject(new Error("Failed to retrieve active consents"));
      }
      return Promise.resolve([]);
    }),
    ...mockImplementation,
  };

  const ConsentService = vi
    .fn()
    .mockImplementation(() => defaultImplementation);

  return { ConsentService, defaultImplementation };
};

const registeredHandlers: Record<string, Function> = {};

export const clearRegisteredHandlers = () => {
  Object.keys(registeredHandlers).forEach((key) => {
    delete registeredHandlers[key];
  });
};

export const setupMockAzureFunctions = () => {
  clearRegisteredHandlers();
  const httpMock = vi.fn().mockImplementation((name: string, config: any) => {
    registeredHandlers[name] = config.handler;
  });

  return { registeredHandlers, httpMock };
};

export const initializeTestEnvironment = async (
  functionModulePaths: string[]
) => {
  // 1. Setup individual mocks
  const { registeredHandlers, httpMock } = setupMockAzureFunctions();
  const { getInitializedDataAdapter, dataAdapter } = setupMockDataAdapter();
  const { ConsentService, defaultImplementation } = setupMockConsentService();

  // 2. Apply mocks to modules
  vi.mocked(await import("@azure/functions")).app.http = httpMock;
  vi.mocked(
    await import("../shared/dataAdapter.js")
  ).getInitializedDataAdapter = getInitializedDataAdapter;
  vi.mocked(await import("@open-source-consent/core")).ConsentService =
    ConsentService;

  // 3. Import function modules to register handlers
  for (const path of functionModulePaths) {
    await import(path);
  }

  // 4. Return registered handlers and underlying mocks for potential test overrides
  return {
    registeredHandlers,
    dataAdapter,
    consentServiceMocks: defaultImplementation,
  };
};

export const handleDatabaseError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      status: 500,
      jsonBody: { error: error.message },
    };
  }
  return {
    status: 500,
    jsonBody: { error: "Unknown error occurred" },
  };
};
