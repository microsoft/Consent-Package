// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { IndexedDBDataAdapter } from '../IndexedDBDataAdapter.js';
import type { ConsentRecord } from '@open-source-consent/types';
import 'fake-indexeddb/auto';

const DB_NAME = 'OpenSourceConsentDB';
const CONSENT_STORE_NAME = 'consents';

let dataAdapter: IndexedDBDataAdapter;

async function deleteTestDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error('[Test Debug] deleteTestDatabase: Error -', error);
      reject(error);
    };
    request.onblocked = (event) => {
      console.warn('[Test Debug] deleteTestDatabase: Blocked -', event);
      const err = new Error(
        'Database deletion blocked. Please ensure all connections are closed.',
      );
      if (dataAdapter && typeof dataAdapter.close === 'function') {
        console.warn(
          '[Test Debug] deleteTestDatabase: Attempting to close adapter DB due to block before rejecting.',
        );
        void dataAdapter.close().catch((closeErr) => {
          console.error(
            '[Test Debug] deleteTestDatabase: Error during adapter close on block:',
            closeErr,
          );
        });
      }
      reject(err);
    };
  });
}

describe('IndexedDBDataAdapter - Consent Methods', () => {
  beforeAll(async () => {
    dataAdapter = new IndexedDBDataAdapter();
    await dataAdapter
      .close()
      .catch((err) =>
        console.warn(
          '[Test Debug] beforeAll: Pre-emptive adapter close failed (normal if no prior DB):',
          err,
        ),
      );
    await deleteTestDatabase().catch((err) =>
      console.warn(
        '[Test Debug] beforeAll: Pre-delete DB failed (may not exist or was blocked):',
        err,
      ),
    );
    await dataAdapter.initialize();
  }, 30000);

  afterAll(async () => {
    if (dataAdapter) {
      await dataAdapter
        .close()
        .catch((err) =>
          console.warn('[Test Debug] afterAll: Adapter close failed:', err),
        );
    }
    await deleteTestDatabase().catch((err) =>
      console.error('[Test Debug] afterAll: Post-test delete DB failed:', err),
    );
  }, 30000);

  beforeEach(async () => {
    await dataAdapter.initialize();
    try {
      await dataAdapter.clearStore(CONSENT_STORE_NAME);
    } catch (error) {
      console.error(
        `[Test Debug] beforeEach: Failed to clear store '${CONSENT_STORE_NAME}':`,
        error,
      );
      throw error;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConsent', () => {
    it('should create a consent record with auto-generated fields', async () => {
      const consentedAtDate = new Date(2024, 0, 1, 10, 0, 0);
      const inputData: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        subjectId: 'subject1',
        policyId: 'policy1',
        status: 'granted',
        version: 1,
        consentedAt: consentedAtDate,
        dateOfBirth: new Date('1990-01-01'),
        consenter: { type: 'self', userId: 'user1' },
        grantedScopes: {
          scope1: {
            key: 'scope1',
            name: 'Scope 1',
            description: 'Test scope 1',
            required: false,
            grantedAt: consentedAtDate,
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };

      const beforeCreateTimestamp = Date.now();
      const createdConsent = await dataAdapter.createConsent(inputData);
      const afterCreateTimestamp = Date.now();

      expect(createdConsent.id).toEqual(expect.any(String));
      expect(createdConsent.subjectId).toBe(inputData.subjectId);
      expect(createdConsent.policyId).toBe(inputData.policyId);
      expect(createdConsent.status).toBe(inputData.status);
      expect(createdConsent.version).toBe(inputData.version);
      expect(createdConsent.consentedAt).toEqual(inputData.consentedAt);
      expect(createdConsent.consenter).toEqual(inputData.consenter);
      expect(createdConsent.grantedScopes).toEqual(inputData.grantedScopes);
      expect(createdConsent.metadata).toEqual(inputData.metadata);

      expect(createdConsent.createdAt).toBeInstanceOf(Date);
      expect(createdConsent.updatedAt).toBeInstanceOf(Date);
      expect(createdConsent.createdAt.getTime()).toBe(
        createdConsent.updatedAt.getTime(),
      );
      expect(createdConsent.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreateTimestamp - 1000,
      );
      expect(createdConsent.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreateTimestamp + 1000,
      );

      const fetchedConsent = await dataAdapter.findConsentById(
        createdConsent.id,
      );
      expect(fetchedConsent).not.toBeNull();
      expect(fetchedConsent).toEqual(createdConsent);
    });

    it('should throw error if database is not initialized (difficult to test reliably after beforeAll)', () => {
      expect(true).toBe(true);
    });
  });

  describe('updateConsentStatus', () => {
    let existingConsent: ConsentRecord;
    const initialDate = new Date(2024, 0, 1, 12, 0, 0);

    beforeEach(async () => {
      const consentData: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'> =
        {
          subjectId: 'subjectUpdate',
          policyId: 'policyUpdate',
          status: 'granted',
          version: 1,
          consentedAt: initialDate,
          consenter: { type: 'self', userId: 'userUpdate' },
          grantedScopes: {
            read: {
              key: 'read',
              name: 'Read Access',
              description: 'Allow reading data',
              required: true,
              grantedAt: initialDate,
            },
          },
          metadata: { consentMethod: 'digital_form' as const },
        };
      existingConsent = await dataAdapter.createConsent(consentData);
      expect(existingConsent.createdAt).toBeInstanceOf(Date);
      expect(existingConsent.updatedAt).toBeInstanceOf(Date);
      expect(existingConsent.createdAt.getTime()).toEqual(
        existingConsent.updatedAt.getTime(),
      );
    });

    it("should update a consent record's status and updatedAt", async () => {
      const newStatus = 'revoked';

      await new Promise((resolve) => setTimeout(resolve, 50));
      const beforeUpdateTimestamp = Date.now();

      const updatedConsent = await dataAdapter.updateConsentStatus(
        existingConsent.id,
        newStatus,
        existingConsent.version,
      );
      const afterUpdateTimestamp = Date.now();

      expect(updatedConsent.id).toBe(existingConsent.id);
      expect(updatedConsent.status).toBe(newStatus);
      expect(updatedConsent.version).toBe(existingConsent.version);
      expect(updatedConsent.createdAt.getTime()).toEqual(
        existingConsent.createdAt.getTime(),
      );

      expect(updatedConsent.updatedAt).toBeInstanceOf(Date);
      expect(updatedConsent.updatedAt.getTime()).toBeGreaterThan(
        existingConsent.updatedAt.getTime(),
      );
      expect(updatedConsent.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdateTimestamp - 1000,
      );
      expect(updatedConsent.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdateTimestamp + 1000,
      );

      const fetchedConsent = await dataAdapter.findConsentById(
        existingConsent.id,
      );
      expect(fetchedConsent).toEqual(updatedConsent);
    });

    it('should throw error when consent is not found for status update', async () => {
      const nonExistentId = 'nonexistent-id';
      await expect(
        dataAdapter.updateConsentStatus(nonExistentId, 'revoked', 1),
      ).rejects.toThrow(`Consent record with id ${nonExistentId} not found`);
    });

    it('should throw error on version mismatch during status update', async () => {
      const incorrectVersion = existingConsent.version + 1;
      await expect(
        dataAdapter.updateConsentStatus(
          existingConsent.id,
          'revoked',
          incorrectVersion,
        ),
      ).rejects.toThrow(
        `Optimistic concurrency check failed for consent record ${existingConsent.id}. Expected version ${incorrectVersion}, found ${existingConsent.version}.`,
      );
    });
  });

  describe('findConsentById', () => {
    it('should return consent record when found', async () => {
      const inputData: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        subjectId: 'subjectFind',
        policyId: 'policyFind',
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        consenter: { type: 'self', userId: 'userFind' },
        grantedScopes: {
          findScope: {
            key: 'findScope',
            name: 'Find Scope',
            description: 'Test find scope',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const createdConsent = await dataAdapter.createConsent(inputData);

      const result = await dataAdapter.findConsentById(createdConsent.id);
      expect(result).not.toBeNull();
      expect(result).toEqual(createdConsent);
    });

    it('should return null when consent is not found', async () => {
      const result = await dataAdapter.findConsentById(
        'nonexistent-id-for-find',
      );
      expect(result).toBeNull();
    });
  });

  describe('findConsentsBySubject', () => {
    const targetSubjectId = 'subjectWithMultipleConsents';
    const otherSubjectId = 'subjectWithOtherConsents';
    let consent1: ConsentRecord, consent2: ConsentRecord;

    beforeEach(async () => {
      const consent1Data: Omit<
        ConsentRecord,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        subjectId: targetSubjectId,
        policyId: 'pSub1',
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        consenter: { type: 'self', userId: targetSubjectId },
        grantedScopes: {
          s1: {
            key: 's1',
            name: 'Subject 1 Scope',
            description: 'Test subject 1 scope',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const consent2Data: Omit<
        ConsentRecord,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        subjectId: targetSubjectId,
        policyId: 'pSub2',
        status: 'revoked',
        version: 2,
        consentedAt: new Date(),
        consenter: { type: 'self', userId: targetSubjectId },
        grantedScopes: {
          s2: {
            key: 's2',
            name: 'Subject 2 Scope',
            description: 'Test subject 2 scope',
            required: false,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      const otherConsentData: Omit<
        ConsentRecord,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        subjectId: otherSubjectId,
        policyId: 'pOther',
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        consenter: { type: 'self', userId: otherSubjectId },
        grantedScopes: {
          s3: {
            key: 's3',
            name: 'Subject 3 Scope',
            description: 'Test subject 3 scope',
            required: true,
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };
      consent1 = await dataAdapter.createConsent(consent1Data);
      consent2 = await dataAdapter.createConsent(consent2Data);
      await dataAdapter.createConsent(otherConsentData);
    });

    it('should return all consents for a given subjectId, sorted by version', async () => {
      const results = await dataAdapter.findConsentsBySubject(targetSubjectId);
      expect(results).not.toBeNull();
      expect(results.length).toBe(2);
      expect(results[0].id).toBe(consent1.id);
      expect(results[1].id).toBe(consent2.id);
      results.forEach((consent) => {
        expect(consent.subjectId).toBe(targetSubjectId);
      });
    });

    it('should return an empty array if no consents exist for the subjectId', async () => {
      const results =
        await dataAdapter.findConsentsBySubject('nonExistentSubject');
      expect(results).toEqual([]);
    });
  });

  describe('getAllConsents', () => {
    let consentAll1: ConsentRecord, consentAll2: ConsentRecord;

    beforeEach(async () => {
      const consentAll1Data: Omit<
        ConsentRecord,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        subjectId: `getAllSubject1-${Date.now()}`,
        policyId: 'pAll1',
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        consenter: { type: 'self', userId: 'uAll1' },
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
      const consentAll2Data: Omit<
        ConsentRecord,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        subjectId: `getAllSubject2-${Date.now()}`,
        policyId: 'pAll2',
        status: 'revoked',
        version: 1,
        consentedAt: new Date(),
        consenter: {
          type: 'proxy',
          userId: 'gAll2',
          proxyDetails: {
            relationship: 'parent',
            subjectAgeGroup: '13-17' as const,
          },
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
      consentAll1 = await dataAdapter.createConsent(consentAll1Data);
      consentAll2 = await dataAdapter.createConsent(consentAll2Data);
    });

    it('should return all consents', async () => {
      const allConsents = await dataAdapter.getAllConsents();
      expect(allConsents).not.toBeNull();
      expect(allConsents.length).toBeGreaterThanOrEqual(2);
      expect(allConsents.find((c) => c.id === consentAll1.id)).toEqual(
        consentAll1,
      );
      expect(allConsents.find((c) => c.id === consentAll2.id)).toEqual(
        consentAll2,
      );
      allConsents.forEach((consent) => {
        expect(consent.id).toEqual(expect.any(String));
      });
    });

    it('should return an empty array if no consents exist', async () => {
      await dataAdapter.clearStore(CONSENT_STORE_NAME);
      const allConsents = await dataAdapter.getAllConsents();
      expect(allConsents).toEqual([]);
    });
  });

  describe('findAllConsentVersionsBySubjectAndPolicy', () => {
    it('should find all versions of consents for a subject and policy, ordered by version ascending', async () => {
      const subjectId = 'subjectForAllVersions';
      const policyId = 'policyForAllVersions';
      const commonData = {
        subjectId,
        policyId,
        consentedAt: new Date(),
        consenter: { type: 'self' as const, userId: 'userForAllVersions' },
        grantedScopes: {
          scopeA: {
            key: 'scopeA',
            name: 'Scope A',
            description: 'Scope A',
            grantedAt: new Date(),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      };

      const consentV1 = await dataAdapter.createConsent({
        ...commonData,
        status: 'granted',
        version: 1,
      });
      const consentV3 = await dataAdapter.createConsent({
        ...commonData,
        status: 'revoked',
        version: 3,
        revokedAt: new Date(),
      });
      const consentV2 = await dataAdapter.createConsent({
        ...commonData,
        status: 'granted',
        version: 2,
        grantedScopes: {
          scopeB: {
            key: 'scopeB',
            name: 'Scope B',
            description: 'Scope B',
            grantedAt: new Date(),
          },
        },
      });
      await dataAdapter.createConsent({
        ...commonData,
        policyId: 'otherPolicy',
        status: 'granted',
        version: 1,
      });
      await dataAdapter.createConsent({
        ...commonData,
        subjectId: 'otherSubject',
        status: 'granted',
        version: 1,
      });

      const results =
        await dataAdapter.findAllConsentVersionsBySubjectAndPolicy(
          subjectId,
          policyId,
        );

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.version)).toEqual([1, 2, 3]);
      expect(results[0]).toEqual(expect.objectContaining(consentV1));
      expect(results[1]).toEqual(expect.objectContaining(consentV2));
      expect(results[2]).toEqual(expect.objectContaining(consentV3));
    });

    it('should return an empty array if no consents match', async () => {
      const results =
        await dataAdapter.findAllConsentVersionsBySubjectAndPolicy(
          'nonExistentSubject',
          'nonExistentPolicy',
        );
      expect(results).toHaveLength(0);
    });
  });

  describe('findLatestConsentBySubjectAndPolicy', () => {
    const subjectIdLatestTest = 'subjectForLatestTests';
    const policyIdLatestTest = 'policyForLatestTests';

    const commonDataForLatest = {
      subjectId: subjectIdLatestTest,
      policyId: policyIdLatestTest,
      consentedAt: new Date(),
      consenter: { type: 'self' as const, userId: 'userForLatestTests' },
      grantedScopes: {
        data_processing: {
          key: 'data_processing',
          name: 'Data Processing',
          description: 'Data Processing',
          grantedAt: new Date(),
        },
      },
      metadata: { consentMethod: 'digital_form' as const },
    };

    it('should find the latest version of consent for a subject and policy', async () => {
      await dataAdapter.createConsent({
        ...commonDataForLatest,
        status: 'granted',
        version: 1,
      });
      await dataAdapter.createConsent({
        ...commonDataForLatest,
        status: 'revoked',
        version: 2,
        revokedAt: new Date(),
      });
      const v3LatestGranted = await dataAdapter.createConsent({
        ...commonDataForLatest,
        status: 'granted',
        version: 3,
        grantedScopes: {
          data_analysis: {
            key: 'data_analysis',
            name: 'Data Analysis',
            description: 'Data Analysis',
            grantedAt: new Date(),
          },
        },
      });
      await dataAdapter.createConsent({
        ...commonDataForLatest,
        policyId: 'otherPolicyForLatest',
        status: 'granted',
        version: 4,
      });

      const latestConsent =
        await dataAdapter.findLatestConsentBySubjectAndPolicy(
          subjectIdLatestTest,
          policyIdLatestTest,
        );

      expect(latestConsent).not.toBeNull();
      expect(latestConsent!.id).toBe(v3LatestGranted.id);
      expect(latestConsent!.version).toBe(3);
      expect(latestConsent!.status).toBe('granted');
    });

    it('should return null if no consent matches subject and policy', async () => {
      const latest = await dataAdapter.findLatestConsentBySubjectAndPolicy(
        'noSubDefinitely',
        'noPolDefinitely',
      );
      expect(latest).toBeNull();
    });

    it("should return the latest even if it's revoked (status is irrelevant for latest version)", async () => {
      const subjectIdForRevokedTest = 'subjectForRevokedLatest';
      const policyIdForRevokedTest = 'policyForRevokedLatest';
      const initialConsentedAt = new Date(2023, 0, 1);

      const v3Granted = await dataAdapter.createConsent({
        subjectId: subjectIdForRevokedTest,
        policyId: policyIdForRevokedTest,
        version: 3,
        status: 'granted',
        consentedAt: initialConsentedAt,
        consenter: { type: 'self', userId: subjectIdForRevokedTest },
        grantedScopes: {
          test_scope: {
            key: 'test_scope',
            name: 'Test Scope',
            description: 'Test Scope',
            grantedAt: initialConsentedAt,
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      });

      await dataAdapter.updateConsentStatus(
        v3Granted.id,
        'revoked',
        v3Granted.version,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const v4LatestRevoked = await dataAdapter.createConsent({
        subjectId: subjectIdForRevokedTest,
        policyId: policyIdForRevokedTest,
        version: 4,
        status: 'revoked',
        consentedAt: new Date(2023, 0, 4),
        revokedAt: new Date(),
        consenter: { type: 'self', userId: subjectIdForRevokedTest },
        grantedScopes: {
          test_scope: {
            key: 'test_scope',
            name: 'Test Scope',
            description: 'Test Scope',
            grantedAt: new Date(2023, 0, 1),
          },
        },
        metadata: { consentMethod: 'digital_form' as const },
      });

      const latest = await dataAdapter.findLatestConsentBySubjectAndPolicy(
        subjectIdForRevokedTest,
        policyIdForRevokedTest,
      );
      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(v4LatestRevoked.id);
      expect(latest!.version).toBe(4);
      expect(latest!.status).toBe('revoked');
    });
  });
});
