import type { Container, Database } from "@azure/cosmos";
import {
  CosmosClient,
  PartitionKeyKind,
  type SqlQuerySpec,
} from "@azure/cosmos";
import type {
  ConsentRecord,
  Policy,
  CreatePolicyInput,
  IDataAdapter,
} from "@open-source-consent/types";
import { v4 as uuidv4 } from "uuid";

// Constant for the partition key value for policy documents
const POLICY_PARTITION_KEY_VALUE = "_POLICY_";

export interface CosmosDBConfig {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
  partitionKeyPath?: string;
}

export class CosmosDBDataAdapter implements IDataAdapter {
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private dataContainer: Container | null = null;
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

    const partitionKeyPath = this.config.partitionKeyPath || "/subjectId";

    const { container } = await this.database.containers.createIfNotExists({
      id: this.config.containerName,
      partitionKey: {
        paths: [partitionKeyPath],
        kind: PartitionKeyKind.Hash,
      },
      indexingPolicy: {
        automatic: true,
        indexingMode: "consistent",
        includedPaths: [{ path: "/*" }],
        excludedPaths: [{ path: '/"_etag"/?' }],
        compositeIndexes: [
          [
            { path: "/policyGroupId", order: "ascending" },
            { path: "/version", order: "descending" },
          ],
        ],
      },
    });
    this.dataContainer = container;
    // eslint-disable-next-line no-console
    console.log(
      `CosmosDB Adapter initialized: DB='${this.config.databaseName}', Container='${this.config.containerName}', PartitionKey='${partitionKeyPath}'`
    );
  }

  private getInitializedContainer(): Container {
    if (!this.dataContainer) {
      throw new Error(
        "CosmosDBDataAdapter not initialized. Call initialize() first."
      );
    }
    return this.dataContainer;
  }

  async createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ConsentRecord> {
    const container = this.getInitializedContainer();
    const now = new Date();
    const newId = uuidv4();

    // version is now expected to be in data, and subjectId is also in data
    const consentDoc: ConsentRecord & { docType: string } = {
      ...data,
      id: newId,
      docType: "consent",
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await container.items.create(consentDoc);
    if (!resource) {
      throw new Error("Failed to create consent record");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { docType, ...rest } = resource as any;
    return rest as ConsentRecord;
  }

  async updateConsentStatus(
    id: string,
    status: ConsentRecord["status"],
    expectedVersion: number
  ): Promise<ConsentRecord> {
    const container = this.getInitializedContainer();

    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id AND c.docType = 'consent'",
      parameters: [{ name: "@id", value: id }],
    };

    // Expect SDK to deserialize dates based on this type
    const { resources } = await container.items
      .query<ConsentRecord & { subjectId: string; docType: string }>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      throw new Error(`Consent record with id ${id} not found`);
    }
    // existingConsent should have Date objects for date fields
    const existingConsent = resources[0];

    if (existingConsent.version !== expectedVersion) {
      throw new Error(
        `Optimistic concurrency check failed for consent record ${id}. Expected version ${expectedVersion}, found ${existingConsent.version}.`
      );
    }

    const updatedConsentDocument = {
      id: existingConsent.id,
      version: existingConsent.version,
      subjectId: existingConsent.subjectId,
      policyId: existingConsent.policyId,
      status: status,
      consentedAt: existingConsent.consentedAt,
      revokedAt: existingConsent.revokedAt,
      consenter: existingConsent.consenter,
      grantedScopes: existingConsent.grantedScopes,
      revokedScopes: existingConsent.revokedScopes,
      metadata: existingConsent.metadata,
      createdAt: existingConsent.createdAt,
      updatedAt: new Date(),
      docType: "consent",
    };

    const { resource: replacedResource } = await container
      .item(id, existingConsent.subjectId)
      .replace(updatedConsentDocument);

    if (!replacedResource) {
      throw new Error(`Failed to update status for consent record ${id}`);
    }

    // replacedResource might have extra fields (_rid, docType etc.)
    // We need to return only ConsentRecord fields.
    // Assume replacedResource contains all ConsentRecord fields correctly typed (dates as Date).
    // Explicitly ignore docType if it exists on replacedResource.
    const { docType: _ignoredDocType, ...rest } = replacedResource as any;

    // Assume 'rest' has the correct structure and types (including Date objects)
    return rest as ConsentRecord;
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    const container = this.getInitializedContainer();
    // Cross-partition query is needed if subjectId (partition key) is unknown.
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id AND c.docType = 'consent'",
      parameters: [{ name: "@id", value: id }],
    };

    const { resources } = await container.items
      .query<any>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { docType, ...rest } = resources[0];
    return rest as ConsentRecord;
  }

  async findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.docType = 'consent' AND c.subjectId = @subjectId",
      parameters: [
        {
          name: "@subjectId",
          value: subjectId,
        },
      ],
    };
    // This becomes an efficient single-partition query
    const { resources } = await container.items
      .query<ConsentRecord>(querySpec, { partitionKey: subjectId })
      .fetchAll();
    return resources;
  }

  async getAllConsents(): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.docType = 'consent'",
    };

    const { resources } = await container.items
      .query<ConsentRecord>(querySpec)
      .fetchAll();
    return resources;
  }

  async createPolicy(data: CreatePolicyInput): Promise<Policy> {
    const container = this.getInitializedContainer();
    const now = new Date();
    const newId = uuidv4();

    const policyRecord: Omit<Policy, "id" | "createdAt" | "updatedAt"> & {
      id: string;
      docType: string;
      createdAt: Date;
      updatedAt: Date;
      subjectId: string;
    } = {
      ...data,
      id: newId,
      docType: "policy",
      version: data.version || 1,
      createdAt: now,
      updatedAt: now,
      subjectId: POLICY_PARTITION_KEY_VALUE,
    };

    const { resource } = await container.items.create(policyRecord);
    if (!resource) {
      throw new Error("Failed to create policy record");
    }
    const createdPolicy = resource as Policy & {
      docType: string;
      subjectId: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { docType, subjectId, ...rest } = createdPolicy;
    return rest as Policy;
  }

  async updatePolicyStatus(
    policyId: string,
    status: Policy["status"],
    expectedVersion: number
  ): Promise<Policy> {
    const container = this.getInitializedContainer();

    // Fetch the policy using a query to avoid direct .read() issues with emulator
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.id = @id AND c.docType = 'policy' AND c.subjectId = @pk",
      parameters: [
        { name: "@id", value: policyId },
        { name: "@pk", value: POLICY_PARTITION_KEY_VALUE },
      ],
    };
    const { resources } = await container.items
      .query<
        Policy & { docType: string; subjectId: string }
      >(querySpec, { partitionKey: POLICY_PARTITION_KEY_VALUE })
      .fetchAll();

    if (resources.length === 0) {
      throw new Error(`Policy with id ${policyId} not found`);
    }
    const existingPolicy = resources[0];

    if (existingPolicy.docType !== "policy") {
      throw new Error(
        `Policy with id ${policyId} not found or not a policy document.`
      );
    }

    if (existingPolicy.version !== expectedVersion) {
      throw new Error(
        `Optimistic concurrency check failed for policy ${policyId}. Expected version ${expectedVersion}, found ${existingPolicy.version}.`
      );
    }

    const updatedPolicyDocument = {
      id: existingPolicy.id,
      policyGroupId: existingPolicy.policyGroupId,
      version: existingPolicy.version,
      status: status,
      effectiveDate: existingPolicy.effectiveDate,
      contentSections: existingPolicy.contentSections,
      availableScopes: existingPolicy.availableScopes,
      createdAt: existingPolicy.createdAt,
      updatedAt: new Date(),
      docType: existingPolicy.docType,
      subjectId: existingPolicy.subjectId,
      title: existingPolicy.title,
    };

    const { resource: replacedResource } = await container
      .item(policyId, POLICY_PARTITION_KEY_VALUE)
      .replace(updatedPolicyDocument);

    if (!replacedResource) {
      throw new Error(`Failed to update status for policy ${policyId}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { docType, subjectId, ...rest } = replacedResource;
    return rest as Policy;
  }

  async findPolicyById(policyId: string): Promise<Policy | null> {
    const container = this.getInitializedContainer();
    try {
      const querySpec = {
        query:
          "SELECT * FROM c WHERE c.id = @id AND c.docType = 'policy' AND c.subjectId = @pk",
        parameters: [
          { name: "@id", value: policyId },
          { name: "@pk", value: POLICY_PARTITION_KEY_VALUE },
        ],
      };

      const { resources } = await container.items
        .query<
          Policy & { docType: string; subjectId: string }
        >(querySpec, { partitionKey: POLICY_PARTITION_KEY_VALUE })
        .fetchAll();

      if (resources.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { docType, subjectId, ...rest } = resources[0];
        return rest as Policy;
      }
      return null;
    } catch (error: unknown) {
      console.error(
        `Error finding policy by ID ${policyId} using query:`,
        error
      );
      throw error;
    }
  }

  async findLatestActivePolicyByGroupId(
    policyGroupId: string
  ): Promise<Policy | null> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: `SELECT * FROM c
              WHERE c.docType = 'policy'
              AND c.subjectId = @policyPartitionKey
              AND c.policyGroupId = @policyGroupId
              AND c.status = 'active'`,
      parameters: [
        { name: "@policyPartitionKey", value: POLICY_PARTITION_KEY_VALUE },
        { name: "@policyGroupId", value: policyGroupId },
      ],
    };

    const { resources } = await container.items
      .query<Policy>(querySpec, { partitionKey: POLICY_PARTITION_KEY_VALUE })
      .fetchAll();

    if (resources.length === 0) {
      return null;
    }

    // Sort by version descending in code
    resources.sort((a, b) => b.version - a.version);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { docType, subjectId, ...rest } = resources[0] as Policy & {
      docType?: string;
      subjectId?: string;
    };
    return rest as Policy;
  }

  async findAllPolicyVersionsByGroupId(
    policyGroupId: string
  ): Promise<Policy[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: `SELECT * FROM c
              WHERE c.docType = 'policy'
              AND c.subjectId = @policyPartitionKey
              AND c.policyGroupId = @policyGroupId
              ORDER BY c.version ASC`,
      parameters: [
        { name: "@policyPartitionKey", value: POLICY_PARTITION_KEY_VALUE },
        { name: "@policyGroupId", value: policyGroupId },
      ],
    };
    const { resources } = await container.items
      .query<Policy>(querySpec, { partitionKey: POLICY_PARTITION_KEY_VALUE }) // Specify partition key
      .fetchAll();
    return resources;
  }

  async listPolicies(): Promise<Policy[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: `SELECT * FROM c 
              WHERE c.docType = 'policy'
              AND c.subjectId = @policyPartitionKey
              ORDER BY c.policyGroupId ASC, c.version DESC`,
      parameters: [
        { name: "@policyPartitionKey", value: POLICY_PARTITION_KEY_VALUE },
      ],
    };
    const { resources } = await container.items
      .query<Policy>(querySpec, { partitionKey: POLICY_PARTITION_KEY_VALUE }) // Specify partition key
      .fetchAll();
    return resources;
  }

  async findLatestConsentBySubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord | null> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query:
        "SELECT * FROM c " +
        "WHERE c.docType = 'consent' " +
        "AND c.subjectId = @subjectId " +
        "AND c.policyId = @policyId",
      parameters: [
        { name: "@subjectId", value: subjectId },
        { name: "@policyId", value: policyId },
      ],
    };

    const { resources } = await container.items
      .query<ConsentRecord>(querySpec, {
        partitionKey: subjectId,
      })
      .fetchAll();

    if (resources.length === 0) {
      return null;
    }

    // Sort in application code to find the latest version
    resources.sort((a, b) => b.version - a.version);

    return resources[0]; // The first element after sorting is the latest
  }

  async findAllConsentVersionsBySubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec = {
      query: `SELECT * FROM c 
              WHERE c.docType = 'consent' 
              AND c.subjectId = @subjectId 
              AND c.policyId = @policyId 
              ORDER BY c.version ASC`,
      parameters: [
        { name: "@subjectId", value: subjectId },
        { name: "@policyId", value: policyId },
      ],
    };
    const { resources } = await container.items
      .query<ConsentRecord>(querySpec, { partitionKey: subjectId })
      .fetchAll();
    return resources;
  }

  async getConsentsByProxyId(proxyId: string): Promise<ConsentRecord[]> {
    const container = this.getInitializedContainer();
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c " +
        "WHERE c.docType = 'consent' " +
        "AND c.consenter.userId = @proxyId " +
        "AND c.consenter.type = 'proxy'",
      parameters: [{ name: "@proxyId", value: proxyId }],
    };

    const { resources } = await container.items
      .query<ConsentRecord>(querySpec)
      .fetchAll();
    return resources;
  }
}
