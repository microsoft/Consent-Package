// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { Policy } from './Policy.type.ts';
import type { CreatePolicyInput } from './PolicyInputs.type.ts';

export interface IPolicyDataAdapter {
  /**
   * Creates a new policy version.
   */
  createPolicy(data: CreatePolicyInput): Promise<Policy>;

  /**
   * Updates the status of an existing policy version.
   * Uses expectedVersion for optimistic concurrency control.
   */
  updatePolicyStatus(
    policyId: string,
    status: Policy['status'],
    expectedVersion: number,
  ): Promise<Policy>;

  /**
   * Retrieves a specific policy version by its unique ID.
   */
  findPolicyById(policyId: string): Promise<Policy | null>;

  /**
   * Retrieves the latest active policy version for a given policy group ID.
   */
  findLatestActivePolicyByGroupId(
    policyGroupId: string,
  ): Promise<Policy | null>;

  /**
   * Retrieves all policy versions belonging to a specific policy group.
   */
  findAllPolicyVersionsByGroupId(policyGroupId: string): Promise<Policy[]>;

  /**
   * Lists policies
   * Simple version: List all policies.
   */
  listPolicies(): Promise<Policy[]>;
}
