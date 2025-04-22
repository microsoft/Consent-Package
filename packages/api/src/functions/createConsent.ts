import { app } from "@azure/functions";
import { ConsentService, GrantConsentInput } from "@open-source-consent/core";
import { CosmosDBDataAdapter } from "@open-source-consent/data-adapter-cosmosdb";

const dataAdapter = new CosmosDBDataAdapter({
  endpoint: process.env.CosmosDB_Endpoint!,
  key: process.env.CosmosDB_Key!,
  databaseName: process.env.CosmosDB_DatabaseName!,
  containerName: "consents",
});

const consentService = new ConsentService(dataAdapter);

app.http("createConsent", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "consent",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const body = (await request.json()) as GrantConsentInput;
      const result = await consentService.grantConsent(body);
      return { jsonBody: result };
    } catch (error) {
      context.error(error);
      return {
        status: 400,
        jsonBody: {
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  },
});
