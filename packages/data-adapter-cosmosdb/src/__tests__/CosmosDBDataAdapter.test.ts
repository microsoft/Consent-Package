// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { CosmosClient } from '@azure/cosmos';
import { type CosmosDBConfig, CosmosDBDataAdapter } from '../index.js';
import type { Policy, CreatePolicyInput } from '@open-source-consent/types';

describe('CosmosDBDataAdapter', () => {
  let dataAdapter: CosmosDBDataAdapter;
  /**
   * This is a default cosmosdb emulator config.
   */
  const testConfig = {
    endpoint: process.env.COSMOSDB_ENDPOINT || 'https://localhost:8081',
    key:
      process.env.COSMOSDB_KEY ||
      'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
    databaseName: `test-db-${Date.now()}`,
    containerName: 'test-container',
    partitionKeyPath: '/subjectId',
  } as CosmosDBConfig;

  beforeAll(async () => {
    dataAdapter = new CosmosDBDataAdapter(testConfig);
    await dataAdapter.initialize();
  }, 30000);

  afterAll(async () => {
    if (dataAdapter) {
      const cleanupClient = new CosmosClient({
        endpoint: testConfig.endpoint,
        key: testConfig.key,
      });
      try {
        await cleanupClient.database(testConfig.databaseName).delete();
      } catch (error) {
        console.error(
          `Failed to delete test database ${testConfig.databaseName}:`,
          error,
        );
      }
    }
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize client, database and container with default /subjectId partition key', async () => {
      // Arrange
      const localAdapterConfig = {
        ...testConfig,
        databaseName: `init-test-db1-${Date.now()}`,
      };
      const localAdapter = new CosmosDBDataAdapter(localAdapterConfig);

      // Act
      await localAdapter.initialize();

      expect(localAdapter).toBeDefined();

      const client = new CosmosClient({
        endpoint: testConfig.endpoint,
        key: testConfig.key,
      });
      await client.database(localAdapterConfig.databaseName).delete(); // Use the specific db name for this test
    });

    it('should initialize with a custom partition key path if provided', async () => {
      // Arrange
      const customPartitionKey = '/customKey';
      const dbNameForCustomKeyTest = `init-test-db2-${Date.now()}`;
      const adapterWithCustomKeyConfig = {
        ...testConfig,
        databaseName: dbNameForCustomKeyTest, // Unique DB name
        partitionKeyPath: customPartitionKey,
      };
      const adapterWithCustomKey = new CosmosDBDataAdapter(
        adapterWithCustomKeyConfig,
      );

      // Act
      await adapterWithCustomKey.initialize();

      // Assert
      expect(adapterWithCustomKey).toBeDefined();

      // Cleanup
      const client = new CosmosClient({
        endpoint: testConfig.endpoint,
        key: testConfig.key,
      });
      await client.database(adapterWithCustomKeyConfig.databaseName).delete();
    });

    it('should reuse existing initialization promise', async () => {
      // Arrange
      const localTestAdapterConfig = {
        ...testConfig,
        databaseName: `reuse-promise-db-${Date.now()}`,
      };
      const localTestAdapter = new CosmosDBDataAdapter(localTestAdapterConfig);
      const spy = vi.spyOn(localTestAdapter as any, '_initialize');

      // Act
      const promise1 = localTestAdapter.initialize();
      const promise2 = localTestAdapter.initialize();

      await Promise.all([promise1, promise2]);

      // Assert
      // The _initialize method should have been called only once for this local adapter.
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();

      // Cleanup for this specific test
      const client = new CosmosClient({
        endpoint: testConfig.endpoint,
        key: testConfig.key,
      });
      try {
        await client.database(localTestAdapterConfig.databaseName).delete();
      } catch (error) {
        console.error(
          `Failed to delete DB for reuse promise test: ${localTestAdapterConfig.databaseName}`,
          error,
        );
      }
    });
  });

  describe('createConsent', () => {
    it('should create a consent record with auto-generated fields set to mocked system time', async () => {
      // dataAdapter is initialized in beforeAll
      const inputData = {
        subjectId: 's1',
        policyId: 'p1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2023-01-01'),
        consenter: { type: 'self' as const, userId: 'u1' },
        grantedScopes: {
          testScope: {
            key: 'testScope',
            name: 'Test Scope',
            description: 'Test Scope',
            grantedAt: new Date('2023-01-01'),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };

      // Act
      const createdConsent = await dataAdapter.createConsent(inputData);

      // Assert
      expect(createdConsent.id).toEqual(expect.any(String));
      expect(createdConsent.subjectId).toBe(inputData.subjectId);
      expect(createdConsent.policyId).toBe(inputData.policyId);
      expect(createdConsent.status).toBe(inputData.status);
      expect(createdConsent.version).toBe(inputData.version);
      expect(createdConsent.consentedAt).toEqual(
        inputData.consentedAt.toISOString(),
      );
      expect(createdConsent.consenter).toEqual(inputData.consenter);
      expect(createdConsent.grantedScopes.testScope.grantedAt).toEqual(
        inputData.grantedScopes.testScope.grantedAt.toISOString(),
      );
      expect(createdConsent.metadata).toEqual(inputData.metadata);
      // Check createdAt and updatedAt are valid, recent date strings
      expect(new Date(createdConsent.createdAt).getTime()).toBeGreaterThan(0);
      expect(
        Date.now() - new Date(createdConsent.createdAt).getTime(),
      ).toBeLessThan(6000);
      expect(new Date(createdConsent.updatedAt).getTime()).toBeGreaterThan(0);
      expect(
        Date.now() - new Date(createdConsent.updatedAt).getTime(),
      ).toBeLessThan(6000);
      expect(createdConsent.updatedAt).toEqual(createdConsent.createdAt);

      // Verify by fetching from DB
      const fetchedConsent = await dataAdapter.findConsentById(
        createdConsent.id,
      );
      expect(fetchedConsent).not.toBeNull();
      // Explicit checks for the fetched object
      expect(fetchedConsent?.id).toBe(createdConsent.id);
      expect(fetchedConsent?.subjectId).toBe(createdConsent.subjectId);
      expect(fetchedConsent?.policyId).toBe(createdConsent.policyId);
      expect(fetchedConsent?.status).toBe(createdConsent.status);
      expect(fetchedConsent?.version).toBe(createdConsent.version);
      expect(fetchedConsent?.consentedAt).toEqual(createdConsent.consentedAt);
      expect(fetchedConsent?.createdAt).toEqual(createdConsent.createdAt);
      expect(fetchedConsent?.updatedAt).toEqual(createdConsent.updatedAt);
      expect(fetchedConsent?.grantedScopes).toEqual(
        createdConsent.grantedScopes,
      );
      expect(fetchedConsent?.consenter).toEqual(createdConsent.consenter);
      expect(fetchedConsent?.metadata).toEqual(createdConsent.metadata);
    });

    it('should throw error when not initialized', async () => {
      // Arrange
      // Create a new, uninitialized adapter instance for this test
      const uninitializedAdapter = new CosmosDBDataAdapter({
        ...testConfig,
        databaseName: 'temp-uninit-db', // doesn't really matter as it won't connect
      });
      // Ensure its internal _initializationPromise is null / not set
      (uninitializedAdapter as any)._initializationPromise = null;
      (uninitializedAdapter as any).dataContainer = undefined;

      const inputData = {
        subjectId: 's1',
        policyId: 'p1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date(),
        consenter: { type: 'self' as const, userId: 'u1' },
        grantedScopes: {},
        metadata: { consentMethod: 'digital_form' as const },
      };

      // Act & Assert
      await expect(
        uninitializedAdapter.createConsent(inputData),
      ).rejects.toThrow(
        'CosmosDBDataAdapter not initialized. Call initialize() first.',
      );
    });
  });

  describe('updateConsentStatus', () => {
    it("should query by id, then update a consent record's status using subjectId as partition key", async () => {
      // Arrange
      const initialData = {
        subjectId: 'subjectForUpdateTest',
        policyId: 'pUpd1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2023-02-01'),
        consenter: { type: 'self' as const, userId: 'uUpd1' },
        grantedScopes: {
          scopeA: {
            key: 'scopeA',
            name: 'Scope A',
            description: 'Scope A',
            grantedAt: new Date('2023-02-01'),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const createdConsent = await dataAdapter.createConsent(initialData);
      expect(createdConsent.createdAt).toEqual(expect.any(String));
      expect(createdConsent.updatedAt).toEqual(expect.any(String));
      expect(new Date(createdConsent.createdAt).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
      expect(new Date(createdConsent.updatedAt).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );

      const consentId = createdConsent.id;
      const currentVersion = createdConsent.version;
      const newStatus = 'revoked' as const;

      // Reset timer to a new time for the update operation to check updatedAt
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Act
      const updatedConsent = await dataAdapter.updateConsentStatus(
        consentId,
        newStatus,
        currentVersion,
      );

      // Assert
      expect(updatedConsent.id).toBe(consentId);
      expect(updatedConsent.status).toBe(newStatus);
      expect(updatedConsent.version).toBe(currentVersion); // Version doesn't change in this implementation with explicit version check
      expect(new Date(updatedConsent.updatedAt).getTime()).toBeGreaterThan(0);
      expect(
        Date.now() - new Date(updatedConsent.updatedAt).getTime(),
      ).toBeLessThan(5000);
      expect(updatedConsent.updatedAt).not.toEqual(createdConsent.createdAt);
      expect(updatedConsent.createdAt).toEqual(createdConsent.createdAt);
      expect(updatedConsent.subjectId).toBe(initialData.subjectId);
      expect(updatedConsent.policyId).toBe(initialData.policyId);

      const fetchedConsent = await dataAdapter.findConsentById(consentId);
      expect(fetchedConsent).not.toBeNull();

      expect(fetchedConsent?.id).toBe(updatedConsent.id);
      expect(fetchedConsent?.status).toBe(updatedConsent.status);
      expect(fetchedConsent?.version).toBe(updatedConsent.version);
      expect(fetchedConsent?.updatedAt).toEqual(updatedConsent.updatedAt);
      expect(fetchedConsent?.createdAt).toEqual(updatedConsent.createdAt);
      expect(fetchedConsent?.consentedAt).toEqual(updatedConsent.consentedAt);
      expect(fetchedConsent?.subjectId).toEqual(updatedConsent.subjectId);
      expect(fetchedConsent?.policyId).toEqual(updatedConsent.policyId);
      expect(fetchedConsent?.consenter).toEqual(updatedConsent.consenter);
      expect(fetchedConsent?.metadata).toEqual(updatedConsent.metadata);
      expect(fetchedConsent?.grantedScopes).toEqual(
        updatedConsent.grantedScopes,
      );
    });

    it('should throw error when consent is not found by query during status update', async () => {
      // Arrange
      const consentId = 'nonexistent-consent-id-for-update';
      const newStatus = 'revoked' as const;

      // Act & Assert
      await expect(
        dataAdapter.updateConsentStatus(consentId, newStatus, 1),
      ).rejects.toThrow(`Consent record with id ${consentId} not found`);
    });

    it('should throw error when version mismatch after query during status update', async () => {
      // Arrange
      const initialData = {
        subjectId: 'subjectForVersionMismatch',
        policyId: 'pVm1',
        status: 'granted' as const,
        version: 2, // Initial version in DB will be this
        consentedAt: new Date('2023-03-01'),
        consenter: { type: 'self' as const, userId: 'uVm1' },
        grantedScopes: {},
        metadata: { consentMethod: 'digital_form' as const },
      };
      const createdConsent = await dataAdapter.createConsent(initialData);

      const consentId = createdConsent.id;
      const actualVersionInDB = createdConsent.version;
      const incorrectVersionInput = 1;
      const newStatus = 'revoked' as const;

      // Act & Assert
      await expect(
        dataAdapter.updateConsentStatus(
          consentId,
          newStatus,
          incorrectVersionInput,
        ),
      ).rejects.toThrow(
        `Optimistic concurrency check failed for consent record ${consentId}. Expected version ${incorrectVersionInput}, found ${actualVersionInDB}.`,
      );
    });
  });

  describe('findConsentById', () => {
    it('should return consent record when found by cross-partition query', async () => {
      // Arrange
      const initialData = {
        subjectId: 'subjectForFindTest',
        policyId: 'pFind1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2023-04-01'),
        consenter: { type: 'self' as const, userId: 'uFind1' },
        grantedScopes: {
          findScope: {
            key: 'findScope',
            name: 'Find Scope',
            description: 'Find Scope',
            grantedAt: new Date('2023-04-01'),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const createdConsent = await dataAdapter.createConsent(initialData);
      const consentId = createdConsent.id;

      // Act
      const result = await dataAdapter.findConsentById(consentId);

      // Assert
      expect(result).not.toBeNull();

      expect(result?.id).toBe(createdConsent.id);
      expect(result?.subjectId).toBe(createdConsent.subjectId);
      expect(result?.policyId).toBe(createdConsent.policyId);
      expect(result?.status).toBe(createdConsent.status);
      expect(result?.version).toBe(createdConsent.version);
      expect(result?.consentedAt).toEqual(createdConsent.consentedAt);
      expect(result?.createdAt).toEqual(createdConsent.createdAt);
      expect(result?.updatedAt).toEqual(createdConsent.updatedAt);
      expect(result?.grantedScopes).toEqual(createdConsent.grantedScopes);
      expect(result?.consenter).toEqual(createdConsent.consenter);
      expect(result?.metadata).toEqual(createdConsent.metadata);
    });

    it('should return null when consent is not found by query', async () => {
      // Arrange
      const consentId = 'nonexistent-id-for-find';

      // Act
      const result = await dataAdapter.findConsentById(consentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findConsentsBySubject', () => {
    it('should return consents for a subject, querying with partitionKey', async () => {
      // Arrange
      const targetSubjectId = 'subjectWithMultipleConsents';
      const otherSubjectId = 'subjectWithOtherConsents';

      const consent1Data = {
        subjectId: targetSubjectId,
        policyId: 'pSub1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2025-05-01'),
        consenter: { type: 'self' as const, userId: targetSubjectId },
        grantedScopes: {
          s1: {
            key: 's1',
            name: 'S1',
            description: 'S1 access',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const consent2Data = {
        subjectId: targetSubjectId,
        policyId: 'pSub2',
        status: 'revoked' as const,
        version: 2,
        consentedAt: new Date('2025-05-02'),
        consenter: { type: 'self' as const, userId: targetSubjectId },
        grantedScopes: {
          s2: {
            key: 's2',
            name: 'S2',
            description: 'S2 access',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const otherConsentData = {
        subjectId: otherSubjectId,
        policyId: 'pOther1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2025-05-03'),
        consenter: { type: 'self' as const, userId: otherSubjectId },
        grantedScopes: {
          s3: {
            key: 's3',
            name: 'S3',
            description: 'S3 access',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };

      const consent1 = await dataAdapter.createConsent(consent1Data);
      const consent2 = await dataAdapter.createConsent(consent2Data);
      await dataAdapter.createConsent(otherConsentData); // Create but don't need to store the result for this test

      // Act
      const results = await dataAdapter.findConsentsBySubject(targetSubjectId);

      // Assert
      expect(results).not.toBeNull();
      expect(results.length).toBe(2);

      expect(
        results.some(
          (r) => r.id === consent1.id && r.status === consent1.status,
        ),
      ).toBe(true);
      expect(
        results.some(
          (r) => r.id === consent2.id && r.status === consent2.status,
        ),
      ).toBe(true);
      results.forEach((consent) => {
        expect(consent.subjectId).toBe(targetSubjectId);
        if (consent.id === consent1.id) {
          expect(consent.status).toEqual(consent1.status);
          expect(consent.updatedAt).toEqual(consent1.updatedAt);
          expect(consent.grantedScopes).toEqual(consent1.grantedScopes);
        } else if (consent.id === consent2.id) {
          expect(consent.status).toEqual(consent2.status);
          expect(consent.updatedAt).toEqual(consent2.updatedAt);
          expect(consent.grantedScopes).toEqual(consent2.grantedScopes);
        }
      });
    });
  });

  describe('getAllConsents', () => {
    it('should return all consents via a cross-partition query', async () => {
      const consentAll1Data = {
        subjectId: `getAllSubject1-${Date.now()}`,
        policyId: 'pAll1',
        status: 'granted' as const,
        version: 1,
        consentedAt: new Date('2023-06-01'),
        consenter: { type: 'self' as const, userId: 'uAll1' },
        grantedScopes: {
          all1: {
            key: 'all1',
            name: 'All1',
            description: 'All1 access',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const consentAll2Data = {
        subjectId: `getAllSubject2-${Date.now()}`,
        policyId: 'pAll2',
        status: 'revoked' as const,
        version: 1,
        consentedAt: new Date('2023-06-02'),
        consenter: {
          type: 'proxy' as const,
          userId: 'gAll2',
          relation: 'parent',
        },
        grantedScopes: {
          all2: {
            key: 'all2',
            name: 'All2',
            description: 'All2 access',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };

      const createdConsent1 = await dataAdapter.createConsent(consentAll1Data);
      const createdConsent2 = await dataAdapter.createConsent(consentAll2Data);

      // Act
      const allConsents = await dataAdapter.getAllConsents();

      // Assert
      expect(allConsents).not.toBeNull();
      expect(allConsents.length).toBeGreaterThanOrEqual(2);

      const found1 = allConsents.find((c) => c.id === createdConsent1.id);
      const found2 = allConsents.find((c) => c.id === createdConsent2.id);
      expect(found1).toBeDefined();
      expect(found2).toBeDefined();

      expect(found1?.status).toEqual(createdConsent1.status);
      expect(found1?.updatedAt).toEqual(createdConsent1.updatedAt);
      expect(found1?.grantedScopes).toEqual(createdConsent1.grantedScopes);

      expect(found2?.status).toEqual(createdConsent2.status);
      expect(found2?.updatedAt).toEqual(createdConsent2.updatedAt);
      expect(found2?.grantedScopes).toEqual(createdConsent2.grantedScopes);

      allConsents.forEach((consent) => {
        expect(consent.id).toEqual(expect.any(String));
      });
    });
  });

  describe('Policy Management', () => {
    const POLICY_GROUP_ID_1 = 'testPolicyGroup1';
    const POLICY_GROUP_ID_2 = 'testPolicyGroup2';

    describe('createPolicy', () => {
      it('should create a policy record with auto-generated fields and specified version', async () => {
        const policyInput: CreatePolicyInput = {
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          version: 1,
          status: 'draft',
          effectiveDate: new Date('2025-01-01'),
          contentSections: [
            {
              title: 'Intro',
              description: 'Welcome to the policy.',
              content: 'Welcome to the policy.',
            },
          ],
          availableScopes: [
            {
              key: 'read_data',
              name: 'Read Data',
              description: 'Allows reading user data.',
            },
          ],
        };

        const createdPolicy = await dataAdapter.createPolicy(policyInput);

        expect(createdPolicy.id).toEqual(expect.any(String));
        expect(createdPolicy.policyGroupId).toBe(policyInput.policyGroupId);
        expect(createdPolicy.version).toBe(policyInput.version);
        expect(createdPolicy.status).toBe(policyInput.status);
        expect(new Date(createdPolicy.effectiveDate).toISOString()).toBe(
          policyInput.effectiveDate.toISOString(),
        );
        expect(createdPolicy.contentSections).toEqual(
          policyInput.contentSections,
        );
        expect(createdPolicy.availableScopes).toEqual(
          policyInput.availableScopes,
        );
        expect(createdPolicy.createdAt).toEqual(expect.any(String));
        expect(createdPolicy.updatedAt).toEqual(expect.any(String));

        const fetchedPolicy = await dataAdapter.findPolicyById(
          createdPolicy.id,
        );
        expect(fetchedPolicy).not.toBeNull();
        if (fetchedPolicy) {
          expect(fetchedPolicy.id).toBe(createdPolicy.id);
          expect(fetchedPolicy.policyGroupId).toBe(createdPolicy.policyGroupId);
          expect(fetchedPolicy.version).toBe(createdPolicy.version);
          expect(fetchedPolicy.status).toBe(createdPolicy.status);
          expect(fetchedPolicy.effectiveDate).toBe(createdPolicy.effectiveDate); // Adapter returns ISO string
          expect(fetchedPolicy.contentSections).toEqual(
            createdPolicy.contentSections,
          );
          expect(fetchedPolicy.availableScopes).toEqual(
            createdPolicy.availableScopes,
          );
          expect(fetchedPolicy.createdAt).toBe(createdPolicy.createdAt);
          expect(fetchedPolicy.updatedAt).toBe(createdPolicy.updatedAt);
        }
      });

      it('should create a policy record with default version 1 if adapter sets it (type expects version)', async () => {
        const policyInput: CreatePolicyInput = {
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          status: 'active',
          version: 1, // CreatePolicyInput expects version
          effectiveDate: new Date('2025-01-02'),
          contentSections: [
            {
              title: 'Permissions',
              description: 'User permissions section.',
              content: 'User permissions section.',
            },
          ],
          availableScopes: [
            {
              key: 'email_read',
              name: 'Read Email',
              description: 'Access to read emails.',
            },
          ],
        };

        const createdPolicy = await dataAdapter.createPolicy(policyInput);

        expect(createdPolicy.version).toBe(1);
        expect(createdPolicy.policyGroupId).toBe(policyInput.policyGroupId);
        expect(createdPolicy.status).toBe(policyInput.status);
        expect(new Date(createdPolicy.effectiveDate).toISOString()).toBe(
          policyInput.effectiveDate.toISOString(),
        );
        expect(createdPolicy.contentSections).toEqual(
          policyInput.contentSections,
        );
        expect(createdPolicy.availableScopes).toEqual(
          policyInput.availableScopes,
        );
        expect(createdPolicy.createdAt).toEqual(expect.any(String));
        expect(createdPolicy.updatedAt).toEqual(expect.any(String));

        const foundPolicy = await dataAdapter.findPolicyById(createdPolicy.id);
        expect(foundPolicy).not.toBeNull();
        if (foundPolicy) {
          expect(foundPolicy.id).toBe(createdPolicy.id);
          expect(foundPolicy.policyGroupId).toBe(createdPolicy.policyGroupId);
          expect(foundPolicy.version).toBe(createdPolicy.version);
          expect(foundPolicy.status).toBe(createdPolicy.status);
          expect(foundPolicy.effectiveDate).toBe(createdPolicy.effectiveDate);
          expect(foundPolicy.contentSections).toEqual(
            createdPolicy.contentSections,
          );
          expect(foundPolicy.availableScopes).toEqual(
            createdPolicy.availableScopes,
          );
          expect(foundPolicy.createdAt).toBe(createdPolicy.createdAt);
          expect(foundPolicy.updatedAt).toBe(createdPolicy.updatedAt);
          // Specifically check version again for this test's purpose
          expect(foundPolicy.version).toBe(1);
        }
      });

      it('should throw error when trying to create policy if adapter not initialized', async () => {
        const uninitializedAdapter = new CosmosDBDataAdapter({
          ...testConfig,
          databaseName: 'temp-policy-uninit-db',
        });
        (uninitializedAdapter as any)._initializationPromise = null;
        (uninitializedAdapter as any).dataContainer = undefined;

        const policyInput: CreatePolicyInput = {
          title: 'Policy 1',
          policyGroupId: 'pGroupUninit',
          status: 'draft',
          version: 1,
          effectiveDate: new Date(),
          contentSections: [],
          availableScopes: [],
        };
        await expect(
          uninitializedAdapter.createPolicy(policyInput),
        ).rejects.toThrow(
          'CosmosDBDataAdapter not initialized. Call initialize() first.',
        );
      });
    });

    describe('updatePolicyStatus', () => {
      let policyToUpdate: Policy;
      const initialPolicyData: CreatePolicyInput = {
        title: 'Policy 1',
        policyGroupId: POLICY_GROUP_ID_1,
        version: 1,
        status: 'draft',
        effectiveDate: new Date('2025-03-01'),
        contentSections: [
          {
            title: 'Initial',
            description: 'Initial content for update tests.',
            content: 'Initial content for update tests.',
          },
        ],
        availableScopes: [
          {
            key: 'initial_scope',
            name: 'Initial Scope',
            description: 'Scope for update.',
          },
        ],
      };

      beforeEach(async () => {
        policyToUpdate = await dataAdapter.createPolicy(initialPolicyData);
      });

      it("should update a policy's status, increment version, and update 'updatedAt'", async () => {
        const newStatus = 'active';
        const expectedVersionBeforeUpdate = policyToUpdate.version;

        // Ensure a small delay so updatedAt is different if the operation is very fast
        await new Promise((resolve) => setTimeout(resolve, 50));

        const updatedPolicy = await dataAdapter.updatePolicyStatus(
          policyToUpdate.id,
          newStatus,
          expectedVersionBeforeUpdate,
        );

        expect(updatedPolicy.id).toBe(policyToUpdate.id);
        expect(updatedPolicy.status).toBe(newStatus);
        // A status update should not increment the version
        expect(updatedPolicy.version).toBe(expectedVersionBeforeUpdate);
        expect(new Date(updatedPolicy.updatedAt).getTime()).toBeGreaterThan(0);
        expect(
          Date.now() - new Date(updatedPolicy.updatedAt).getTime(),
        ).toBeLessThan(5000);
        expect(updatedPolicy.updatedAt).not.toEqual(policyToUpdate.createdAt); // Should be different
        expect(updatedPolicy.createdAt).toEqual(policyToUpdate.createdAt);
        expect(updatedPolicy.policyGroupId).toBe(policyToUpdate.policyGroupId);
        expect(updatedPolicy.availableScopes).toEqual(
          initialPolicyData.availableScopes,
        );

        const fetchedPolicy = await dataAdapter.findPolicyById(
          policyToUpdate.id,
        );
        expect(fetchedPolicy).not.toBeNull();
        if (fetchedPolicy) {
          expect(fetchedPolicy.id).toBe(updatedPolicy.id);
          expect(fetchedPolicy.policyGroupId).toBe(updatedPolicy.policyGroupId);
          expect(fetchedPolicy.version).toBe(updatedPolicy.version);
          expect(fetchedPolicy.status).toBe(updatedPolicy.status);
          expect(fetchedPolicy.effectiveDate).toBe(updatedPolicy.effectiveDate);
          expect(fetchedPolicy.contentSections).toEqual(
            updatedPolicy.contentSections,
          );
          expect(fetchedPolicy.availableScopes).toEqual(
            updatedPolicy.availableScopes,
          );
          expect(fetchedPolicy.createdAt).toBe(updatedPolicy.createdAt);
          expect(fetchedPolicy.updatedAt).toBe(updatedPolicy.updatedAt);
        }
      });

      it('should throw error if policy for status update is not found', async () => {
        const nonExistentPolicyId = 'non-existent-policy-id-for-update';
        await expect(
          dataAdapter.updatePolicyStatus(nonExistentPolicyId, 'active', 1),
        ).rejects.toThrow(/^Policy with id .* not found/);
      });

      it('should throw error on version mismatch during status update (optimistic concurrency)', async () => {
        const incorrectVersion = policyToUpdate.version + 5;
        await expect(
          dataAdapter.updatePolicyStatus(
            policyToUpdate.id,
            'archived',
            incorrectVersion,
          ),
        ).rejects.toThrow(
          `Optimistic concurrency check failed for policy ${policyToUpdate.id}. Expected version ${incorrectVersion}, found ${policyToUpdate.version}.`,
        );
      });
    });

    describe('findPolicyById', () => {
      it('should return a policy record when found', async () => {
        const policyInput: CreatePolicyInput = {
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          status: 'active',
          version: 1,
          effectiveDate: new Date('2025-02-15'),
          contentSections: [
            {
              title: 'Find Me Section',
              description: 'Details for finding by ID.',
              content: 'Details for finding by ID.',
            },
          ],
          availableScopes: [
            {
              key: 'find_scope',
              name: 'Find Scope',
              description: 'A scope to find.',
            },
          ],
        };
        const createdPolicy = await dataAdapter.createPolicy(policyInput);
        const foundPolicy = await dataAdapter.findPolicyById(createdPolicy.id);

        expect(foundPolicy).not.toBeNull();
        if (foundPolicy) {
          expect(foundPolicy.id).toBe(createdPolicy.id);
          expect(foundPolicy.policyGroupId).toBe(createdPolicy.policyGroupId);
          expect(foundPolicy.version).toBe(createdPolicy.version);
          expect(foundPolicy.status).toBe(createdPolicy.status);
          expect(foundPolicy.effectiveDate).toBe(createdPolicy.effectiveDate);
          expect(foundPolicy.contentSections).toEqual(
            createdPolicy.contentSections,
          );
          expect(foundPolicy.availableScopes).toEqual(
            createdPolicy.availableScopes,
          );
          expect(foundPolicy.createdAt).toBe(createdPolicy.createdAt);
          expect(foundPolicy.updatedAt).toBe(createdPolicy.updatedAt);
        }
      });

      it('should return null if policy is not found', async () => {
        const foundPolicy = await dataAdapter.findPolicyById(
          'non-existent-id-for-find',
        );
        expect(foundPolicy).toBeNull();
      });
    });

    describe('findLatestActivePolicyByGroupId', () => {
      const commonPolicyDetails = {
        effectiveDate: new Date('2025-04-01'),
        contentSections: [
          {
            title: 'Latest Active',
            description: 'Policy for latest active tests.',
            content: 'Policy for latest active tests.',
          },
        ],
        availableScopes: [
          {
            key: 'latest_active_scope',
            name: 'Latest Scope',
            description: 'For these tests.',
          },
        ],
      };
      beforeEach(async () => {
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          version: 1,
          status: 'draft',
        });
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          version: 2,
          status: 'active',
        });
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_1,
          version: 3,
          status: 'archived',
        });
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: POLICY_GROUP_ID_2,
          version: 1,
          status: 'active',
        });
      });

      it('should return the latest active policy for a given group ID', async () => {
        const latestActive =
          await dataAdapter.findLatestActivePolicyByGroupId(POLICY_GROUP_ID_1);
        expect(latestActive).not.toBeNull();
        expect(latestActive?.policyGroupId).toBe(POLICY_GROUP_ID_1);
        expect(latestActive?.version).toBe(2);
        expect(latestActive?.status).toBe('active');
      });

      it('should return null if no active policy exists for the group ID', async () => {
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: 'noActiveGroup',
          version: 1,
          status: 'draft',
        });
        await dataAdapter.createPolicy({
          ...commonPolicyDetails,
          title: 'Policy 1',
          policyGroupId: 'noActiveGroup',
          version: 2,
          status: 'archived',
        });
        const latestActive =
          await dataAdapter.findLatestActivePolicyByGroupId('noActiveGroup');
        expect(latestActive).toBeNull();
      });

      it('should return null if the policy group ID does not exist', async () => {
        const latestActive = await dataAdapter.findLatestActivePolicyByGroupId(
          'nonExistentGroupLatest',
        );
        expect(latestActive).toBeNull();
      });
    });

    describe('findAllPolicyVersionsByGroupId', () => {
      let p1v1: Policy, p1v2: Policy;
      const commonVersionData = {
        effectiveDate: new Date('2025-05-01'),
        contentSections: [
          {
            title: 'All Versions',
            description: 'Content for all versions test.',
            content: 'Content for all versions test.',
          },
        ],
        availableScopes: [
          {
            key: 'version_scope_all',
            name: 'Version Scope',
            description: 'Details...',
          },
        ],
      };

      beforeEach(async () => {
        p1v1 = await dataAdapter.createPolicy({
          ...commonVersionData,
          policyGroupId: 'groupForAllVersions',
          version: 1,
          status: 'draft',
          title: 'Policy 1',
        });
        p1v2 = await dataAdapter.createPolicy({
          ...commonVersionData,
          policyGroupId: 'groupForAllVersions',
          version: 2,
          status: 'active',
          title: 'Policy 1',
        });
        await dataAdapter.createPolicy({
          ...commonVersionData,
          policyGroupId: 'anotherGroupForVersions',
          version: 1,
          status: 'active',
          title: 'Policy 1',
        });
      });

      it('should return all versions of policies for a given group ID, ordered by version ASC', async () => {
        const versions = await dataAdapter.findAllPolicyVersionsByGroupId(
          'groupForAllVersions',
        );
        expect(versions.length).toBe(2);
        expect(versions[0].id).toBe(p1v1.id);
        expect(versions[0].version).toBe(1);
        expect(versions[1].id).toBe(p1v2.id);
        expect(versions[1].version).toBe(2);
      });

      it('should return an empty array if the policy group ID does not exist', async () => {
        const versions = await dataAdapter.findAllPolicyVersionsByGroupId(
          'nonExistentGroupForFindAll',
        );
        expect(versions).toEqual([]);
      });

      it('should return an empty array if the group ID exists but has no policies', async () => {
        const versions = await dataAdapter.findAllPolicyVersionsByGroupId(
          'emptyGroupYetPopulated',
        );
        expect(versions).toEqual([]);
      });
    });

    describe('listPolicies', () => {
      // These variables will be assigned in beforeAll and used to verify their presence in the list.
      let policy_A_v1_listed: Policy,
        policy_A_v2_listed: Policy,
        policy_B_v1_listed: Policy,
        policy_C_v1_listed: Policy;
      const commonListData = {
        effectiveDate: new Date('2025-06-01'),
        contentSections: [
          {
            title: 'List Policies',
            description: 'For listing.',
            content: 'For listing.',
          },
        ],
        availableScopes: [
          {
            key: 'list_scope_key',
            name: 'List Scope',
            description: 'Scope for listing tests.',
          },
        ],
      };
      const P_GROUP_LIST_A = 'listPGroupA'; // Lexicographically first
      const P_GROUP_LIST_B = 'listPGroupB';
      const P_GROUP_LIST_C = 'listPGroupC';

      beforeAll(async () => {
        policy_A_v2_listed = await dataAdapter.createPolicy({
          ...commonListData,
          policyGroupId: P_GROUP_LIST_A,
          version: 2,
          status: 'active',
          title: 'Policy A',
        });
        policy_A_v1_listed = await dataAdapter.createPolicy({
          ...commonListData,
          policyGroupId: P_GROUP_LIST_A,
          version: 1,
          status: 'draft',
          title: 'Policy A',
        });
        policy_B_v1_listed = await dataAdapter.createPolicy({
          ...commonListData,
          policyGroupId: P_GROUP_LIST_B,
          version: 1,
          status: 'active',
          title: 'Policy B',
        });
        policy_C_v1_listed = await dataAdapter.createPolicy({
          ...commonListData,
          policyGroupId: P_GROUP_LIST_C,
          version: 1,
          status: 'draft',
          title: 'Policy C',
        });
      });

      it('should return all policies, ordered by policyGroupId ASC, then version DESC', async () => {
        const allPolicies = await dataAdapter.listPolicies();

        expect(allPolicies.length).toBeGreaterThanOrEqual(4); // At least the ones we specifically created

        // Verify that our specific policies are present
        expect(
          allPolicies.find((p) => p.id === policy_A_v1_listed.id),
        ).toBeDefined();
        expect(
          allPolicies.find((p) => p.id === policy_A_v2_listed.id),
        ).toBeDefined();
        expect(
          allPolicies.find((p) => p.id === policy_B_v1_listed.id),
        ).toBeDefined();
        expect(
          allPolicies.find((p) => p.id === policy_C_v1_listed.id),
        ).toBeDefined();

        // Check sorting logic for a known subset of policies
        // Find indices of the first policy of each group we are interested in.
        const firstIndexOfGroupA = allPolicies.findIndex(
          (p) => p.policyGroupId === P_GROUP_LIST_A,
        );
        const firstIndexOfGroupB = allPolicies.findIndex(
          (p) => p.policyGroupId === P_GROUP_LIST_B,
        );
        const firstIndexOfGroupC = allPolicies.findIndex(
          (p) => p.policyGroupId === P_GROUP_LIST_C,
        );

        // Assert that these groups appear in the expected order (A, then B, then C)
        if (firstIndexOfGroupA !== -1 && firstIndexOfGroupB !== -1) {
          expect(firstIndexOfGroupA).toBeLessThan(firstIndexOfGroupB);
        }
        if (firstIndexOfGroupB !== -1 && firstIndexOfGroupC !== -1) {
          expect(firstIndexOfGroupB).toBeLessThan(firstIndexOfGroupC);
        }

        // For a specific group (e.g., P_GROUP_LIST_A), verify version sorting (DESC)
        const groupAPolicies = allPolicies.filter(
          (p) => p.policyGroupId === P_GROUP_LIST_A,
        );
        if (groupAPolicies.length >= 2) {
          const v2Index = groupAPolicies.findIndex((p) => p.version === 2);
          const v1Index = groupAPolicies.findIndex((p) => p.version === 1);
          expect(v2Index).toBeLessThan(v1Index); // Version 2 should come before version 1
        }
      });
    });
  });
});
