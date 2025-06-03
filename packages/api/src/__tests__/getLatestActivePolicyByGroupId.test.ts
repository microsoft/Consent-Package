import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from './utils';

vi.mock('@azure/functions');
vi.mock('../shared/dataAdapter.js');
vi.mock('@open-source-consent/core');

describe('getLatestActivePolicyByGroupId function', () => {
  let registeredHandlers: Record<string, Function>;
  let policyServiceMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env: any = await initializeTestEnvironment([
      '../functions/getLatestActivePolicyByGroupId.js',
    ]);
    registeredHandlers = env.registeredHandlers;
    policyServiceMocks = env.policyServiceMocks;
  });

  it('should return the latest active policy when valid policyGroupId is provided', async () => {
    const mockPolicy = { id: 'policy1', version: '2', status: 'active' };
    policyServiceMocks.getLatestActivePolicyByGroupId.mockResolvedValue(
      mockPolicy,
    );

    const request: MockRequest = {
      params: { policyGroupId: 'test-group-id' },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(200);
    expect(result.jsonBody).toEqual(mockPolicy);
    expect(
      policyServiceMocks.getLatestActivePolicyByGroupId,
    ).toHaveBeenCalledWith('test-group-id');
  });

  it('should return 404 if no active policy is found', async () => {
    policyServiceMocks.getLatestActivePolicyByGroupId.mockResolvedValue(null);

    const request: MockRequest = {
      params: { policyGroupId: 'test-group-id' },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(404);
    expect(result.jsonBody).toEqual({
      error: "No active policy found for group ID 'test-group-id'.",
    });
  });

  it('should return 400 if policyGroupId is not provided', async () => {
    const request: MockRequest = {
      params: {}, // policyGroupId is missing
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: 'Policy Group ID is required' });
  });

  it('should handle database initialization failure', async () => {
    const dataAdapterModule = await import('../shared/dataAdapter.js');
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error('Database connection failed.'),
    );

    const request: MockRequest = {
      params: { policyGroupId: 'test-group-id' },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: 'Database connection failed.' });
    expect(context.error).toHaveBeenCalled();
  });

  it('should handle service error when getting latest active policy', async () => {
    policyServiceMocks.getLatestActivePolicyByGroupId.mockRejectedValueOnce(
      new Error('Service unavailable'),
    );

    const request: MockRequest = {
      params: { policyGroupId: 'test-group-id' },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: 'Service unavailable' });
    expect(context.error).toHaveBeenCalled();
  });

  it('should handle non-Error object in service error', async () => {
    policyServiceMocks.getLatestActivePolicyByGroupId.mockRejectedValueOnce(
      'String error',
    );

    const request: MockRequest = {
      params: { policyGroupId: 'test-group-id' },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getLatestActivePolicyByGroupId(
      request,
      context,
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: 'An internal server error occurred.',
    });
    expect(context.error).toHaveBeenCalled();
  });
});
