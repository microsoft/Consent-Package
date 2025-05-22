import type { ConsentRecord } from "@open-source-consent/types";

interface BasicInfo {
  id: string;
  label: string;
  description?: string;
}

export interface Consent {
  id: string;
  policy: BasicInfo;
  status: BasicInfo;
  scopes: BasicInfo[];
}

interface ManagedSubject {
  id: string;
  name: string;
  relationship: string;
  ageGroup: BasicInfo;
  consents: ConsentRecord[];
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: BasicInfo;
  managedSubjects?: ManagedSubject[];
  consents: ConsentRecord[];
}

export interface ProfileProps {
  profileData: ProfileData;
  isManagingSubjects?: boolean;
  onProfileUpdate(profileId: string, updates: Partial<ProfileData>): void;
  onManagedSubjectSelect(profileId: string): void;
}
