// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { InvocationContext, HttpResponseInit } from '@azure/functions';

export interface ErrorHandlingOptions {
  defaultStatus?: number;
  defaultMessage?: string;
  customErrorMap?: Array<{
    check(error: Error): boolean;
    status: number;
    message: string;
    useActualErrorMessage?: boolean;
  }>;
}

export function handleError(
  context: InvocationContext,
  error: unknown,
  errorPrefix: string,
  options?: ErrorHandlingOptions,
): HttpResponseInit {
  context.error(errorPrefix, error);

  const defaultStatus = options?.defaultStatus ?? 500;
  const ultimateFallbackMessage = 'An internal server error occurred.';

  if (error instanceof Error) {
    if (options?.customErrorMap) {
      for (const mapping of options.customErrorMap) {
        if (mapping.check(error)) {
          let messageToUse = ultimateFallbackMessage;
          if (mapping.useActualErrorMessage && error.message) {
            messageToUse = error.message;
          } else if (mapping.message) {
            messageToUse = mapping.message;
          } else if (options?.defaultMessage) {
            messageToUse = options.defaultMessage;
          } else if (error.message) {
            messageToUse = error.message;
          }
          return {
            status: mapping.status,
            jsonBody: { error: messageToUse },
          };
        }
      }
    }
    return {
      status: defaultStatus,
      jsonBody: {
        error:
          error.message || options?.defaultMessage || ultimateFallbackMessage,
      },
    };
  }

  return {
    status: defaultStatus,
    jsonBody: { error: options?.defaultMessage || ultimateFallbackMessage },
  };
}
