import type {
  ConsentRecord,
  IConsentDataAdapter,
} from "@open-source-consent/types";

export class MockDataAdapter implements IConsentDataAdapter {
  private consents: Map<string, ConsentRecord> = new Map();
  private currentIdCounter = 0;

  private generateId(): string {
    this.currentIdCounter++;
    return `mock-consent-${this.currentIdCounter}`;
  }

  async createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ConsentRecord> {
    const now = new Date();
    const id = this.generateId();

    const consent: ConsentRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.consents.set(id, consent);
    return consent;
  }

  async updateConsent(
    id: string,
    updates: Partial<Omit<ConsentRecord, "id" | "createdAt">>,
    currentVersion: number
  ): Promise<ConsentRecord> {
    const existingConsent = this.consents.get(id);
    if (!existingConsent) {
      throw new Error(`Consent record with id ${id} not found`);
    }
    if (existingConsent.version !== currentVersion) {
      throw new Error(
        `Optimistic concurrency check failed for consent record ${id}. Expected version ${currentVersion}, found ${existingConsent.version}.`
      );
    }
    const updatedConsent = {
      ...existingConsent,
      ...updates,
      version: currentVersion + 1,
      updatedAt: new Date(),
    };
    this.consents.set(id, updatedConsent);
    return updatedConsent;
  }

  async updateConsentStatus(
    id: string,
    status: ConsentRecord["status"],
    expectedVersion: number
  ): Promise<ConsentRecord> {
    const existingConsent = this.consents.get(id);
    if (!existingConsent) {
      throw new Error(`Consent record with id ${id} not found`);
    }
    if (existingConsent.version !== expectedVersion) {
      throw new Error(
        `Optimistic concurrency check failed for consent record ${id}. Expected version ${expectedVersion}, found ${existingConsent.version}.`
      );
    }
    const updatedConsent: ConsentRecord = {
      ...existingConsent,
      status: status,
      updatedAt: new Date(),
      // Version remains the same for a status update on the same record
    };
    this.consents.set(id, updatedConsent);
    return updatedConsent;
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    return this.consents.get(id) || null;
  }

  async findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter(
      (consent) => consent.subjectId === subjectId
    );
  }

  async findLatestConsentBySubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord | null> {
    const relevantConsents = Array.from(this.consents.values()).filter(
      (c) => c.subjectId === subjectId && c.policyId === policyId
    );
    if (relevantConsents.length === 0) return null;
    relevantConsents.sort((a, b) => b.version - a.version); // Sort descending by version
    return relevantConsents[0];
  }

  async findAllConsentVersionsBySubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord[]> {
    const relevantConsents = Array.from(this.consents.values()).filter(
      (c) => c.subjectId === subjectId && c.policyId === policyId
    );
    relevantConsents.sort((a, b) => a.version - b.version); // Sort ascending by version
    return relevantConsents;
  }

  async getAllConsents(): Promise<ConsentRecord[]> {
    // Returns all consents, similar to a simple table scan for mocks
    return Array.from(this.consents.values());
  }

  async getConsentsByProxyId(proxyId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter(
      (consent) =>
        consent.consenter &&
        consent.consenter.type === "proxy" &&
        consent.consenter.userId === proxyId
    );
  }
}
