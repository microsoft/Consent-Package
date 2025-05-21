export interface ConsentFlowManagedSubject {
  id: string;
  name: string;
  ageRangeId: string;
  dob?: Date;
  age?: number;
  grantedScopes?: string[];
}

export interface ConsentFlowFormData {
  name: string;
  ageRangeId: string;
  dob?: Date;
  age?: number;
  roleId: string;
  isProxy: boolean;
  managedSubjects: ConsentFlowManagedSubject[];
  grantedScopes?: string[];
  signature?: string;
  grantedAt?: Date;
}

export interface ConsentFlowContentSection {
  title: string;
  content: string;
}

export interface ConsentFlowScope {
  key: string;
  name: string;
  description: string;
  required: boolean;
}

export interface ConsentFlowPolicy {
  id: string;
  title: string;
  description: string;
  contentSections: ConsentFlowContentSection[];
  scopes: ConsentFlowScope[];
}
