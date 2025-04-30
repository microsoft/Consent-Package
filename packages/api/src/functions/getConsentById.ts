import { app } from "@azure/functions";
import { ConsentService } from "@open-source-consent/core";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";

app.http("getConsentById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "consent/{id}",
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
      const id = request.params.id;
      if (!id) {
        return {
          status: 400,
          jsonBody: { error: "Consent ID is required" },
        };
      }

      const result = await consentService.getConsentDetails(id);
      if (!result) {
        return {
          status: 404,
          jsonBody: { error: "Consent record not found" },
        };
      }

      return { jsonBody: result };
    } catch (error) {
      context.error("Error retrieving consent:", error);
      return {
        status: 500,
        jsonBody: {
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  },
});
