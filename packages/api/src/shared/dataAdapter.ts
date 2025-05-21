import { CosmosDBDataAdapter } from "@open-source-consent/data-adapter-cosmosdb";
import type { IDataAdapter } from "@open-source-consent/types";

let globalDataAdapter: IDataAdapter | null = null;
let dataAdapter: IDataAdapter | null = null;
let initializePromise: Promise<void> | null = null;

export function configureDataAdapter(adapter: IDataAdapter): void {
  if (dataAdapter) {
    throw new Error("Data adapter already configured");
  }
  dataAdapter = adapter;
}

export function setDataAdapter(adapter: IDataAdapter): void {
  globalDataAdapter = adapter;
  dataAdapter = adapter;
  // Reset initializePromise if the adapter changes
  initializePromise = null;
}

// Default configuration using CosmosDB if no custom adapter is provided
export function configureDefaultDataAdapter(): void {
  if (dataAdapter) {
    return;
  }

  const cosmosAdapter = new CosmosDBDataAdapter({
    endpoint: process.env.CosmosDB_Endpoint!,
    key: process.env.CosmosDB_Key!,
    databaseName: process.env.CosmosDB_DatabaseName!,
    containerName: "consents",
  });

  configureDataAdapter(cosmosAdapter);
}

/**
 * Gets the initialized data adapter instance.
 * Ensures that initialization is only attempted once.
 */
export async function getInitializedDataAdapter(): Promise<IDataAdapter> {
  if (globalDataAdapter) {
    dataAdapter = globalDataAdapter;
    // Reset initializePromise if the adapter changes to global
    if (!initializePromise && typeof dataAdapter?.initialize === "function") {
      initializePromise = dataAdapter
        .initialize()
        .then(() => {})
        .catch((err: Error) => {
          console.error("Failed to initialize global data adapter:", err);
          initializePromise = null; // Reset on error so it can be retried
          throw err;
        });
    }
    if (initializePromise) {
      await initializePromise;
    }
    return dataAdapter!;
  }

  if (!dataAdapter) {
    configureDefaultDataAdapter();
  }

  if (!initializePromise && typeof dataAdapter?.initialize === "function") {
    // Only initialize if the adapter has an initialize method,
    // Custom adapters may handle initialization in their constructor
    initializePromise = dataAdapter
      .initialize()
      .then(() => {})
      .catch((err: Error) => {
        console.error("Failed to initialize data adapter:", err);
        initializePromise = null;
        throw err;
      });
  }

  if (initializePromise) {
    await initializePromise;
  }

  return dataAdapter!;
}
