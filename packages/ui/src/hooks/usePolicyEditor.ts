import { useState, useEffect, useCallback } from 'react';
import type {
  Policy,
  PolicyContentSection,
  PolicyScope,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from '@open-source-consent/types';
import useFetchPolicy from './useFetchPolicy.js';
import useSavePolicy from './useSavePolicy.js';

export type PolicyEditorFormData = Omit<
  CreatePolicyInput,
  'effectiveDate' | 'contentSections' | 'availableScopes'
> & {
  effectiveDate: string;
  contentSections: Array<PolicyContentSection>;
  availableScopes: Array<PolicyScope>;
};

interface UsePolicyEditorResult {
  policy: Policy | null;
  formData: PolicyEditorFormData;
  isLoading: boolean;
  error: string | null;
  setFormData(data: PolicyEditorFormData): void;
  savePolicy(): Promise<void>;
  addContentSection(): void;
  updateContentSection(
    index: number,
    field: keyof PolicyContentSection,
    value: string,
  ): void;
  removeContentSection(index: number): void;
  addScope(): void;
  updateScope(
    index: number,
    field: keyof PolicyScope,
    value: string | boolean,
  ): void;
  removeScope(index: number): void;
}

const getDefaultFormData = (): PolicyEditorFormData => ({
  title: '',
  policyGroupId: '',
  version: 1,
  effectiveDate: '',
  contentSections: [{ title: '', description: '', content: '' }],
  availableScopes: [{ key: '', name: '', description: '', required: false }],
  jurisdiction: '',
  requiresProxyForMinors: false,
  status: 'draft',
});

const usePolicyEditor = (policyIdToEdit?: string): UsePolicyEditorResult => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] =
    useState<PolicyEditorFormData>(getDefaultFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchPolicy } = useFetchPolicy();
  const { savePolicy: savePolicyAPI } = useSavePolicy();

  useEffect(() => {
    if (policyIdToEdit) {
      setIsLoading(true);
      setError(null);

      fetchPolicy(policyIdToEdit)
        .then((data) => {
          setPolicy(data);
          setFormData({
            policyGroupId: data.policyGroupId,
            title: data.title || '',
            version: data.version,
            effectiveDate: new Date(data.effectiveDate)
              .toISOString()
              .split('T')[0],
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
            jurisdiction: data.jurisdiction || '',
            requiresProxyForMinors: data.requiresProxyForMinors || false,
            status: data.status,
          });
        })
        .catch((err) => {
          console.error('Error fetching policy for editing:', err);
          setError(err.message || 'An unknown error occurred');
          setPolicy(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setFormData(getDefaultFormData());
      setPolicy(null);
    }
  }, [policyIdToEdit, fetchPolicy]);

  const addContentSection = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      contentSections: [
        ...prev.contentSections,
        { title: '', description: '', content: '' },
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
    [setFormData],
  );

  const removeContentSection = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        contentSections: prev.contentSections.filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const addScope = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      availableScopes: [
        ...prev.availableScopes,
        { key: '', name: '', description: '', required: false },
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
    [setFormData],
  );

  const removeScope = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        availableScopes: prev.availableScopes.filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const savePolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Ensure effectiveDate is a Date object for saving
    // And contentSections/availableScopes match the expected input type
    const policyDataToSave: CreatePolicyInput | NewPolicyVersionDataInput = {
      ...formData,
      effectiveDate: new Date(formData.effectiveDate),
      contentSections: formData.contentSections,
      availableScopes: formData.availableScopes,
    };

    try {
      const saved = await savePolicyAPI(policyDataToSave);

      if (saved && saved.id) {
        setPolicy(saved); // Update the full policy object
        setFormData((prev) => ({
          ...prev,
          version: saved.version || prev.version,
          policyGroupId: saved.policyGroupId || prev.policyGroupId,
          status: saved.status || prev.status,
        }));
      } else {
        setPolicy((prevPolicy) =>
          prevPolicy ? { ...prevPolicy, ...saved } : saved,
        );
      }
    } catch (err: any) {
      console.error('Error saving policy:', err);
      setError(err.message || 'An unknown error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, savePolicyAPI]);

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
