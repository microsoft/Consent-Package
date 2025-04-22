import { CosmosClient, Container } from "@azure/cosmos";
import type {
  ConsentRecord,
  IConsentDataAdapter,
} from "@open-source-consent/core";

interface CosmosDBConfig {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
}

export class CosmosDBDataAdapter implements IConsentDataAdapter {
  private client: CosmosClient;
  private container: Container;

  constructor(config: CosmosDBConfig) {
    this.client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
    });
    this.container = this.client
      .database(config.databaseName)
      .container(config.containerName);
  }

  async createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<ConsentRecord> {
    const now = new Date();
    const consentRecord: Omit<ConsentRecord, "id"> = {
      ...data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await this.container.items.create(consentRecord);
    return resource as ConsentRecord;
  }

  async updateConsent(
    id: string,
    updates: Partial<Omit<ConsentRecord, "id" | "createdAt">>,
    currentVersion: number
  ): Promise<ConsentRecord> {
    const { resource: existingConsent } = await this.container.item(id).read();
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

    const { resource } = await this.container.item(id).replace(updatedConsent);
    return resource as ConsentRecord;
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    try {
      const { resource } = await this.container.item(id).read();
      return resource as ConsentRecord;
    } catch (error) {
      if ((error as any).code === 404) {
        return null;
      }
      throw error;
    }
  }

  async findActiveConsentsBySubject(
    subjectId: string
  ): Promise<ConsentRecord[]> {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.subjectId = @subjectId AND c.status = 'granted'",
      parameters: [
        {
          name: "@subjectId",
          value: subjectId,
        },
      ],
    };

    const { resources } = await this.container.items
      .query(querySpec)
      .fetchAll();
    return resources;
  }
}
