import type { ConsentRecord } from "./ConsentRecord.type.js";

export interface IConsentDataAdapter {
  createConsent(
    data: Omit<ConsentRecord, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<ConsentRecord>;
  updateConsent(
    id: string,
    updates: Partial<Omit<ConsentRecord, "id" | "createdAt">>,
    currentVersion: number
  ): Promise<ConsentRecord>;
  findConsentById(id: string): Promise<ConsentRecord | null>;
  findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;
}
