import { ConsentService } from "@open-source-consent/core";
import { IndexedDBDataAdapter } from "@open-source-consent/data-adapter-indexeddb";
import type {
  CreateConsentInput,
  ConsentRecord,
} from "@open-source-consent/types";

const dataAdapter = new IndexedDBDataAdapter();
const consentService = new ConsentService(dataAdapter);

export async function createConsent(
  consentData: CreateConsentInput
): Promise<ConsentRecord> {
  if (
    !consentData ||
    !consentData.policyId ||
    !consentData.subjectId ||
    !consentData.grantedScopes
  ) {
    throw new Error("Missing required fields for consent creation.");
  }
  return consentService.grantConsent(consentData);
}

export async function getConsentById(
  id: string
): Promise<ConsentRecord | null> {
  if (!id) {
    throw new Error("Consent ID is required.");
  }
  return consentService.getConsentDetails(id);
}

export async function findActiveConsentsBySubject(
  subjectId: string
): Promise<ConsentRecord[]> {
  if (!subjectId) {
    throw new Error("Subject ID is required.");
  }
  return consentService.getLatestConsentVersionsForSubject(subjectId);
}
