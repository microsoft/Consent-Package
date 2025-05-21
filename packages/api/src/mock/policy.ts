import { PolicyService } from "@open-source-consent/core";
import { IndexedDBDataAdapter } from "@open-source-consent/data-adapter-indexeddb";
import type { CreatePolicyInput, Policy } from "@open-source-consent/types";
import sanitizeHtml from "sanitize-html";
import { defaultCorePolicyJson } from "./data/defaultPolicy.js";

const dataAdapter = new IndexedDBDataAdapter();
const policyService = new PolicyService(dataAdapter);

let hasSeedingBeenAttempted = false;

async function ensureDefaultPolicySeeded(): Promise<void> {
  if (hasSeedingBeenAttempted) return;
  hasSeedingBeenAttempted = true;

  try {
    const existingPolicyForGroup =
      await policyService.getLatestActivePolicyByGroupId(
        defaultCorePolicyJson.policyGroupId
      );

    if (!existingPolicyForGroup) {
      const policyToSeed: CreatePolicyInput = {
        title: defaultCorePolicyJson.title,
        policyGroupId: defaultCorePolicyJson.policyGroupId,
        version: defaultCorePolicyJson.version,
        effectiveDate: defaultCorePolicyJson.effectiveDate,
        status: defaultCorePolicyJson.status,
        contentSections: defaultCorePolicyJson.contentSections.map((cs) => ({
          title: cs.title,
          description: cs.description,
          content: cs.content,
        })),
        availableScopes: defaultCorePolicyJson.availableScopes.map((as) => ({
          key: as.key,
          name: as.name,
          description: as.description,
          required: as.required,
        })),
      };
      await policyService.createPolicy(policyToSeed);
    }
  } catch (error) {
    console.error("[Mock API] Error seeding default policy:", error);
  }
}

export async function createPolicy(
  policyData: CreatePolicyInput
): Promise<Policy> {
  await ensureDefaultPolicySeeded();
  if (
    !policyData ||
    !policyData.policyGroupId ||
    !policyData.status ||
    !policyData.effectiveDate ||
    !policyData.contentSections ||
    !policyData.availableScopes
  ) {
    throw new Error("Missing required fields for policy creation.");
  }

  // Sanitize HTML content before passing to the service
  const processedPolicyData = {
    ...policyData,
    contentSections: policyData.contentSections.map((section) => ({
      ...section,
      content: sanitizeHtml(section.content),
    })),
  };
  return policyService.createPolicy(processedPolicyData);
}

export async function getPolicyById(policyId: string): Promise<Policy | null> {
  await ensureDefaultPolicySeeded();
  if (!policyId) {
    throw new Error("Policy ID is required.");
  }
  return policyService.getPolicyById(policyId);
}

export async function getLatestActivePolicyByGroupId(
  policyGroupId: string
): Promise<Policy | null> {
  await ensureDefaultPolicySeeded();
  if (!policyGroupId) {
    throw new Error("Policy Group ID is required.");
  }
  return policyService.getLatestActivePolicyByGroupId(policyGroupId);
}

export async function getAllPolicyVersionsByGroupId(
  policyGroupId: string
): Promise<Policy[]> {
  await ensureDefaultPolicySeeded();
  if (!policyGroupId) {
    throw new Error("Policy Group ID is required.");
  }
  return policyService.getAllPolicyVersionsByGroupId(policyGroupId);
}

export async function listPolicies(): Promise<Policy[]> {
  await ensureDefaultPolicySeeded();
  return policyService.listPolicies();
}
