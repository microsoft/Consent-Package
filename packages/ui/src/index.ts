import './index.css';

import useConsentFlow from './hooks/useConsentFlow.js';
import usePolicyEditor from './hooks/usePolicyEditor.js';
import usePolicyList from './hooks/usePolicyList.js';
import usePolicyDetails from './hooks/usePolicyDetails.js';
import useFetchPolicies from './hooks/useFetchPolicies.js';
import useFetchPolicy from './hooks/useFetchPolicy.js';
import useSavePolicy from './hooks/useSavePolicy.js';
import type { PolicyEditorFormData } from './hooks/usePolicyEditor.js';

import ConsentReview from './ConsentFlow/ConsentReview.js';
import ConsentScopes from './ConsentFlow/ConsentScopes.js';
import ConsentWelcome from './ConsentFlow/ConsentWelcome.js';
import ConsentContentSectionStep from './ConsentFlow/ConsentContentSectionStep.js';
import ConsentConfirmation from './ConsentFlow/ConsentConfirmation.js';
import type {
  ConsentFlowFormData,
  ConsentFlowManagedSubject,
} from './ConsentFlow/ConsentFlow.type.js';

import AgeSelect from './AgeSelect/index.js';
import Profile from './Profile/index.js';
import RoleSelect from './RoleSelect/index.js';
import Signature from './Signature/index.js';
import type { ProfileData } from './Profile/Profile.type.js';

import PolicySectionDisplay from './Policy/PolicySectionDisplay.js';
import PolicyMetadataDisplay from './Policy/PolicyMetadataDisplay.js';
import PolicyTable from './Policy/PolicyTable.js';
import PolicyScopeDisplay from './Policy/PolicyScopeDisplay.js';
import PolicyMetadataForm from './Policy/PolicyMetadataForm.js';
import PolicyContentSectionEditor from './Policy/PolicyContentSectionEditor.js';
import PolicyScopeEditor from './Policy/PolicyScopeEditor.js';

import { ThemeProvider } from './ThemeProvider.js';
import type { ThemeProviderProps } from './ThemeProvider.js';

export * from './Profile/index.js';
export * from './RoleSelect/index.js';
export * from './Signature/index.js';
export * from './AgeSelect/index.js';
export { setApiConfig } from './utils/apiConfig.js';

export {
  // Theme
  ThemeProvider,

  // Hooks
  useConsentFlow,
  usePolicyEditor,
  usePolicyList,
  usePolicyDetails,
  useFetchPolicies,
  useFetchPolicy,
  useSavePolicy,

  // UI Components
  AgeSelect,
  Profile,
  RoleSelect,
  Signature,
  ConsentReview,
  ConsentScopes,
  ConsentWelcome,
  ConsentContentSectionStep,
  ConsentConfirmation,
  PolicySectionDisplay,
  PolicyMetadataDisplay,
  PolicyTable,
  PolicyScopeDisplay,
  PolicyMetadataForm,
  PolicyContentSectionEditor,
  PolicyScopeEditor,

  // Types
  type ThemeProviderProps,
  type ProfileData,
  type ConsentFlowFormData,
  type ConsentFlowManagedSubject,
  type PolicyEditorFormData,
};
