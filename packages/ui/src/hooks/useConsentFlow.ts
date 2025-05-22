import { useState, useEffect } from "react";
import type {
  Policy,
  PolicyScope,
  CreateConsentInput,
  AgeGroup,
} from "@open-source-consent/types";
import type { ConsentFlowFormData } from "../ConsentFlow/ConsentFlow.type.js";

const getAgeGroup = (age: number | undefined): AgeGroup => {
  if (age === undefined) {
    return "18+"; // Fallback, but this should ideally not be reached if validation is correct.
  }
  if (age < 13) return "under13";
  if (age >= 13 && age <= 17) return "13-17";
  return "18+";
};

interface UseConsentFlowResult {
  policy: Policy | null;
  formData: ConsentFlowFormData;
  isFormValid: boolean;
  isLoading: boolean;
  error: string | null;
  setFormData(data: ConsentFlowFormData): void;
  updateScopes(scopeId: string, isChecked: boolean, subjectId?: string): void;
  saveConsent(): Promise<void>;
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
  }, [formData, policy]);

  const validateForm = (): void => {
    const hasName = formData.name.trim().length > 0;
    const hasAgeRange = !!formData.ageRangeId;
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

    const allAvailableScopeKeys = policy.availableScopes.map(
      (scope: PolicyScope) => scope.key
    );
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
      }
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
        const subjectId = subject.id;
        return {
          subjectId: subjectId,
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
