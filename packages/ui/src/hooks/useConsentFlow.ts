import { useState, useEffect } from "react";
import type {
  Policy,
  PolicyScope,
  CreateConsentInput,
} from "@open-source-consent/types";
import type { ConsentFlowFormData } from "../ConsentFlow/ConsentFlow.type.js";
import { getAgeGroup } from "../utils/ageUtils.js";

interface UseConsentFlowResult {
  policy: Policy | null;
  formData: ConsentFlowFormData;
  isFormValid: boolean;
  isLoading: boolean;
  error: string | null;
  setFormData(data: ConsentFlowFormData): void;
  updateScopes(
    scopeId: string,
    isChecked: boolean,
    subjectIndex?: number
  ): void;
  saveConsent(): Promise<void>;
}

/**
 * Hook for managing the consent flow process.
 * This hook doesn't make assumptions about how subject IDs are generated or managed.
 * The consumer of this hook is responsible for ensuring proper ID management.
 */
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
  }, [formData, policy]);

  const validateForm = (): void => {
    const hasName = formData.name.trim().length > 0;
    const hasDob = formData.dob !== undefined;
    const hasRole = !!formData.roleId;

    // For proxy role, validate managed subjects
    const hasManagedSubjects = !formData.isProxy || formData.managedSubjects.length > 0;
    const hasValidManagedSubjects = formData.managedSubjects.every(
      (subject) =>
        subject.name?.trim().length > 0 &&
        subject.id?.trim().length > 0 &&
        subject.age !== undefined &&
        subject.age >= 0
    );

    const baseValidation = hasName && hasDob && hasRole;
    const proxyValidation = formData.isProxy ? hasManagedSubjects && hasValidManagedSubjects : true;
    setIsFormValid(baseValidation && proxyValidation);
  };

  const updateScopes = (
    scopeId: string,
    isChecked: boolean,
    subjectIndex?: number
  ): void => {
    if (!policy || !formData) return;

    const updatedFormData = { ...formData };

    const allAvailableScopeKeys = policy.availableScopes.map(
      (scope: PolicyScope) => scope.key
    );
    const requiredScopeKeys = policy.availableScopes
      .filter((scope: PolicyScope) => scope.required)
      .map((scope: PolicyScope) => scope.key);

    if (
      subjectIndex !== undefined &&
      subjectIndex >= 0 &&
      subjectIndex < formData.managedSubjects.length
    ) {
      const currentScopes =
        updatedFormData.managedSubjects[subjectIndex].grantedScopes || [];
      let newScopes = isChecked
        ? [...new Set([...currentScopes, scopeId])]
        : currentScopes.filter((id) => id !== scopeId);

      if (newScopes.length > 0) {
        newScopes = [...new Set([...newScopes, ...requiredScopeKeys])];
      }

      const newRevokedScopes = allAvailableScopeKeys.filter(
        (key) => !newScopes.includes(key)
      );

      updatedFormData.managedSubjects[subjectIndex] = {
        ...updatedFormData.managedSubjects[subjectIndex],
        grantedScopes: newScopes,
        revokedScopes: newRevokedScopes,
      };
    } else {
      const currentScopes = updatedFormData.grantedScopes || [];
      let newScopes = isChecked
        ? [...new Set([...currentScopes, scopeId])]
        : currentScopes.filter((id) => id !== scopeId);

      if (newScopes.length > 0) {
        newScopes = [...new Set([...newScopes, ...requiredScopeKeys])];
      }

      const newRevokedScopes = allAvailableScopeKeys.filter(
        (key) => !newScopes.includes(key)
      );
      updatedFormData.grantedScopes = newScopes;
      updatedFormData.revokedScopes = newRevokedScopes;
    }

    setFormData(updatedFormData);
  };

  const saveConsent = async (): Promise<void> => {
    if (!policy || !isFormValid) {
      setError("Policy not loaded or form is invalid. Cannot save consent.");
      return;
    }

    setIsLoading(true);
    setError(null);

    let consentsToCreate: CreateConsentInput[] = [];

    if (formData.isProxy) {
      consentsToCreate = formData.managedSubjects.map((subject) => {
        // Use the subject ID that was provided/generated by the consumer
        return {
          subjectId: subject.id,
          policyId: policy.id,
          consenter: {
            type: "proxy",
            userId: formData.name,
            proxyDetails: {
              relationship: formData.roleId,
              subjectAgeGroup: getAgeGroup(subject.age),
            },
          },
          grantedScopes: subject.grantedScopes || [],
          revokedScopes: subject.revokedScopes || [],
          metadata: {
            consentMethod: "digital_form",
          },
        };
      });
    } else {
      const consentInput: CreateConsentInput = {
        subjectId: formData.name,
        policyId: policy.id,
        consenter: {
          type: "self",
          userId: formData.name,
        },
        grantedScopes: formData.grantedScopes || [],
        revokedScopes: formData.revokedScopes || [],
        metadata: {
          consentMethod: "digital_form",
        },
      };
      consentsToCreate.push(consentInput);
    }

    try {
      for (const consentInput of consentsToCreate) {
        const response = await fetch("/api/consents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(consentInput),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to save consent: ${response.status} ${
              errorBody || response.statusText
            }`
          );
        }
      }
    } catch (err: any) {
      console.error("Error saving consent:", err);
      setError(err.message || "An unknown error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    policy,
    formData,
    isFormValid,
    isLoading,
    error,
    setFormData,
    updateScopes,
    saveConsent,
  };
};

export default useConsentFlow;
