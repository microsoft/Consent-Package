export interface ConsentFlowManagedSubject {
  id: string;
  name: string;
  ageRangeId: string;
  dob?: Date;
  age?: number;
  grantedScopes?: string[];
  revokedScopes?: string[];
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
  revokedScopes?: string[];
  signature?: string;
  grantedAt?: Date;
}
