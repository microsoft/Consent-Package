import { app } from "@azure/functions";
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { PolicyService } from "@open-source-consent/core";
import { handleError } from "../shared/errorHandler.js";
import { createHttpHandler } from "../shared/httpHandler.js";
import { createPolicyService } from "../shared/factories.js";

async function executeListPoliciesLogic(
  request: HttpRequest,
  context: InvocationContext,
  policyService: PolicyService
): Promise<HttpResponseInit> {
  try {
    const policies = await policyService.listPolicies();

    return { status: 200, jsonBody: policies };
  } catch (error) {
    return handleError(context, error, "Error listing policies:", {
      defaultStatus: 500,
      defaultMessage:
        "An internal server error occurred while listing policies.",
    });
  }
}

app.http("listPolicies", {
  methods: ["GET"],
  route: "policies",
  authLevel: "anonymous",
  handler: createHttpHandler(createPolicyService, executeListPoliciesLogic),
});
