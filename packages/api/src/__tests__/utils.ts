// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { vi } from 'vitest';

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
      { id: 'test-consent-1', status: 'granted' },
      { id: 'test-consent-2', status: 'revoked' },
    ],
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
      .mockResolvedValue({ id: 'new-consent-id', status: 'granted' }),
    getConsentDetails: vi.fn().mockImplementation((id) => {
      if (id === 'test-consent-id') {
        return Promise.resolve({ id: 'test-consent-id', status: 'granted' });
      }
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      if (id === 'error-id') {
        return Promise.reject(new Error('Failed to retrieve consent'));
      }
      return Promise.resolve({ id, status: 'granted' });
    }),
    getLatestConsentVersionsForSubject: vi
      .fn()
      .mockImplementation((subjectId) => {
        if (subjectId === 'test-subject-id') {
          return Promise.resolve([
            {
              id: 'active-consent-1',
              status: 'granted',
              subjectId: 'test-subject-id',
            },
            {
              id: 'active-consent-2',
              status: 'granted',
              subjectId: 'test-subject-id',
            },
          ]);
        }
        if (subjectId === 'empty-subject') {
          return Promise.resolve([]);
        }
        if (subjectId === 'error-subject') {
          return Promise.reject(
            new Error('Failed to retrieve active consents'),
          );
        }
        return Promise.resolve([]);
      }),
    ...mockImplementation,
  };

  const getInstance = vi.fn().mockReturnValue(defaultImplementation);

  const MockConsentService = {
    getInstance,
  };

  return { ConsentService: MockConsentService, defaultImplementation };
};

export const setupMockPolicyService = (mockImplementation?: any) => {
  const defaultImplementation = {
    createPolicy: vi.fn().mockResolvedValue({
      id: 'mock-policy-id',
      status: 'draft',
      version: 1,
      policyGroupId: 'mock-group',
    }),
    getPolicyById: vi.fn().mockImplementation((id: string) => {
      if (id === 'found-policy-id') {
        return Promise.resolve({
          id,
          status: 'active',
          version: 1,
          policyGroupId: 'mock-group',
        });
      }
      if (id === 'not-found-policy-id') {
        return Promise.resolve(null);
      }
      if (id === 'error-policy-id') {
        return Promise.reject(new Error('Failed to retrieve policy'));
      }
      return Promise.resolve({
        id,
        status: 'draft',
        version: 1,
        policyGroupId: 'mock-group',
      });
    }),
    getAllPolicyVersionsByGroupId: vi
      .fn()
      .mockImplementation((policyGroupId: string) => {
        if (policyGroupId === 'error-group-id') {
          return Promise.reject(new Error('Failed to retrieve versions'));
        }
        return Promise.resolve([
          { id: 'version-1', policyGroupId, version: 1, status: 'archived' },
          { id: 'version-2', policyGroupId, version: 2, status: 'active' },
        ]);
      }),
    getLatestActivePolicyByGroupId: vi
      .fn()
      .mockImplementation((policyGroupId: string) => {
        if (policyGroupId === 'no-active-policy-group') {
          return Promise.resolve(null);
        }
        if (policyGroupId === 'error-finding-latest-group') {
          return Promise.reject(
            new Error('Failed to find latest active policy'),
          );
        }
        return Promise.resolve({
          id: 'latest-active-id',
          policyGroupId,
          status: 'active',
          version: 2,
        });
      }),
    listPolicies: vi.fn().mockResolvedValue([
      {
        id: 'policy-A',
        status: 'active',
        version: 1,
        policyGroupId: 'group-A',
      },
      { id: 'policy-B', status: 'draft', version: 2, policyGroupId: 'group-B' },
    ]),
    ...mockImplementation,
  };

  const getInstance = vi.fn().mockReturnValue(defaultImplementation);
  const MockPolicyService = { getInstance };

  return { PolicyService: MockPolicyService, defaultImplementation };
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
  functionModulePaths: string[],
): Promise<{
  registeredHandlers: Record<string, Function>;
  dataAdapter: any;
  consentServiceMocks: any;
  policyServiceMocks: any;
}> => {
  const { registeredHandlers, httpMock } = setupMockAzureFunctions();
  const { getInitializedDataAdapter, dataAdapter } = setupMockDataAdapter();
  const {
    ConsentService: MockConsentService,
    defaultImplementation: consentServiceMocks,
  } = setupMockConsentService();
  const {
    PolicyService: MockPolicyService,
    defaultImplementation: policyServiceMocks,
  } = setupMockPolicyService();

  vi.mocked(await import('@azure/functions')).app.http = httpMock;
  vi.mocked(
    await import('../shared/dataAdapter.js'),
  ).getInitializedDataAdapter = getInitializedDataAdapter;

  vi.doMock('@open-source-consent/core', () => ({
    ConsentService: MockConsentService,
    PolicyService: MockPolicyService,
  }));

  for (const path of functionModulePaths) {
    await import(path);
  }

  return {
    registeredHandlers,
    dataAdapter,
    consentServiceMocks: consentServiceMocks,
    policyServiceMocks: policyServiceMocks,
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
    jsonBody: { error: 'Unknown error occurred' },
  };
};
