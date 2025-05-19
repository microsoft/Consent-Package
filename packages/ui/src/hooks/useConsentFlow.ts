import { useState, useEffect } from 'react';
import type { ConsentFlowPolicy, ConsentFlowFormData } from '../ConsentFlow/ConsentFlow.type.js';

const samplePolicy: ConsentFlowPolicy = {
  id: "sample-policy-1",
  title: "Open Source Consent Policy",
  description: "This policy outlines how we handle your data and what you can expect from our service.",
  contentSections: [
    {
      title: "Data Collection",
      content: "We collect only the information necessary to provide our services and ensure compliance with privacy regulations.",
      risks: [
        "Your personal information may be temporarily stored in our secure systems",
        "Data collection may require additional verification steps",
        "Some data points may be mandatory for service provision"
      ],
      dataTypes: [
        "Personal identification information",
        "Contact details and communication preferences",
        "Account credentials and security information"
      ],
      compensation: [
        "Access to personalized service features",
        "Enhanced account security measures",
        "Priority customer support access"
      ]
    },
    {
      title: "Data Usage",
      content: "Your data is used solely for the purposes you consent to, and we never sell or share your information with third parties without your explicit permission.",
      risks: [
        "Data may be used for service improvement and analytics",
        "Information may be shared with service providers under strict confidentiality",
        "Data may be retained for legal compliance purposes"
      ],
      dataTypes: [
        "Usage patterns and preferences",
        "Service interaction logs",
        "Analytics and performance data"
      ],
      compensation: [
        "Improved service recommendations",
        "Customized user experience",
        "Early access to new features"
      ]
    },
    {
      title: "Your Rights",
      content: "You have the right to access, modify, or delete your data at any time. You can also withdraw your consent at any point.",
      risks: [
        "Withdrawing consent may limit access to certain features",
        "Data deletion requests may take up to 30 days to process",
        "Some data may be retained for legal or regulatory requirements"
      ],
      dataTypes: [
        "Consent management records",
        "Data access and modification history",
        "Privacy preference settings"
      ],
      compensation: [
        "Full control over data management",
        "Transparent data usage reporting",
        "Flexible consent options"
      ]
    }
  ],
  scopes: [
    {
      key: "basic_profile",
      name: "Basic Profile",
      description: "Access to your basic profile information including name and contact details",
      required: true
    },
    {
      key: "health_records",
      name: "Health Records",
      description: "Access to your medical history, conditions, and treatment records",
      required: false
    },
    {
      key: "medication_history",
      name: "Medication History",
      description: "Access to your current and past medications, dosages, and schedules",
      required: false
    },
    {
      key: "appointment_data",
      name: "Appointment Data",
      description: "Access to your upcoming and past medical appointments",
      required: false
    },
    {
      key: "insurance_info",
      name: "Insurance Information",
      description: "Access to your health insurance details and coverage information",
      required: false
    },
    {
      key: "payment_history",
      name: "Payment History",
      description: "Access to your medical payment and billing history",
      required: false
    }
  ]
};

const policies = [samplePolicy];

interface UseConsentFlowResult {
  policy: ConsentFlowPolicy | null;
  formData: ConsentFlowFormData;
  isFormValid: boolean;
  isLoading: boolean;
  setFormData(data: ConsentFlowFormData): void;
  updateScopes(scopeId: string, isChecked: boolean, subjectId?: string): void;
}

const useConsentFlow = (policyId: string): UseConsentFlowResult => {
  const [policy, setPolicy] = useState<ConsentFlowPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ConsentFlowFormData>({
    name: '',
    ageRangeId: '',
    dob: undefined,
    age: undefined,
    roleId: '',
    isProxy: false,
    managedSubjects: [],
    grantedScopes: [],
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // TODO: Fetch policy from API
    setTimeout(() => {
      setPolicy(policies.find((p: ConsentFlowPolicy) => p.id === policyId) ?? null);
      setIsLoading(false);
    }, 500);
  }, [policyId]);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = (): void => {
    const hasName = formData.name.trim().length > 0;
    const hasAgeRange = !!formData.ageRangeId;
    const hasValidAge = formData.age !== undefined && formData.age >= 18;
    const hasRole = !!formData.roleId;
    
    // If user is a proxy, they must have at least one managed subject
    const hasManagedSubjects = !formData.isProxy || formData.managedSubjects.length > 0;
    const hasValidManagedSubjects = formData.managedSubjects.every(subject => 
      subject.name?.trim().length > 0 && subject.age !== undefined && subject.age >= 0
    );
    
    setIsFormValid(hasName && hasAgeRange && hasValidAge && hasRole && hasManagedSubjects && hasValidManagedSubjects);
  };

  const updateScopes = (scopeId: string, isChecked: boolean, subjectId?: string): void => {
    if (!policy || !formData) return;

    const updatedFormData = { ...formData };

    // Get all required scopes
    const requiredScopes = policy.scopes
      .filter((scope) => scope.required)
      .map((scope) => scope.key);

    if (subjectId) {
      // Update scopes for a managed subject
      const subjectIndex = updatedFormData.managedSubjects.findIndex((s) => s.id === subjectId);
      if (subjectIndex !== -1) {
        const currentScopes = updatedFormData.managedSubjects[subjectIndex].grantedScopes || [];
        const newScopes = isChecked
          ? [...currentScopes, scopeId]
          : currentScopes.filter((id) => id !== scopeId);

        // Ensure required scopes are always included
        const finalScopes = [...new Set([...newScopes, ...requiredScopes])];

        updatedFormData.managedSubjects[subjectIndex] = {
          ...updatedFormData.managedSubjects[subjectIndex],
          grantedScopes: finalScopes
        };
      }
    } else {
      // Update scopes for the consenter
      const currentScopes = updatedFormData.grantedScopes || [];
      const newScopes = isChecked
        ? [...currentScopes, scopeId]
        : currentScopes.filter((id) => id !== scopeId);

      // Ensure required scopes are always included
      const finalScopes = [...new Set([...newScopes, ...requiredScopes])];

      updatedFormData.grantedScopes = finalScopes;
    }

    setFormData(updatedFormData);
  };

  return {
    policy,
    formData,
    isFormValid,
    isLoading,
    setFormData,
    updateScopes,
  };
}

export default useConsentFlow;
