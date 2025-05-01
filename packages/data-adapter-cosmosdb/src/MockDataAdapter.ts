import type {
  ConsentRecord,
  IConsentDataAdapter,
} from "@open-source-consent/types";

export class MockDataAdapter implements IConsentDataAdapter {
  private consents: Map<string, ConsentRecord> = new Map();
  private currentId = 0;

  async createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<ConsentRecord> {
    const now = new Date();
    const id = (++this.currentId).toString();
    const consent: ConsentRecord = {
      ...data,
      id,
      version: 1,
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
    const existing = this.consents.get(id);
    if (!existing) {
      throw new Error(`Consent with id ${id} not found`);
    }
    if (existing.version !== currentVersion) {
      throw new Error(
        `Version mismatch. Expected ${currentVersion}, got ${existing.version}`
      );
    }

    const updated: ConsentRecord = {
      ...existing,
      ...updates,
      version: currentVersion + 1,
      updatedAt: new Date(),
    };
    this.consents.set(id, updated);
    return updated;
  }

  async findConsentById(id: string): Promise<ConsentRecord | null> {
    return this.consents.get(id) || null;
  }

  async findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter(
      (consent) => consent.subjectId === subjectId
    );
  }
}
