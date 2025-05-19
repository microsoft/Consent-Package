import { app } from "@azure/functions";
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { ConsentService } from "@open-source-consent/core";
import type { CreateConsentInput } from "@open-source-consent/types";
import { createHttpHandler } from "../shared/httpHandler.js";
import {
  handleError,
  type ErrorHandlingOptions,
} from "../shared/errorHandler.js";
import { createConsentService } from "../shared/factories.js";

async function executeCreateConsentLogic(
  request: HttpRequest,
  context: InvocationContext,
  consentService: ConsentService,
  endpointDefaultMessage?: string
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as CreateConsentInput;

    const result = await consentService.grantConsent(body);
    return { status: 201, jsonBody: result };
  } catch (error) {
    const errorOptions: ErrorHandlingOptions = {
      defaultStatus: 400,
      defaultMessage: endpointDefaultMessage,
      customErrorMap: [
        {
          check: (err) => err.message.includes("modified"),
          status: 409,
          message: "",
          useActualErrorMessage: true,
        },
      ],
    };
    return handleError(context, error, "Error creating consent:", errorOptions);
  }
}

app.http("createConsent", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "consent",
  handler: createHttpHandler(createConsentService, executeCreateConsentLogic, {
    defaultMessage: "An error occurred while creating the consent.",
  }),
});
