import './index.css';

import useConsentFlow from "./hooks/useConsentFlow.js";
import ConsentDetails from "./ConsentFlow/ConsentDetails.js";
import ConsentReview from "./ConsentFlow/ConsentReview.js";
import ConsentScopes from "./ConsentFlow/ConsentScopes.js";
import ConsentWelcome from "./ConsentFlow/ConsentWelcome.js";
import type { ConsentFlowFormData, ConsentFlowPolicy, ConsentFlowManagedSubject, ConsentFlowContentSection, ConsentFlowScope } from "./ConsentFlow/ConsentFlow.type.js";

import AgeSelect from "./AgeSelect/index.js";
import Profile from "./Profile/index.js";
import RoleSelect from "./RoleSelect/index.js";
import Signature from "./Signature/index.js";
import type { ProfileData } from "./Profile/Profile.type.js";

export {
  useConsentFlow,
  AgeSelect,
  Profile,
  RoleSelect,
  Signature,
  // Consent Flow
  ConsentDetails,
  ConsentReview,
  ConsentScopes,
  ConsentWelcome,
  // Types
  type ProfileData,
  type ConsentFlowFormData,
  type ConsentFlowPolicy,
  type ConsentFlowManagedSubject,
  type ConsentFlowContentSection,
  type ConsentFlowScope
};
