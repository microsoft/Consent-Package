import { useState, useEffect } from "react";
import type { Policy } from "@open-source-consent/types";
import type { ConsentFlowFormData } from "../ConsentFlow/ConsentFlow.type.js";

// Define a more specific type for the scope object if not exported directly from @open-source-consent/types
// This is effectively Policy['availableScopes'][number]
type PolicyScope = Policy["availableScopes"][number];

// Removed defaultSamplePolicyData from here, it will be handled by mock API layer if needed.

interface UseConsentFlowResult {
  policy: Policy | null;
  formData: ConsentFlowFormData;
  isFormValid: boolean;
  isLoading: boolean;
  error: string | null;
  setFormData(data: ConsentFlowFormData): void;
  updateScopes(scopeId: string, isChecked: boolean, subjectId?: string): void;
}

const useConsentFlow = (policyGroupId: string): UseConsentFlowResult => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConsentFlowFormData>({
    name: "",
    ageRangeId: "",
    dob: undefined,
    age: undefined,
    roleId: "",
    isProxy: false,
    managedSubjects: [],
    grantedScopes: [],
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/policyGroups/${policyGroupId}/latest`)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              `Latest active policy for group ID "${policyGroupId}" not found.`
            );
          }
          throw new Error(
            `Failed to fetch policy: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: Policy) => {
        setPolicy(data);
      })
      .catch((err) => {
        console.error("Error fetching policy:", err);
        setError(err.message || "An unknown error occurred");
        setPolicy(null); // Set policy to null on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [policyGroupId]);

  useEffect(() => {
    validateForm();
  }, [formData, policy]); // Add policy to dependencies for validateForm if it uses policy scopes for validation

  const validateForm = (): void => {
    const hasName = formData.name.trim().length > 0;
    const hasAgeRange = !!formData.ageRangeId;
    // Example: Adult check, adjust as needed
    const hasValidAge = formData.age !== undefined && formData.age >= 18;
    const hasRole = !!formData.roleId;

    const hasManagedSubjects =
      !formData.isProxy || formData.managedSubjects.length > 0;
    const hasValidManagedSubjects = formData.managedSubjects.every(
      (subject) =>
        subject.name?.trim().length > 0 &&
        subject.age !== undefined &&
        subject.age >= 0
    );

    // Check if all required scopes are granted (if policy is loaded)
    let hasRequiredScopes = true;
    if (policy && !formData.isProxy) {
      // Only for self-consenter for now
      const requiredScopeKeys = policy.availableScopes
        .filter((s: PolicyScope) => s.required)
        .map((s: PolicyScope) => s.key);
      if (requiredScopeKeys.length > 0) {
        hasRequiredScopes = requiredScopeKeys.every((key: string) =>
          formData.grantedScopes?.includes(key)
        );
      }
    }
    // If proxy, check required scopes for each subject
    if (policy && formData.isProxy) {
      const requiredScopeKeys = policy.availableScopes
        .filter((s: PolicyScope) => s.required)
        .map((s: PolicyScope) => s.key);
      if (requiredScopeKeys.length > 0) {
        hasRequiredScopes = formData.managedSubjects.every((subject) =>
          requiredScopeKeys.every((key: string) =>
            subject.grantedScopes?.includes(key)
          )
        );
      }
    }

    setIsFormValid(
      hasName &&
        hasAgeRange &&
        hasValidAge &&
        hasRole &&
        hasManagedSubjects &&
        hasValidManagedSubjects &&
        hasRequiredScopes
    );
  };

  const updateScopes = (
    scopeId: string,
    isChecked: boolean,
    subjectId?: string
  ): void => {
    if (!policy || !formData) return;

    const updatedFormData = { ...formData };

    const requiredScopeKeys = policy.availableScopes
      .filter((scope: PolicyScope) => scope.required)
      .map((scope: PolicyScope) => scope.key);

    if (subjectId) {
      const subjectIndex = updatedFormData.managedSubjects.findIndex(
        (s) => s.id === subjectId
      );
      if (subjectIndex !== -1) {
        const currentScopes =
          updatedFormData.managedSubjects[subjectIndex].grantedScopes || [];
        let newScopes = isChecked
          ? [...new Set([...currentScopes, scopeId])] // Ensure uniqueness
          : currentScopes.filter((id) => id !== scopeId);

        // If unchecking a required scope, prevent it (or handle as per business logic)
        // For now, we ensure required scopes are always present if any scope is granted or if it's an initial state
        if (isChecked) {
          newScopes = [...new Set([...newScopes, ...requiredScopeKeys])];
        } else {
          // Allow unchecking non-required scopes. Required scopes remain unless explicitly handled.
          // If we want to prevent unchecking required scopes, add logic here.
          // For simplicity, current logic allows unchecking but they might be re-added if form validation runs.
        }
        // A better approach for required scopes: always include them if the checkbox group is active
        // Or, disable their checkboxes. For this hook, we'll ensure they are part of the set if isChecked is true for any scope.

        updatedFormData.managedSubjects[subjectIndex] = {
          ...updatedFormData.managedSubjects[subjectIndex],
          grantedScopes: newScopes,
        };
      }
    } else {
      const currentScopes = updatedFormData.grantedScopes || [];
      let newScopes = isChecked
        ? [...new Set([...currentScopes, scopeId])] // Ensure uniqueness
        : currentScopes.filter((id) => id !== scopeId);

      if (isChecked) {
        newScopes = [...new Set([...newScopes, ...requiredScopeKeys])];
      }

      updatedFormData.grantedScopes = newScopes;
    }

    setFormData(updatedFormData);
  };

  return {
    policy,
    formData,
    isFormValid,
    isLoading,
    error,
    setFormData,
    updateScopes,
  };
};

export default useConsentFlow;
