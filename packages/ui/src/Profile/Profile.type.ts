import type { AgeGroup, ConsentRecord } from "@open-source-consent/types";

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

export interface ManagedSubject {
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

export interface SubjectForConsentUpdate {
  id: string;
  name?: string;
  ageForGroupDetermination?: number | string;
  directAgeGroup?: AgeGroup;
  roleForRelationship?: string;
}
