import { useState, useEffect } from 'react';
import type { Policy } from '@open-source-consent/types';
import useFetchPolicy from './useFetchPolicy.js';

interface UsePolicyDetailsResult {
  policy: Policy | null;
  isLoading: boolean;
  error: string | null;
  fetchPolicy(): void;
}

const usePolicyDetails = (policyId?: string): UsePolicyDetailsResult => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchPolicy: fetchPolicyAPI } = useFetchPolicy();

  const fetchPolicy = () => {
    if (!policyId) {
      setError('No Policy ID provided.');
      setIsLoading(false);
      setPolicy(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchPolicyAPI(policyId)
      .then((data) => {
        setPolicy(data);
      })
      .catch((err) => {
        console.error(`Error fetching policy ${policyId}:`, err);
        setError(err.message || 'An unknown error occurred');
        setPolicy(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPolicy();
  }, [policyId]); // Re-fetch if policyId changes

  return {
    policy,
    isLoading,
    error,
    fetchPolicy,
  };
};

export default usePolicyDetails;
