import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { createHttpHandler } from '../shared/httpHandler.js';
import { handleError } from '../shared/errorHandler.js';
import { createPolicyService } from '../shared/factories.js';
import type { PolicyService } from '@open-source-consent/core';

async function executeGetPolicyByIdLogic(
  request: HttpRequest,
  context: InvocationContext,
  policyService: PolicyService,
): Promise<HttpResponseInit> {
  const policyId = request.params.policyId;

  if (!policyId) {
    return handleError(context, new Error('Policy ID is required'), '', {
      defaultStatus: 400,
    });
  }

  try {
    const policy = await policyService.getPolicyById(policyId);

    if (!policy) {
      return handleError(
        context,
        new Error(`Policy with ID '${policyId}' not found.`),
        '',
        { defaultStatus: 404 },
      );
    }
    return { status: 200, jsonBody: policy };
  } catch (error) {
    return handleError(context, error, 'Error retrieving policy by ID:', {
      defaultStatus: 500,
    });
  }
}

app.http('getPolicyById', {
  methods: ['GET'],
  route: 'policies/{policyId}',
  authLevel: 'anonymous',
  handler: createHttpHandler(createPolicyService, executeGetPolicyByIdLogic),
});
