import { useState, useEffect, useCallback } from "react";
import type {
  Policy,
  PolicyContentSection,
  PolicyScope,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from "@open-source-consent/types";

// Define PolicyEditorFormData based on CreatePolicyInput,
// ensuring contentSections and availableScopes use the direct types.
export type PolicyEditorFormData = Omit<
  CreatePolicyInput,
  "effectiveDate" | "contentSections" | "availableScopes"
> & {
  effectiveDate: string; // Store date as string for input compatibility
  contentSections: Array<PolicyContentSection>; // Use direct type
  availableScopes: Array<PolicyScope>; // Use direct type
};

interface UsePolicyEditorResult {
  policy: Policy | null;
  formData: PolicyEditorFormData;
  isLoading: boolean;
  error: string | null;
  setFormData(data: PolicyEditorFormData): void; // For simple updates from component
  savePolicy(): Promise<void>;
  // Specialized handlers for content sections
  addContentSection(): void;
  updateContentSection(
    index: number,
    field: keyof PolicyContentSection,
    value: string
  ): void;
  removeContentSection(index: number): void;
  // Specialized handlers for scopes
  addScope(): void;
  updateScope(
    index: number,
    field: keyof PolicyScope,
    value: string | boolean
  ): void;
  removeScope(index: number): void;
}

const getDefaultFormData = (): PolicyEditorFormData => ({
  title: "",
  policyGroupId: "",
  version: 1,
  effectiveDate: "", // Initialize as string
  contentSections: [{ title: "", description: "", content: "" }],
  availableScopes: [{ key: "", name: "", description: "", required: false }],
  jurisdiction: "",
  requiresProxyForMinors: false,
  status: "draft",
});

const usePolicyEditor = (policyIdToEdit?: string): UsePolicyEditorResult => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] =
    useState<PolicyEditorFormData>(getDefaultFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyIdToEdit) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/policies/${policyIdToEdit}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch policy ${policyIdToEdit}`);
          }
          return response.json();
        })
        .then((data: Policy) => {
          setPolicy(data);
          setFormData({
            // Omit 'id' for PolicyEditorFormData as it's not part of CreatePolicyInput base
            policyGroupId: data.policyGroupId,
            title: data.title || "",
            version: data.version,
            effectiveDate: new Date(data.effectiveDate)
              .toISOString()
              .split("T")[0],
            contentSections: data.contentSections.map((section) => ({
              title: section.title,
              description: section.description,
              content: section.content,
            })),
            availableScopes: data.availableScopes.map((scope) => ({
              key: scope.key,
              name: scope.name,
              description: scope.description,
              required: scope.required || false,
            })),
            jurisdiction: data.jurisdiction || "",
            requiresProxyForMinors: data.requiresProxyForMinors || false,
            status: data.status,
          });
        })
        .catch((err) => {
          console.error("Error fetching policy for editing:", err);
          setError(err.message || "An unknown error occurred");
          setPolicy(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setFormData(getDefaultFormData());
      setPolicy(null);
    }
  }, [policyIdToEdit]);

  const addContentSection = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      contentSections: [
        ...prev.contentSections,
        { title: "", description: "", content: "" },
      ],
    }));
  }, [setFormData]);

  const updateContentSection = useCallback(
    (index: number, field: keyof PolicyContentSection, value: string) => {
      setFormData((prev) => {
        const newSections = [...prev.contentSections];
        // Create a new object for the section to ensure immutability
        newSections[index] = { ...newSections[index], [field]: value };
        return { ...prev, contentSections: newSections };
      });
    },
    [setFormData]
  );

  const removeContentSection = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        contentSections: prev.contentSections.filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const addScope = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      availableScopes: [
        ...prev.availableScopes,
        { key: "", name: "", description: "", required: false },
      ],
    }));
  }, [setFormData]);

  const updateScope = useCallback(
    (index: number, field: keyof PolicyScope, value: string | boolean) => {
      setFormData((prev) => {
        const newScopes = [...prev.availableScopes];
        // Create a new object for the scope to ensure immutability
        newScopes[index] = { ...newScopes[index], [field]: value };
        return { ...prev, availableScopes: newScopes };
      });
    },
    [setFormData]
  );

  const removeScope = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        availableScopes: prev.availableScopes.filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const savePolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Ensure effectiveDate is a Date object for saving
    // And contentSections/availableScopes match the expected input type
    const policyDataToSave: CreatePolicyInput | NewPolicyVersionDataInput = {
      ...formData,
      effectiveDate: new Date(formData.effectiveDate),
      contentSections: formData.contentSections, // Already in correct shape
      availableScopes: formData.availableScopes, // Already in correct shape
    };

    const endpoint = "/api/policies";
    const method = "POST";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policyDataToSave),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Failed to save policy: ${response.status} ${errorBody || response.statusText}`
        );
      }

      const saved = await response.json();
      // Assuming the saved policy (or new version) is returned
      // Update local state if necessary, e.g., if a new ID or version is generated
      if (saved && saved.id) {
        setPolicy(saved); // Update the full policy object
        setFormData((prev) => ({
          ...prev,
          // Update any fields that might change on save, e.g. version, id from 'saved'
          // For now, assuming the relevant parts of formData are already correct or handled by full policy set
          version: saved.version || prev.version,
          // policyGroupId may or may not change depending on create vs new version logic
          policyGroupId: saved.policyGroupId || prev.policyGroupId,
          status: saved.status || prev.status,
          // if we are creating a new policy, the ID is now known
        }));
      } else {
        setPolicy((prevPolicy) =>
          prevPolicy ? { ...prevPolicy, ...saved } : saved
        );
      }

      console.log("Policy saved successfully:", saved);
    } catch (err: any) {
      console.error("Error saving policy:", err);
      setError(err.message || "An unknown error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, policy, setFormData]);

  return {
    policy,
    formData,
    isLoading,
    error,
    setFormData,
    savePolicy,
    addContentSection,
    updateContentSection,
    removeContentSection,
    addScope,
    updateScope,
    removeScope,
  };
};

export default usePolicyEditor;
