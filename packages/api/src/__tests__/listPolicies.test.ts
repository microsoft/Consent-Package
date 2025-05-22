import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from './utils';

vi.mock('@azure/functions');
vi.mock('../shared/dataAdapter.js');
vi.mock('@open-source-consent/core');

describe('listPolicies function', () => {
  let registeredHandlers: Record<string, Function>;
  let policyServiceMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env: any = await initializeTestEnvironment([
      '../functions/listPolicies.js',
    ]);
    registeredHandlers = env.registeredHandlers;
    policyServiceMocks = env.policyServiceMocks;
  });

  it('should return a list of policies', async () => {
    const mockPolicies = [
      { id: 'policy1', version: '1' },
      { id: 'policy2', version: '3' },
    ];
    policyServiceMocks.listPolicies.mockResolvedValue(mockPolicies);

    const request: MockRequest = {};
    const context = createMockContext();

    const result = await registeredHandlers.listPolicies(request, context);

    expect(result.status).toBe(200);
    expect(result.jsonBody).toEqual(mockPolicies);
    expect(policyServiceMocks.listPolicies).toHaveBeenCalled();
  });

  it('should handle database initialization failure', async () => {
    const dataAdapterModule = await import('../shared/dataAdapter.js');
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error('Database connection failed.'),
    );

    const request: MockRequest = {};
    const context = createMockContext();

    const result = await registeredHandlers.listPolicies(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: 'Database connection failed.' });
    expect(context.error).toHaveBeenCalled();
  });

  it('should handle service error when listing policies', async () => {
    policyServiceMocks.listPolicies.mockRejectedValueOnce(
      new Error('Service unavailable'),
    );

    const request: MockRequest = {};
    const context = createMockContext();

    const result = await registeredHandlers.listPolicies(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: 'Service unavailable' });
    expect(context.error).toHaveBeenCalled();
  });

  it('should handle non-Error object in service error', async () => {
    policyServiceMocks.listPolicies.mockRejectedValueOnce('String error');

    const request: MockRequest = {};
    const context = createMockContext();

    const result = await registeredHandlers.listPolicies(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: 'An internal server error occurred while listing policies.',
    });
    expect(context.error).toHaveBeenCalled();
  });
});
