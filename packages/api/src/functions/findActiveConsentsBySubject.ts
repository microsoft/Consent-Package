// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import type { ConsentService } from '@open-source-consent/core';
import { createHttpHandler } from '../shared/httpHandler.js';
import { handleError } from '../shared/errorHandler.js';
import { createConsentService } from '../shared/factories.js';

async function executeFindActiveConsentsBySubjectLogic(
  request: HttpRequest,
  context: InvocationContext,
  consentService: ConsentService,
  endpointDefaultMessage?: string,
): Promise<HttpResponseInit> {
  const { subjectId } = request.params;
  if (!subjectId) {
    return handleError(context, new Error('Subject ID is required'), '', {
      defaultStatus: 400,
    });
  }

  try {
    const latestConsentVersions =
      await consentService.getLatestConsentVersionsForSubject(subjectId);
    return { status: 200, jsonBody: latestConsentVersions };
  } catch (error) {
    return handleError(context, error, endpointDefaultMessage ?? '', {
      defaultMessage: endpointDefaultMessage ?? '',
      defaultStatus: 500,
    });
  }
}

app.http('findActiveConsentsBySubject', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'consents/subject/{subjectId}/latest-versions',
  handler: createHttpHandler(
    createConsentService,
    executeFindActiveConsentsBySubjectLogic,
    {
      defaultMessage:
        'An error occurred while retrieving consent versions for subject.',
    },
  ),
});
