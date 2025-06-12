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

async function executeGetConsentByIdLogic(
  request: HttpRequest,
  context: InvocationContext,
  consentService: ConsentService,
  endpointDefaultMessage?: string,
): Promise<HttpResponseInit> {
  const id = request.params.id;
  if (!id) {
    return handleError(context, new Error('Consent ID is required'), '', {
      defaultStatus: 400,
    });
  }
  try {
    const result = await consentService.getConsentDetails(id);
    if (!result) {
      return handleError(context, new Error('Consent record not found'), '', {
        defaultStatus: 404,
      });
    }
    return { status: 200, jsonBody: result };
  } catch (error) {
    return handleError(context, error, 'Error retrieving consent:', {
      defaultStatus: 500,
      defaultMessage: endpointDefaultMessage,
    });
  }
}

app.http('getConsentById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'consent/{id}',
  handler: createHttpHandler(createConsentService, executeGetConsentByIdLogic, {
    defaultMessage: 'An error occurred while retrieving the consent record.',
  }),
});
