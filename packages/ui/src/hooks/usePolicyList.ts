import { useState, useEffect } from "react";
import type { Policy } from "@open-source-consent/types";

interface UsePolicyListResult {
  policies: Policy[];
  isLoading: boolean;
  error: string | null;
  fetchPolicies(): void; // Changed to method shorthand
}

const usePolicyList = (): UsePolicyListResult => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = () => {
    setIsLoading(true);
    setError(null);
    fetch("/api/policies")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch policies: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: Policy[]) => {
        const formattedPolicies = data.map((policy) => ({
          ...policy,
          effectiveDate: new Date(policy.effectiveDate),
          createdAt: new Date(policy.createdAt),
          updatedAt: new Date(policy.updatedAt),
        }));
        setPolicies(formattedPolicies);
      })
      .catch((err) => {
        console.error("Error fetching policies:", err);
        setError(err.message || "An unknown error occurred");
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
