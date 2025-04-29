import { CosmosDBDataAdapter } from "@open-source-consent/data-adapter-cosmosdb";

const dataAdapter = new CosmosDBDataAdapter({
  endpoint: process.env.CosmosDB_Endpoint!,
  key: process.env.CosmosDB_Key!,
  databaseName: process.env.CosmosDB_DatabaseName!,
  containerName: "consents",
});

let initializePromise: Promise<void> | null = null;

/**
 * Gets the initialized CosmosDBDataAdapter instance.
 * Ensures that initialization is only attempted once.
 */
export async function getInitializedDataAdapter(): Promise<CosmosDBDataAdapter> {
  if (!initializePromise) {
    // eslint-disable-next-line no-console
    console.log("Initializing shared CosmosDB adapter...");
    initializePromise = dataAdapter
      .initialize()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log("Shared CosmosDB adapter initialized successfully.");
      })
      .catch((err: Error) => {
        console.error("Failed to initialize shared CosmosDB adapter:", err);
        initializePromise = null;
        throw err;
      });
  }
  await initializePromise;
  return dataAdapter;
}
