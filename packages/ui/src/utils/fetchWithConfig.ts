// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { getApiConfig } from './apiConfig.js';

export async function fetchWithConfig(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const apiConfig = getApiConfig();
  const baseUrl = apiConfig.baseUrl || '';
  const defaultHeaders = apiConfig.headers || {};

  // Standard fetch options from config, with defaults
  const credentials =
    (apiConfig.credentials as RequestCredentials | undefined) ||
    options?.credentials;
  const mode = (apiConfig.mode as RequestMode | undefined) || options?.mode;
  const cache = (apiConfig.cache as RequestCache | undefined) || options?.cache;
  const redirect =
    (apiConfig.redirect as RequestRedirect | undefined) || options?.redirect;
  const timeoutMs =
    typeof apiConfig.timeout === 'number' ? apiConfig.timeout : undefined;

  const url = `${baseUrl}${endpoint}`;

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
  };

  if (credentials) fetchOptions.credentials = credentials;
  if (mode) fetchOptions.mode = mode;
  if (cache) fetchOptions.cache = cache;
  if (redirect) fetchOptions.redirect = redirect;

  if (timeoutMs !== undefined) {
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, fetchOptions).finally(() => {
      clearTimeout(timeoutId);
    });
  } else {
    return fetch(url, fetchOptions);
  }
}
