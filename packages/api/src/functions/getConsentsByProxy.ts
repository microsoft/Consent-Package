// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { getInitializedDataAdapter } from '../shared/dataAdapter.js';
import type {
  IConsentDataAdapter,
  ConsentRecord,
} from '@open-source-consent/types';

export async function getConsentsByProxy(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const proxyId = request.params.proxyId;

  if (!proxyId) {
    return {
      status: 400,
      jsonBody: {
        error: 'proxyId parameter is required.',
      },
    };
  }

  try {
    const dataAdapter =
      (await getInitializedDataAdapter()) as IConsentDataAdapter;
    const consents: ConsentRecord[] =
      await dataAdapter.getConsentsByProxyId(proxyId);

    if (!consents) {
      return {
        status: 200,
        jsonBody: [],
      };
    }

    return {
      status: 200,
      jsonBody: consents,
    };
  } catch (error: any) {
    context.error(
      `Error fetching consents for proxyId ${proxyId}:`,
      error.message,
    );
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to retrieve consents for proxy.',
        details: error.message,
      },
    };
  }
}

app.http('getConsentsByProxy', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'proxies/{proxyId}/consents',
  handler: getConsentsByProxy,
});
