import { useState, useEffect } from "react";
import type { Policy } from "@open-source-consent/types";

interface UsePolicyDetailsResult {
  policy: Policy | null;
  isLoading: boolean;
  error: string | null;
  fetchPolicy(): void; // Changed to method shorthand
}

const usePolicyDetails = (policyId?: string): UsePolicyDetailsResult => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = () => {
    if (!policyId) {
      setError("No Policy ID provided.");
      setIsLoading(false);
      setPolicy(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(`/api/policies/${policyId}`)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Policy with ID "${policyId}" not found.`);
          }
          throw new Error(
            `Failed to fetch policy: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: Policy) => {
        setPolicy({
          ...data,
          effectiveDate: new Date(data.effectiveDate),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      })
      .catch((err) => {
        console.error(`Error fetching policy ${policyId}:`, err);
        setError(err.message || "An unknown error occurred");
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
