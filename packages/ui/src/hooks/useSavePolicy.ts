import { useCallback } from 'react';
import type {
  Policy,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from '@open-source-consent/types';

interface SavePolicyResult {
  savePolicy(
    policyData: CreatePolicyInput | NewPolicyVersionDataInput,
  ): Promise<Policy>;
}

/**
 * Hook for saving policy data
 */
export default function useSavePolicy(): SavePolicyResult {
  /**
   * Save a policy (create or update)
   */
  const savePolicy = useCallback(
    async (
      policyData: CreatePolicyInput | NewPolicyVersionDataInput,
    ): Promise<Policy> => {
      try {
        const endpoint = '/api/policies';
        const method = 'POST';

        const response = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(policyData),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to save policy: ${response.status} ${errorBody || response.statusText}`,
          );
        }

        return await response.json();
      } catch (err: any) {
        console.error('Error saving policy:', err);
        throw err;
      }
    },
    [],
  );

  return {
    savePolicy,
  };
}
