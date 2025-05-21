import "./index.css";

import useConsentFlow from "./hooks/useConsentFlow.js";
import usePolicyEditor from "./hooks/usePolicyEditor.js";
import usePolicyList from "./hooks/usePolicyList.js";
import usePolicyDetails from "./hooks/usePolicyDetails.js";
import type { PolicyEditorFormData } from "./hooks/usePolicyEditor.js";

// ConsentFlow components
import ConsentDetails from "./ConsentFlow/ConsentDetails.js";
import ConsentReview from "./ConsentFlow/ConsentReview.js";
import ConsentScopes from "./ConsentFlow/ConsentScopes.js";
import ConsentWelcome from "./ConsentFlow/ConsentWelcome.js";
import ConsentContentSectionStep from "./ConsentFlow/ConsentContentSectionStep.js";
import type {
  ConsentFlowFormData,
  ConsentFlowPolicy,
  ConsentFlowManagedSubject,
  ConsentFlowContentSection,
  ConsentFlowScope,
} from "./ConsentFlow/ConsentFlow.type.js";

// Other UI components that might have their own index.js structure
import AgeSelect from "./AgeSelect/index.js";
import Profile from "./Profile/index.js";
import RoleSelect from "./RoleSelect/index.js";
import Signature from "./Signature/index.js";
import type { ProfileData } from "./Profile/Profile.type.js";

// New Policy components (default exports)
import PolicySectionDisplay from "./Policy/PolicySectionDisplay.js";
import PolicyMetadataDisplay from "./Policy/PolicyMetadataDisplay.js";
import PolicyTable from "./Policy/PolicyTable.js";
import PolicyScopeDisplay from "./Policy/PolicyScopeDisplay.js";
import PolicyMetadataForm from "./Policy/PolicyMetadataForm.js";
import PolicyContentSectionEditor from "./Policy/PolicyContentSectionEditor.js";
import PolicyScopeEditor from "./Policy/PolicyScopeEditor.js";

// Re-exporting from directories that have an index.js (or index.tsx)
export * from "./Profile/index.js";
export * from "./RoleSelect/index.js";
export * from "./Signature/index.js";
export * from "./AgeSelect/index.js";
// Removed: export * from "./ConsentFlow/index.js"; // Does not have an index file
// Removed: export * from "./Policy/index.js"; // Policy components imported directly
// Removed: export * from "./hooks/index.js"; // Hooks imported directly

export {
  // Hooks
  useConsentFlow,
  usePolicyEditor,
  usePolicyList,
  usePolicyDetails,
  // UI Components
  AgeSelect,
  Profile,
  RoleSelect,
  Signature,
  ConsentDetails,
  ConsentReview,
  ConsentScopes,
  ConsentWelcome,
  ConsentContentSectionStep,
  PolicySectionDisplay, // Added new component
  PolicyMetadataDisplay, // Added new component
  PolicyTable, // Added new component
  PolicyScopeDisplay, // Added new component
  PolicyMetadataForm, // Added new component
  PolicyContentSectionEditor, // Added new component
  PolicyScopeEditor, // Added new component
  // Types
  type ProfileData,
  type ConsentFlowFormData,
  type ConsentFlowPolicy,
  type ConsentFlowManagedSubject,
  type ConsentFlowContentSection,
  type ConsentFlowScope,
  type PolicyEditorFormData,
};
