interface BasicInfo {
  id: string;
  label: string;
  description?: string;
}

interface Scope extends BasicInfo { 
  required?: boolean
}

interface Consent {
  id: string;
  policy: BasicInfo;
  status: BasicInfo;
  scopes: Scope[];
}

interface ManagedSubject {
  id: string;
  name: string;
  relationship: string;
  ageGroup: BasicInfo;
  consents: Consent[];
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: BasicInfo;
  managedSubjects?: ManagedSubject[];
  consents: Consent[];
}

export interface ProfileProps {
  profileData: ProfileData;
  isManagingSubjects?: boolean;
  onProfileUpdate(profileId: string, updates: Partial<ProfileData>): void;
  onManagedSubjectSelect(profileId: string): void;
}
