import { app } from "@azure/functions";
import type { GrantConsentInput } from "@open-source-consent/core";
import { ConsentService } from "@open-source-consent/core";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";

app.http("createConsent", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "consent",
  handler: async (request, context) => {
    let dataAdapter;
    let consentService;
    try {
      dataAdapter = await getInitializedDataAdapter();
      consentService = new ConsentService(dataAdapter);
    } catch (initError) {
      context.error("Failed to get initialized CosmosDB adapter:", initError);
      return {
        status: 500,
        jsonBody: { error: "Database connection failed." },
      };
    }

    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const body = (await request.json()) as GrantConsentInput;
      const result = await consentService.grantConsent(body);
      return { jsonBody: result };
    } catch (error) {
      context.error("Error creating consent:", error);
      return {
        status:
          error instanceof Error && error.message.includes("modified")
            ? 409
            : 400,
        jsonBody: {
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  },
});
