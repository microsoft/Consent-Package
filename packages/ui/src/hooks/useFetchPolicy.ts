import { useCallback } from "react";
import type { Policy } from "@open-source-consent/types";

interface FetchPolicyResult {
  fetchPolicy(policyId: string): Promise<Policy>;
}

/**
 * Hook for fetching individual policy details
 */
export default function useFetchPolicy(): FetchPolicyResult {
  /**
   * Fetch a specific policy by ID
   */
  const fetchPolicy = useCallback(async (policyId: string): Promise<Policy> => {
    if (!policyId) {
      throw new Error("No Policy ID provided.");
    }

    try {
      const response = await fetch(`/api/policies/${policyId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Policy with ID "${policyId}" not found.`);
        }
        throw new Error(
          `Failed to fetch policy: ${response.status} ${response.statusText}`
        );
      }

      const data: Policy = await response.json();
      return {
        ...data,
        effectiveDate: new Date(data.effectiveDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (err: any) {
      console.error(`Error fetching policy ${policyId}:`, err);
      throw err;
    }
  }, []);

  return {
    fetchPolicy,
  };
}
