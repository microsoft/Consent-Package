// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getInitializedDataAdapter } from './dataAdapter.js';
import { handleError, type ErrorHandlingOptions } from './errorHandler.js';
import type { IDataAdapter } from '@open-source-consent/types';
import { middlewareRegistry } from './middlewareRegistry.js';

type ServiceFactory<TService> = (dataAdapter: IDataAdapter) => TService;

type ExecuteLogic<TService> = (
  request: HttpRequest,
  context: InvocationContext,
  service: TService,
  endpointDefaultMessage?: string,
) => Promise<HttpResponseInit>;

export type Middleware = (
  request: HttpRequest,
  context: InvocationContext,
  next: () => Promise<HttpResponseInit>,
) => Promise<HttpResponseInit>;

interface HttpHandlerOptions {
  middleware?: Middleware[];
  errorOptions?: ErrorHandlingOptions;
  endpointName?: string;
}

export function createHttpHandler<TService>(
  factory: ServiceFactory<TService>,
  executeLogic: ExecuteLogic<TService>,
  options?: HttpHandlerOptions,
) {
  return async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    context.log(`Http function processed request for url "${request.url}"`);

    const executeWithMiddleware = async (): Promise<HttpResponseInit> => {
      let dataAdapter: IDataAdapter;
      try {
        dataAdapter = await getInitializedDataAdapter();
      } catch (error) {
        return handleError(
          context,
          error,
          'Failed to initialize data adapter:',
          {
            defaultStatus: 500,
            ...(options?.errorOptions || {}),
          },
        );
      }

      let service: TService;
      try {
        service = factory(dataAdapter);
      } catch (error) {
        return handleError(context, error, 'Failed to initialize service:', {
          defaultStatus: 500,
          ...(options?.errorOptions || {}),
        });
      }

      try {
        return await executeLogic(
          request,
          context,
          service,
          options?.errorOptions?.defaultMessage,
        );
      } catch (error) {
        return handleError(
          context,
          error,
          'Error executing HTTP function logic:',
          {
            defaultStatus: 500,
            ...(options?.errorOptions || {}),
          },
        );
      }
    };

    const registryMiddleware = options?.endpointName
      ? middlewareRegistry.getMiddlewareForEndpoint(options.endpointName)
      : [];

    const allMiddleware = [
      ...registryMiddleware,
      ...(options?.middleware || []),
    ];

    if (allMiddleware.length === 0) {
      return executeWithMiddleware();
    }

    let middlewareIndex = 0;
    const runMiddleware = async (): Promise<HttpResponseInit> => {
      if (middlewareIndex >= allMiddleware.length) {
        return executeWithMiddleware();
      }

      const currentMiddleware = allMiddleware[middlewareIndex++];
      return currentMiddleware(request, context, runMiddleware);
    };

    return runMiddleware();
  };
}
