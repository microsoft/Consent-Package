import type {
  ConsentRecord,
  Policy,
  CreatePolicyInput,
  IDataAdapter,
} from '@open-source-consent/types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'OpenSourceConsentDB';
const CONSENT_STORE_NAME = 'consents';
const POLICY_STORE_NAME = 'policies';
const DB_VERSION = 1;

export class IndexedDBDataAdapter implements IDataAdapter {
  private db: IDBDatabase | null = null;

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let consentStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(CONSENT_STORE_NAME)) {
          consentStore = db.createObjectStore(CONSENT_STORE_NAME, {
            keyPath: 'id',
          });
        } else {
          consentStore = (
            event.target as IDBOpenDBRequest
          ).transaction!.objectStore(CONSENT_STORE_NAME);
        }

        if (!consentStore.indexNames.contains('subjectId_idx')) {
          consentStore.createIndex('subjectId_idx', 'subjectId', {
            unique: false,
          });
        }

        if (!consentStore.indexNames.contains('policyId_idx')) {
          consentStore.createIndex('policyId_idx', 'policyId', {
            unique: false,
          });
        }

        if (!consentStore.indexNames.contains('subjectId_policyId_idx')) {
          consentStore.createIndex(
            'subjectId_policyId_idx',
            ['subjectId', 'policyId'],
            { unique: false },
          );
        }

        if (!consentStore.indexNames.contains('consenterUserId_idx')) {
          consentStore.createIndex('consenterUserId_idx', 'consenter.userId', {
            unique: false,
          });
        }

        let policyStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(POLICY_STORE_NAME)) {
          policyStore = db.createObjectStore(POLICY_STORE_NAME, {
            keyPath: 'id',
          });
        } else {
          policyStore = (
            event.target as IDBOpenDBRequest
          ).transaction!.objectStore(POLICY_STORE_NAME);
        }

        if (!policyStore.indexNames.contains('policyGroupId_idx')) {
          policyStore.createIndex('policyGroupId_idx', 'policyGroupId', {
            unique: false,
          });
        }
        if (!policyStore.indexNames.contains('policyGroupId_status_idx')) {
          policyStore.createIndex(
            'policyGroupId_status_idx',
            ['policyGroupId', 'status'],
            {
              unique: false,
            },
          );
        }
        if (!policyStore.indexNames.contains('status_idx')) {
          policyStore.createIndex('status_idx', 'status', {
            unique: false,
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error(
          'Database error: ',
          (event.target as IDBOpenDBRequest).error,
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async initialize(): Promise<void> {
    await this.openDatabase();
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return Promise.resolve();
  }

  async clearStore(storeName: string): Promise<void> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized. Cannot clear store.');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          console.error(`Error clearing store '${storeName}':`, error);
          reject(error);
        };
        transaction.onabort = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error(
            `Transaction aborted while clearing store '${storeName}':`,
            error,
          );
          reject(error);
        };
      } catch (error) {
        console.error(`General error in clearStore for '${storeName}':`, error);
        reject(error);
      }
    });
  }

  async createConsent(
    data: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConsentRecord> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    const now = new Date();
    const newConsent: ConsentRecord = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const request = store.add(newConsent);

      request.onsuccess = () => {
        resolve(newConsent);
      };

      request.onerror = (event) => {
        console.error(
          'Error creating consent:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      transaction.onabort = (event) => {
        console.error(
          'Create consent transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async updateConsentStatus(
    id: string,
    status: ConsentRecord['status'],
    expectedVersion: number,
  ): Promise<ConsentRecord> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onerror = (event) => {
        console.error(
          'Error getting consent for status update:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      getRequest.onsuccess = () => {
        const existingConsent = getRequest.result as ConsentRecord | undefined;
        if (!existingConsent) {
          const error = new Error(`Consent record with id ${id} not found`);
          console.error(error);
          reject(error);
          return;
        }

        if (existingConsent.version !== expectedVersion) {
          const error = new Error(
            `Optimistic concurrency check failed for consent record ${id}. Expected version ${expectedVersion}, found ${existingConsent.version}.`,
          );
          console.error(error);
          reject(error);
          return;
        }

        const updatedConsent: ConsentRecord = {
          ...existingConsent,
          status: status,
          updatedAt: new Date(),
          // Version remains the same for a status update on the same record per IConsentDataAdapter behavior
        };

        const putRequest = store.put(updatedConsent);
        putRequest.onsuccess = () => {
          resolve(updatedConsent);
        };
        putRequest.onerror = (event) => {
          console.error(
            'Error updating consent status:',
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      };

      transaction.onabort = (event) => {
        console.error(
          'Update consent status transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as ConsentRecord) || null);
      };

      request.onerror = (event) => {
        console.error(
          'Error finding consent by ID:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      transaction.onabort = (event) => {
        console.error(
          'Find consent by ID transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const index = store.index('subjectId_idx');
      const request = index.getAll(subjectId);

      request.onsuccess = () => {
        const consents = (request.result as ConsentRecord[]) || [];
        consents.sort((a, b) => a.version - b.version);
        resolve(consents);
      };

      request.onerror = (event) => {
        console.error(
          'Error finding consents by subject:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find consents by subject transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findLatestConsentBySubjectAndPolicy(
    subjectId: string,
    policyId: string,
  ): Promise<ConsentRecord | null> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const index = store.index('subjectId_policyId_idx');
      const request = index.getAll([subjectId, policyId]);

      request.onsuccess = () => {
        const consents = (request.result as ConsentRecord[]) || [];
        if (consents.length === 0) {
          resolve(null);
          return;
        }
        consents.sort((a, b) => b.version - a.version);
        resolve(consents[0]);
      };

      request.onerror = (event) => {
        console.error(
          'Error finding latest consent by subject and policy:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find latest consent transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findAllConsentVersionsBySubjectAndPolicy(
    subjectId: string,
    policyId: string,
  ): Promise<ConsentRecord[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const index = store.index('subjectId_policyId_idx');
      const request = index.getAll([subjectId, policyId]);

      request.onsuccess = () => {
        const consents = (request.result as ConsentRecord[]) || [];
        consents.sort((a, b) => a.version - b.version);
        resolve(consents);
      };

      request.onerror = (event) => {
        console.error(
          'Error finding all consent versions by subject and policy:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find all consent versions transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async getAllConsents(): Promise<ConsentRecord[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as ConsentRecord[]);
      };

      request.onerror = (event) => {
        console.error(
          'Error getting all consents:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      transaction.onabort = (event) => {
        console.error(
          'Get all consents transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async getConsentsByProxyId(proxyId: string): Promise<ConsentRecord[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(CONSENT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CONSENT_STORE_NAME);
      const index = store.index('consenterUserId_idx');
      const request = index.getAll(proxyId);

      request.onsuccess = (event) => {
        const allRecordsForUser = (event.target as IDBRequest<ConsentRecord[]>)
          .result;
        if (allRecordsForUser) {
          const proxyRecords = allRecordsForUser.filter(
            (record) => record.consenter && record.consenter.type === 'proxy',
          );
          resolve(proxyRecords);
        } else {
          resolve([]);
        }
      };

      request.onerror = (event) => {
        console.error(
          `Error fetching consents by proxyId ${proxyId} using index:`,
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      transaction.onabort = (event) => {
        console.error(
          `Transaction aborted while fetching consents for proxyId ${proxyId}:`,
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async createPolicy(data: CreatePolicyInput): Promise<Policy> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    const now = new Date();

    const newPolicy: Policy = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const request = store.add(newPolicy);

      request.onsuccess = () => {
        resolve(newPolicy);
      };
      request.onerror = (event) => {
        console.error(
          'Error creating policy:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Create policy transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async updatePolicyStatus(
    policyId: string,
    status: Policy['status'],
    expectedVersion: number,
  ): Promise<Policy> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const getRequest = store.get(policyId);

      getRequest.onerror = (event) => {
        console.error(
          'Error getting policy for status update:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      getRequest.onsuccess = () => {
        const existingPolicy = getRequest.result as Policy | undefined;
        if (!existingPolicy) {
          const error = new Error(`Policy with id ${policyId} not found`);
          console.error(error);
          reject(error);
          return;
        }

        if (existingPolicy.version !== expectedVersion) {
          const error = new Error(
            `Optimistic concurrency check failed for policy ${policyId}. Expected version ${expectedVersion}, found ${existingPolicy.version}.`,
          );
          console.error(error);
          reject(error);
          return;
        }

        const updatedPolicy: Policy = {
          ...existingPolicy,
          status: status,
          version: existingPolicy.version,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updatedPolicy);
        putRequest.onsuccess = () => {
          resolve(updatedPolicy);
        };
        putRequest.onerror = (event) => {
          console.error(
            'Error updating policy status:',
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      };
      transaction.onabort = (event) => {
        console.error(
          'Update policy status transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findPolicyById(policyId: string): Promise<Policy | null> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const request = store.get(policyId);

      request.onsuccess = () => {
        resolve((request.result as Policy) || null);
      };
      request.onerror = (event) => {
        console.error(
          'Error finding policy by ID:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find policy by ID transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findLatestActivePolicyByGroupId(
    policyGroupId: string,
  ): Promise<Policy | null> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const index = store.index('policyGroupId_status_idx');
      const request = index.getAll([policyGroupId, 'active']);

      request.onsuccess = () => {
        const activePolicies = (request.result as Policy[]) || [];
        if (activePolicies.length === 0) {
          resolve(null);
          return;
        }
        activePolicies.sort((a, b) => b.version - a.version);
        resolve(activePolicies[0]);
      };
      request.onerror = (event) => {
        console.error(
          'Error finding latest active policy by group ID:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find latest active policy transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async findAllPolicyVersionsByGroupId(
    policyGroupId: string,
  ): Promise<Policy[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const index = store.index('policyGroupId_idx');
      const request = index.getAll(policyGroupId);

      request.onsuccess = () => {
        const policies = (request.result as Policy[]) || [];
        policies.sort((a, b) => a.version - b.version);
        resolve(policies);
      };
      request.onerror = (event) => {
        console.error(
          'Error finding all policy versions by group ID:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'Find all policy versions transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }

  async listPolicies(): Promise<Policy[]> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(POLICY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(POLICY_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const policies = (request.result as Policy[]) || [];
        policies.sort((a, b) => {
          if (a.policyGroupId < b.policyGroupId) return -1;
          if (a.policyGroupId > b.policyGroupId) return 1;
          return b.version - a.version;
        });
        resolve(policies);
      };
      request.onerror = (event) => {
        console.error(
          'Error listing policies:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
      transaction.onabort = (event) => {
        console.error(
          'List policies transaction aborted:',
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  }
}
