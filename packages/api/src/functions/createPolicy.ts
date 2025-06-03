import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import type { CreatePolicyInput, Policy } from '@open-source-consent/types';
import sanitizeHtml from 'sanitize-html';
import { createHttpHandler } from '../shared/httpHandler.js';
import {
  handleError,
  type ErrorHandlingOptions,
} from '../shared/errorHandler.js';
import { createPolicyService } from '../shared/factories.js';
import type { PolicyService } from '@open-source-consent/core';

async function executeCreatePolicyLogic(
  request: HttpRequest,
  context: InvocationContext,
  policyService: PolicyService,
  endpointDefaultMessage?: string,
): Promise<HttpResponseInit> {
  const policyData = (await request.json()) as CreatePolicyInput;

  if (!policyData) {
    return handleError(
      context,
      new Error('Request body is required.'),
      'Policy creation failed:',
      { defaultStatus: 400 },
    );
  }

  if (!policyData.policyGroupId || !policyData.status) {
    return handleError(
      context,
      new Error('Missing required fields'),
      'Policy creation failed: Missing policyGroupId or status.',
      {
        defaultStatus: 400,
      },
    );
  }

  if (
    !policyData.effectiveDate ||
    !policyData.contentSections ||
    !policyData.availableScopes
  ) {
    return handleError(
      context,
      new Error('Missing required fields'),
      'Policy creation failed: Missing effectiveDate, contentSections, or availableScopes.',
      {
        defaultStatus: 400,
      },
    );
  }

  let processedPolicyData = policyData;
  if (policyData.contentSections) {
    const sanitizedContentSections = policyData.contentSections.map(
      (section) => ({
        ...section,
        content: sanitizeHtml(section.content),
      }),
    );
    processedPolicyData = {
      ...policyData,
      contentSections:
        sanitizedContentSections as unknown as Policy['contentSections'],
    };
  }

  try {
    const newPolicy = await policyService.createPolicy(processedPolicyData);
    return { status: 201, jsonBody: newPolicy };
  } catch (error) {
    const errorOptions: ErrorHandlingOptions = {
      defaultStatus: 500,
      defaultMessage: endpointDefaultMessage,
    };
    return handleError(context, error, 'Policy creation failed:', errorOptions);
  }
}

app.http('createPolicy', {
  methods: ['POST'],
  route: 'policies',
  authLevel: 'anonymous',
  handler: createHttpHandler(createPolicyService, executeCreatePolicyLogic, {
    defaultMessage: 'Policy creation failed:',
  }),
});
