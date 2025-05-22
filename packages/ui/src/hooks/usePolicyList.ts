import { useState, useEffect } from 'react';
import type { Policy } from '@open-source-consent/types';
import useFetchPolicies from './useFetchPolicies.js';

interface UsePolicyListResult {
  policies: Policy[];
  isLoading: boolean;
  error: string | null;
  fetchPolicies(): void;
}

const usePolicyList = (): UsePolicyListResult => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchPolicies: fetchPoliciesAPI } = useFetchPolicies();

  const fetchPolicies = () => {
    setIsLoading(true);
    setError(null);

    fetchPoliciesAPI()
      .then((formattedPolicies) => {
        setPolicies(formattedPolicies);
      })
      .catch((err) => {
        console.error('Error fetching policies:', err);
        setError(err.message || 'An unknown error occurred');
        setPolicies([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return {
    policies,
    isLoading,
    error,
    fetchPolicies,
  };
};

export default usePolicyList;
