// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

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

async function executeGetAllPolicyVersionsByGroupIdLogic(
  request: HttpRequest,
  context: InvocationContext,
  policyService: PolicyService,
): Promise<HttpResponseInit> {
  const policyGroupId = request.params.policyGroupId;
  if (!policyGroupId) {
    return handleError(
      context,
      new Error('Policy Group ID is required'),
      'Policy Group ID is required in the route parameters.',
      {
        defaultStatus: 400,
      },
    );
  }

  try {
    const policies =
      await policyService.getAllPolicyVersionsByGroupId(policyGroupId);
    return { status: 200, jsonBody: policies };
  } catch (error) {
    return handleError(
      context,
      error,
      'Error getting all policy versions by group ID:',
      {
        defaultStatus: 500,
      },
    );
  }
}

app.http('getAllPolicyVersionsByGroupId', {
  methods: ['GET'],
  route: 'policyGroups/{policyGroupId}/versions',
  authLevel: 'anonymous',
  handler: createHttpHandler(
    createPolicyService,
    executeGetAllPolicyVersionsByGroupIdLogic,
  ),
});
