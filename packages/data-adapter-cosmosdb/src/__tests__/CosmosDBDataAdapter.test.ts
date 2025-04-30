import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CosmosClient, PartitionKeyKind } from "@azure/cosmos";
import { CosmosDBDataAdapter } from "../index.js";
import type { ConsentRecord } from "@open-source-consent/types";

// Mock the @azure/cosmos module
vi.mock("@azure/cosmos", () => {
  const mockDatabases = {
    createIfNotExists: vi.fn(),
  };

  return {
    CosmosClient: vi.fn(() => ({
      databases: mockDatabases,
    })),
    PartitionKeyKind: {
      Hash: 0,
    },
  };
});

describe("CosmosDBDataAdapter", () => {
  let dataAdapter: CosmosDBDataAdapter;
  const mockConfig = {
    endpoint: "https://test-endpoint.documents.azure.com:443/",
    key: "test-key",
    databaseName: "test-db",
    containerName: "test-container",
  };

  // Create dates for consistent testing
  const mockNow = new Date("2023-04-20T12:00:00Z");
  const originalDateNow = Date.now;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Date.now to return consistent date
    Date.now = vi.fn(() => mockNow.getTime());

    // Initialize the adapter with mock config
    dataAdapter = new CosmosDBDataAdapter(mockConfig);

    // Setup mock response for database creation
    const mockCosmosClient = new CosmosClient({
      endpoint: mockConfig.endpoint,
      key: mockConfig.key,
    });

    (mockCosmosClient.databases.createIfNotExists as any).mockResolvedValue({
      database: {
        containers: {
          createIfNotExists: vi.fn().mockResolvedValue({
            container: {
              item: vi.fn().mockReturnValue({
                read: vi.fn(),
                replace: vi.fn(),
              }),
              items: {
                create: vi.fn(),
                query: vi.fn().mockReturnValue({
                  fetchAll: vi.fn(),
                }),
              },
            },
          }),
        },
      },
    });
  });

  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  describe("initialize", () => {
    it("should initialize client, database and container", async () => {
      // Act
      await dataAdapter.initialize();

      // Assert
      expect(CosmosClient).toHaveBeenCalledWith({
        endpoint: mockConfig.endpoint,
        key: mockConfig.key,
      });

      const client = new CosmosClient({
        endpoint: mockConfig.endpoint,
        key: mockConfig.key,
      });

      expect(client.databases.createIfNotExists).toHaveBeenCalledWith({
        id: mockConfig.databaseName,
      });

      const database = (await client.databases.createIfNotExists({})).database;
      expect(database.containers.createIfNotExists).toHaveBeenCalledWith({
        id: mockConfig.containerName,
        partitionKey: {
          paths: ["/id"],
          kind: PartitionKeyKind.Hash,
        },
      });
    });

    it("should initialize with custom partition key path", async () => {
      // Arrange
      const adapterWithCustomPartitionKey = new CosmosDBDataAdapter({
        ...mockConfig,
        partitionKeyPath: "/subjectId",
      });

      // Act
      await adapterWithCustomPartitionKey.initialize();

      // Assert
      const client = new CosmosClient({
        endpoint: mockConfig.endpoint,
        key: mockConfig.key,
      });

      const database = (await client.databases.createIfNotExists({})).database;
      expect(database.containers.createIfNotExists).toHaveBeenCalledWith({
        id: mockConfig.containerName,
        partitionKey: {
          paths: ["/subjectId"],
          kind: PartitionKeyKind.Hash,
        },
      });
    });

    it("should reuse existing initialization promise", async () => {
      // Arrange
      const spy = vi.spyOn(dataAdapter as any, "_initialize");

      // Act
      const promise1 = dataAdapter.initialize();
      const promise2 = dataAdapter.initialize();

      await Promise.all([promise1, promise2]);

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("createConsent", () => {
    it("should create a consent record with auto-generated fields", async () => {
      // Arrange
      await dataAdapter.initialize();

      const inputData = {
        subjectId: "subject123",
        policyId: "policy456",
        status: "granted" as const,
        consentedAt: new Date("2023-04-15"),
        consenter: {
          type: "self" as const,
          userId: "user789",
        },
        grantedScopes: {
          email: { grantedAt: new Date("2023-04-15") },
        },
        metadata: {
          consentMethod: "digital_form" as const,
          ipAddress: "127.0.0.1",
        },
      };

      const mockCreatedRecord = {
        id: "generated-id-123",
        version: 1,
        ...inputData,
        createdAt: mockNow,
        updatedAt: mockNow,
      };

      const container = (dataAdapter as any).container;
      container.items.create.mockResolvedValue({
        resource: mockCreatedRecord,
      });

      // Act
      const result = await dataAdapter.createConsent(inputData);

      // Assert
      expect(container.items.create).toHaveBeenCalledWith({
        ...inputData,
        version: 1,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual(mockCreatedRecord);
    });

    it("should throw error when not initialized", async () => {
      // Arrange
      const inputData = {
        subjectId: "subject123",
        policyId: "policy456",
        status: "granted" as const,
        consentedAt: new Date(),
        consenter: {
          type: "self" as const,
          userId: "user789",
        },
        grantedScopes: {},
        metadata: {
          consentMethod: "digital_form" as const,
        },
      };

      // Act & Assert
      await expect(dataAdapter.createConsent(inputData)).rejects.toThrow(
        "CosmosDBDataAdapter not initialized"
      );
    });
  });

  describe("updateConsent", () => {
    it("should update a consent record with new version and timestamp", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "consent123";
      const currentVersion = 2;
      const updates = {
        status: "revoked" as const,
        revokedAt: mockNow,
      };

      const existingConsent = {
        id: consentId,
        version: currentVersion,
        subjectId: "subject123",
        policyId: "policy456",
        status: "granted",
        consentedAt: new Date("2023-01-01"),
        consenter: {
          type: "self",
          userId: "user789",
        },
        grantedScopes: {
          email: { grantedAt: new Date("2023-01-01") },
        },
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      const updatedConsent = {
        ...existingConsent,
        ...updates,
        version: currentVersion + 1,
        updatedAt: mockNow,
      };

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      mockItem.read.mockResolvedValue({
        resource: existingConsent,
      });

      mockItem.replace.mockResolvedValue({
        resource: updatedConsent,
      });

      // Act
      const result = await dataAdapter.updateConsent(
        consentId,
        updates,
        currentVersion
      );

      // Assert
      expect(mockItem.read).toHaveBeenCalled();
      expect(mockItem.replace).toHaveBeenCalledWith({
        ...existingConsent,
        ...updates,
        version: currentVersion + 1,
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual(updatedConsent);
    });

    it("should throw error when consent is not found", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "nonexistent";
      const currentVersion = 1;
      const updates = { status: "revoked" as const };

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      mockItem.read.mockResolvedValue({
        resource: null,
      });

      // Act & Assert
      await expect(
        dataAdapter.updateConsent(consentId, updates, currentVersion)
      ).rejects.toThrow("Consent record not found");
    });

    it("should throw error when version mismatch", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "consent123";
      const currentVersion = 1;
      const actualVersion = 2;
      const updates = { status: "revoked" as const };

      const existingConsent = {
        id: consentId,
        version: actualVersion, // different from currentVersion
        subjectId: "subject123",
        policyId: "policy456",
        status: "granted",
        consentedAt: new Date(),
        consenter: {
          type: "self",
          userId: "user789",
        },
        grantedScopes: {},
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      mockItem.read.mockResolvedValue({
        resource: existingConsent,
      });

      // Act & Assert
      await expect(
        dataAdapter.updateConsent(consentId, updates, currentVersion)
      ).rejects.toThrow("Consent record has been modified");
    });
  });

  describe("findConsentById", () => {
    it("should return consent record when found", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "consent123";
      const mockConsent = {
        id: consentId,
        version: 1,
        subjectId: "subject123",
        policyId: "policy456",
        status: "granted",
        consentedAt: new Date(),
        consenter: {
          type: "self",
          userId: "user789",
        },
        grantedScopes: {},
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      mockItem.read.mockResolvedValue({
        resource: mockConsent,
      });

      // Act
      const result = await dataAdapter.findConsentById(consentId);

      // Assert
      expect(mockItem.read).toHaveBeenCalled();
      expect(result).toEqual(mockConsent);
    });

    it("should return null when consent is not found", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "nonexistent";

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      const error = new Error("Not found");
      (error as any).message = "404 resource not found";
      mockItem.read.mockRejectedValue(error);

      // Act
      const result = await dataAdapter.findConsentById(consentId);

      // Assert
      expect(mockItem.read).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should propagate non-404 errors", async () => {
      // Arrange
      await dataAdapter.initialize();

      const consentId = "consent123";

      const container = (dataAdapter as any).container;
      const mockItem = container.item(consentId);
      mockItem.read.mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect(dataAdapter.findConsentById(consentId)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("findActiveConsentsBySubject", () => {
    it("should return active consents for a subject", async () => {
      // Arrange
      await dataAdapter.initialize();

      const subjectId = "subject123";
      const mockConsents: ConsentRecord[] = [
        {
          id: "consent1",
          version: 1,
          subjectId,
          policyId: "policy1",
          status: "granted",
          consentedAt: new Date(),
          consenter: {
            type: "self",
            userId: subjectId,
          },
          grantedScopes: {
            email: { grantedAt: new Date() },
          },
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "consent2",
          version: 1,
          subjectId,
          policyId: "policy2",
          status: "granted",
          consentedAt: new Date(),
          consenter: {
            type: "self",
            userId: subjectId,
          },
          grantedScopes: {
            profile: { grantedAt: new Date() },
          },
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const container = (dataAdapter as any).container;
      container.items.query.mockReturnValue({
        fetchAll: vi.fn().mockResolvedValue({
          resources: mockConsents,
        }),
      });

      // Act
      const result = await dataAdapter.findActiveConsentsBySubject(subjectId);

      // Assert
      expect(container.items.query).toHaveBeenCalledWith({
        query:
          "SELECT * FROM c WHERE c.subjectId = @subjectId AND c.status = 'granted'",
        parameters: [
          {
            name: "@subjectId",
            value: subjectId,
          },
        ],
      });

      expect(result).toEqual(mockConsents);
    });
  });

  describe("getAllConsents", () => {
    it("should return all consents", async () => {
      // Arrange
      await dataAdapter.initialize();

      const mockConsents: ConsentRecord[] = [
        {
          id: "consent1",
          version: 1,
          subjectId: "subject1",
          policyId: "policy1",
          status: "granted",
          consentedAt: new Date(),
          consenter: {
            type: "self",
            userId: "subject1",
          },
          grantedScopes: {},
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "consent2",
          version: 1,
          subjectId: "subject2",
          policyId: "policy1",
          status: "revoked",
          consentedAt: new Date(),
          revokedAt: new Date(),
          consenter: {
            type: "self",
            userId: "subject2",
          },
          grantedScopes: {},
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const container = (dataAdapter as any).container;
      container.items.query.mockReturnValue({
        fetchAll: vi.fn().mockResolvedValue({
          resources: mockConsents,
        }),
      });

      // Act
      const result = await dataAdapter.getAllConsents();

      // Assert
      expect(container.items.query).toHaveBeenCalledWith({
        query: "SELECT * FROM c",
      });

      expect(result).toEqual(mockConsents);
    });
  });
});
