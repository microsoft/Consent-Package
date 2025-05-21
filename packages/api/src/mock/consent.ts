import { ConsentService } from "@open-source-consent/core";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";
import type {
  CreateConsentInput,
  ConsentRecord,
  IConsentDataAdapter,
} from "@open-source-consent/types";

let consentServiceInstance: ConsentService | null = null;

async function getConsentService(): Promise<ConsentService> {
  if (!consentServiceInstance) {
    const dataAdapter = await getInitializedDataAdapter();
    consentServiceInstance = ConsentService.getInstance(
      dataAdapter as IConsentDataAdapter
    );
  }
  return consentServiceInstance;
}

export async function createConsent(
  consentData: CreateConsentInput
): Promise<ConsentRecord> {
  const consentService = await getConsentService();
  if (!consentData || !consentData.policyId || !consentData.subjectId) {
    throw new Error("Missing required fields for consent creation.");
  }
  return consentService.grantConsent(consentData);
}

export async function getConsentById(
  consentId: string
): Promise<ConsentRecord | null> {
  const consentService = await getConsentService();
  if (!consentId) {
    throw new Error("Consent ID is required.");
  }
  return consentService.getConsentDetails(consentId);
}

export async function findActiveConsentsBySubject(
  subjectId: string
): Promise<ConsentRecord[]> {
  const consentService = await getConsentService();
  if (!subjectId) {
    throw new Error("Subject ID is required.");
  }
  return consentService.getLatestConsentVersionsForSubject(subjectId);
}
