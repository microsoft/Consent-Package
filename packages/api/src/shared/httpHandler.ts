import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getInitializedDataAdapter } from './dataAdapter.js';
import { handleError, type ErrorHandlingOptions } from './errorHandler.js';
import type { IDataAdapter } from '@open-source-consent/types';

type ServiceFactory<TService> = (dataAdapter: IDataAdapter) => TService;

type ExecuteLogic<TService> = (
  request: HttpRequest,
  context: InvocationContext,
  service: TService,
  endpointDefaultMessage?: string,
) => Promise<HttpResponseInit>;

export function createHttpHandler<TService>(
  factory: ServiceFactory<TService>,
  executeLogic: ExecuteLogic<TService>,
  defaultErrorOptions?: ErrorHandlingOptions,
) {
  return async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    context.log(`Http function processed request for url "${request.url}"`);

    let dataAdapter: IDataAdapter;
    try {
      dataAdapter = await getInitializedDataAdapter();
    } catch (error) {
      return handleError(context, error, 'Failed to initialize data adapter:', {
        defaultStatus: 500,
        ...(defaultErrorOptions || {}),
      });
    }

    let service: TService;
    try {
      service = factory(dataAdapter);
    } catch (error) {
      return handleError(context, error, 'Failed to initialize service:', {
        defaultStatus: 500,
        ...(defaultErrorOptions || {}),
      });
    }

    try {
      return await executeLogic(
        request,
        context,
        service,
        defaultErrorOptions?.defaultMessage,
      );
    } catch (error) {
      return handleError(
        context,
        error,
        'Error executing HTTP function logic:',
        {
          defaultStatus: 500,
          ...(defaultErrorOptions || {}),
        },
      );
    }
  };
}
