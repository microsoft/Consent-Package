import type { Container, Database } from "@azure/cosmos";
import { CosmosClient, PartitionKeyKind } from "@azure/cosmos";
import type {
  IConsentDataAdapter,
  ConsentRecord,
} from "@open-source-consent/types";

interface CosmosDBConfig {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
  partitionKeyPath?: string;
}

export class CosmosDBDataAdapter implements IConsentDataAdapter {
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private container: Container | null = null;
  private config: CosmosDBConfig;
  private initializePromise: Promise<void> | null = null;

  constructor(config: CosmosDBConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = this._initialize();
    }
    return this.initializePromise;
  }

  private async _initialize(): Promise<void> {
    this.client = new CosmosClient({
      endpoint: this.config.endpoint,
      key: this.config.key,
    });

    const { database } = await this.client.databases.createIfNotExists({
      id: this.config.databaseName,
    });
    this.database = database;

    const { container } = await this.database.containers.createIfNotExists({
      id: this.config.containerName,
      partitionKey: {
        paths: [this.config.partitionKeyPath || "/id"],
        kind: PartitionKeyKind.Hash,
      },
    });
    this.container = container;
    // eslint-disable-next-line no-console
    console.log(
      `CosmosDB Adapter initialized: DB='${this.config.databaseName}', Container='${this.config.containerName}'`
    );
  }

  private getInitializedContainer(): Container {
    if (!this.container) {
      throw new Error(
        "CosmosDBDataAdapter not initialized. Call initialize() first."
      );
    }
    return this.container;
  }

  async createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<ConsentRecord> {
    const container = this.getInitializedContainer();
    const now = new Date();
    const consentRecord: Omit<ConsentRecord, "id"> = {
      ...data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await container.items.create(consentRecord);
    return resource as ConsentRecord;
  }

  async updateConsent(
    id: string,
    updates: Partial<Omit<ConsentRecord, "id" | "createdAt">>,
    currentVersion: number
  ): Promise<ConsentRecord> {
    const container = this.getInitializedContainer();
    const { resource: existingConsent } = await container.item(id).read();
    if (!existingConsent) {
      throw new Error("Consent record not found");
    }

    if (existingConsent.version !== currentVersion) {
      throw new Error("Consent record has been modified");
    }

    const updatedConsent = {
      ...existingConsent,
      ...updates,
      version: currentVersion + 1,
      updatedAt: new Date(),
    };

    const { resource } = await container.item(id).replace(updatedConsent);
    return resource as ConsentRecord;
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    const container = this.getInitializedContainer();
    try {
      const { resource } = await container.item(id).read();
      return resource as ConsentRecord;
    } catch (error) {
      if ((error as Error).message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.subjectId = @subjectId",
      parameters: [
        {
          name: "@subjectId",
          value: subjectId,
        },
      ],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }

  // TODO: Remove this, useful for testing but not for production
  async getAllConsents(): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: "SELECT * FROM c",
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }
}
