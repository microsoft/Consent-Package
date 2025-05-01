import { app } from "@azure/functions";
import { ConsentService } from "@open-source-consent/core";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";

app.http("findActiveConsentsBySubject", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "consents/active/{subjectId}",
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
      const subjectId = request.params.subjectId;
      if (!subjectId) {
        return {
          status: 400,
          jsonBody: { error: "Subject ID is required" },
        };
      }

      const activeConsents =
        await consentService.findActiveConsentsBySubject(subjectId);

      return { jsonBody: activeConsents };
    } catch (error) {
      context.error("Error retrieving active consents:", error);
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
