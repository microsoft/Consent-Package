import type {
  IPolicyDataAdapter,
  Policy,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from "@open-source-consent/types";
import { BaseService } from "./BaseService.js";

export class PolicyService extends BaseService<IPolicyDataAdapter> {
  /**
   * Creates a new policy (can be the first version for a new policyGroupId or a subsequent version).
   * If creating a subsequent version, ensure policyGroupId and incremented version are handled correctly.
   * @param data - Input data for the new policy.
   * @returns The created policy.
   */
  async createPolicy(
    data: CreatePolicyInput & { version?: number }
  ): Promise<Policy> {
    // Validation for CreatePolicyInput (all fields required for a new policy definition)
    if (
      !data.policyGroupId ||
      !data.contentSections ||
      !data.availableScopes ||
      !data.effectiveDate ||
      !data.status
    ) {
      throw new Error(
        "Missing required fields for policy creation: policyGroupId, contentSections, availableScopes, effectiveDate, status."
      );
    }
    // The adapter's createPolicy should handle versioning logic internally based on whether a version is provided
    // or by looking up the latest version for the policyGroupId if version is not provided.
    return this.adapter.createPolicy(data);
  }

  /**
   * Creates a new version of an existing policy.
   * The old policy version (identified by `policyIdToSupersede`) will have its status updated to 'archived'.
   * @param policyIdToSupersede - The ID of the policy version to supersede.
   * @param newData - The data for the new policy version.
   * @returns The newly created policy version.
   */
  async createNewPolicyVersion(
    policyIdToSupersede: string,
    newData: NewPolicyVersionDataInput
  ): Promise<Policy> {
    const policyToSupersede =
      await this.adapter.findPolicyById(policyIdToSupersede);

    if (!policyToSupersede) {
      throw new Error(
        `Policy with ID ${policyIdToSupersede} not found to supersede.`
      );
    }

    if (
      policyToSupersede.status !== "active" &&
      policyToSupersede.status !== "draft"
    ) {
      throw new Error(
        `Policy ${policyIdToSupersede} cannot be superseded as it is already ${policyToSupersede.status}.`
      );
    }

    const newVersionNumber = policyToSupersede.version + 1;

    // Prepare data for the new policy version
    const newPolicyWithVersion: CreatePolicyInput & { version: number } = {
      ...newData, // from NewPolicyVersionDataInput
      version: newVersionNumber,
      // Ensure all other fields required by CreatePolicyInput are present
      // NewPolicyVersionDataInput omits policyGroupId, version, id, createdAt, updatedAt
      // CreatePolicyInput omits id, createdAt, updatedAt. So it needs policyGroupId, status, effectiveDate etc.
      policyGroupId: policyToSupersede.policyGroupId, // Added this from previous logic
      status: newData.status || "draft", // Add status, default if not in newData
      effectiveDate: newData.effectiveDate, // Add effectiveDate
      // contentSections and availableScopes are in newData from NewPolicyVersionDataInput
    };

    const createdPolicy = await this.adapter.createPolicy(newPolicyWithVersion);

    // 2. Archive the old policy version
    try {
      await this.adapter.updatePolicyStatus(
        policyIdToSupersede,
        "archived", // or 'superseded'
        policyToSupersede.version
      );
    } catch (statusUpdateError) {
      // Handle potential error during status update (e.g., log it, but the new policy is already created)
      // This could leave data in an inconsistent state if not handled carefully.
      console.error(
        `Failed to archive policy ${policyIdToSupersede} after creating new version ${createdPolicy.id}. Error: ${statusUpdateError}`
      );
    }

    return createdPolicy;
  }

  /**
   * Updates the status of a specific policy version.
   * @param policyId The ID of the policy to update.
   * @param status The new status.
   * @param expectedVersion The version of the policy being updated (for optimistic concurrency).
   * @returns The updated policy.
   */
  async updatePolicyStatus(
    policyId: string,
    status: Policy["status"],
    expectedVersion: number
  ): Promise<Policy> {
    if (!policyId || !status) {
      throw new Error(
        "Policy ID and status are required to update policy status."
      );
    }

    // Check if the status is valid,
    if (status !== "active" && status !== "draft" && status !== "archived") {
      throw new Error("Invalid status provided for policy update.");
    }

    return this.adapter.updatePolicyStatus(policyId, status, expectedVersion);
  }

  /**
   * Retrieves a specific policy by its ID.
   * @param policyId - The ID of the policy.
   * @returns The policy or null if not found.
   */
  async getPolicyById(policyId: string): Promise<Policy | null> {
    return this.adapter.findPolicyById(policyId);
  }

  /**
   * Retrieves the latest active policy for a given group.
   * @param policyGroupId - The group ID of the policy.
   * @returns The latest active policy or null if none found.
   */
  async getLatestActivePolicyByGroupId(
    policyGroupId: string
  ): Promise<Policy | null> {
    return this.adapter.findLatestActivePolicyByGroupId(policyGroupId);
  }

  /**
   * Retrieves all versions of a policy for a given group.
   * @param policyGroupId - The group ID of the policy.
   * @returns An array of policies, sorted by version ascending.
   */
  async getAllPolicyVersionsByGroupId(
    policyGroupId: string
  ): Promise<Policy[]> {
    return this.adapter.findAllPolicyVersionsByGroupId(policyGroupId);
  }

  /**
   * Lists all policies.
   * @returns An array of all policies.
   */
  async listPolicies(): Promise<Policy[]> {
    return this.adapter.listPolicies();
  }
}
