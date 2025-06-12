// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useCallback } from 'react';
import type {
  Policy,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from '@open-source-consent/types';
import { fetchWithConfig } from '../utils/fetchWithConfig.js';

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

        const response = await fetchWithConfig(endpoint, {
          method: method,
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
