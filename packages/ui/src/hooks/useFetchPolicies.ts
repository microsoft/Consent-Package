// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useCallback } from 'react';
import type { Policy } from '@open-source-consent/types';
import { fetchWithConfig } from '../utils/fetchWithConfig.js';

interface FetchPoliciesResult {
  fetchPolicies(): Promise<Policy[]>;
}

/**
 * Hook for fetching policy list
 */
export default function useFetchPolicies(): FetchPoliciesResult {
  /**
   * Fetch all available policies
   */
  const fetchPolicies = useCallback(async (): Promise<Policy[]> => {
    try {
      const response = await fetchWithConfig('/api/policies');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch policies: ${response.status} ${response.statusText}`,
        );
      }
      const data: Policy[] = await response.json();

      return data.map((policy) => ({
        ...policy,
        effectiveDate: new Date(policy.effectiveDate),
        createdAt: new Date(policy.createdAt),
        updatedAt: new Date(policy.updatedAt),
      }));
    } catch (err: any) {
      console.error('Error fetching policies:', err);
      throw err;
    }
  }, []);

  return {
    fetchPolicies,
  };
}
