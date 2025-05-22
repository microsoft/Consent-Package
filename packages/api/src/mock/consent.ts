import { ConsentService } from "@open-source-consent/core";
import { getInitializedDataAdapter } from "../shared/dataAdapter.js";
import type {
  CreateConsentInput,
  ConsentRecord,
  IConsentDataAdapter,
} from "@open-source-consent/types";
import { defaultMockUser } from "./data/defaultUser.js";
import { getLatestActivePolicyByGroupId } from "./policy.js";

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

let hasConsentSeedingBeenAttempted = false;

async function ensureDefaultConsentsSeeded(): Promise<void> {
  if (hasConsentSeedingBeenAttempted) return;
  hasConsentSeedingBeenAttempted = true;

  try {
    const consentService = await getConsentService();
    const existingConsents =
      await consentService.getLatestConsentVersionsForSubject(
        defaultMockUser.id
      );

    if (existingConsents.length === 0 && defaultMockUser.consents) {
      for (const consentTemplate of defaultMockUser.consents) {
        const policyGroupId = consentTemplate.policyId;
        const activePolicy =
          await getLatestActivePolicyByGroupId(policyGroupId);

        if (!activePolicy) {
          console.error(
            `[Mock API] Error seeding consent for subject ${consentTemplate.subjectId}: 
            Policy not found for group ${policyGroupId}. Skipping this consent.`
          );
          continue;
        }

        const consentInput: CreateConsentInput = {
          policyId: activePolicy.id,
          subjectId: consentTemplate.subjectId,
          grantedScopes: Object.keys(consentTemplate.grantedScopes),
          consenter: consentTemplate.consenter || {
            type: "self",
            userId: defaultMockUser.id,
          },
          metadata: {
            consentMethod: "digital_form",
            ...(consentTemplate.metadata?.ipAddress && {
              ipAddress: consentTemplate.metadata.ipAddress,
            }),
            ...(consentTemplate.metadata?.userAgent && {
              userAgent: consentTemplate.metadata.userAgent,
            }),
          },
        };
        await consentService.grantConsent(consentInput);
      }
    }
  } catch (error) {
    console.error("[Mock API] Error seeding default user consents:", error);
  }
}

export async function createConsent(
  consentData: CreateConsentInput
): Promise<ConsentRecord> {
  await ensureDefaultConsentsSeeded();
  const consentService = await getConsentService();
  if (!consentData || !consentData.policyId || !consentData.subjectId) {
    throw new Error("Missing required fields for consent creation.");
  }
  return consentService.grantConsent(consentData);
}

export async function getConsentById(
  consentId: string
): Promise<ConsentRecord | null> {
  await ensureDefaultConsentsSeeded();
  const consentService = await getConsentService();
  if (!consentId) {
    throw new Error("Consent ID is required.");
  }
  return consentService.getConsentDetails(consentId);
}

export async function findActiveConsentsBySubject(
  subjectId: string
): Promise<ConsentRecord[]> {
  await ensureDefaultConsentsSeeded();
  const consentService = await getConsentService();
  if (!subjectId) {
    throw new Error("Subject ID is required.");
  }
  return consentService.getLatestConsentVersionsForSubject(subjectId);
}

export async function getConsentsByProxyId(
  proxyId: string
): Promise<ConsentRecord[]> {
  await ensureDefaultConsentsSeeded();
  const consentService = await getConsentService();
  if (!proxyId) {
    throw new Error("Proxy ID is required.");
  }
  return consentService.getConsentsByProxyId(proxyId);
}
