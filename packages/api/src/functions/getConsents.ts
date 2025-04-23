import { app } from "@azure/functions";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";

app.http("getConsents", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "consents",
  handler: async (request, context) => {
    let dataAdapter;
    try {
      dataAdapter = await getInitializedDataAdapter();
    } catch (initError) {
      context.error("Failed to get initialized CosmosDB adapter:", initError);
      return {
        status: 500,
        jsonBody: { error: "Database connection failed." },
      };
    }

    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const items = await dataAdapter.getAllConsents();

      return {
        jsonBody: items,
      };
    } catch (error) {
      context.error("Error fetching consents:", error);
      return {
        status: 500,
        jsonBody: {
          error:
            error instanceof Error
              ? error.message
              : "Failed to retrieve consents",
        },
      };
    }
  },
});
