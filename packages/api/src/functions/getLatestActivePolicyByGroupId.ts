import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import type { PolicyService } from '@open-source-consent/core';
import { createHttpHandler } from '../shared/httpHandler.js';
import { handleError } from '../shared/errorHandler.js';
import { createPolicyService } from '../shared/factories.js';

async function executeGetLatestActivePolicyByGroupIdLogic(
  request: HttpRequest,
  context: InvocationContext,
  policyService: PolicyService,
): Promise<HttpResponseInit> {
  const policyGroupId = request.params.policyGroupId;
  if (!policyGroupId) {
    return handleError(context, new Error('Policy Group ID is required'), '', {
      defaultStatus: 400,
    });
  }

  try {
    const policy =
      await policyService.getLatestActivePolicyByGroupId(policyGroupId);

    if (!policy) {
      return handleError(
        context,
        new Error(`No active policy found for group ID '${policyGroupId}'.`),
        '',
        { defaultStatus: 404 },
      );
    }
    return { status: 200, jsonBody: policy };
  } catch (error) {
    return handleError(
      context,
      error,
      'Error getting latest active policy by group ID:',
      {
        defaultStatus: 500,
      },
    );
  }
}

app.http('getLatestActivePolicyByGroupId', {
  methods: ['GET'],
  route: 'policyGroups/{policyGroupId}/latest',
  authLevel: 'anonymous',
  handler: createHttpHandler(
    createPolicyService,
    executeGetLatestActivePolicyByGroupIdLogic,
  ),
});
