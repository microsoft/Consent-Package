import React, { useState } from 'react';
import {
  TabList,
  Tab,
} from '@fluentui/react-components';
import PersonalProfileTab from './PersonalProfileTab.js';
import ManagedSubjectsTab from './ManagedSubjectsTab.js';
import ConsentsTab from './ConsentsTab.js';
import './index.css';

enum PROFILE_TABS {
  PERSONAL = 'personal',
  MANAGED = 'managed',
  CONSENTS = 'consents',
}

export interface BaseStatus {
  id: string;
  label: string;
  description?: string;
}

export interface AgeGroupStatus extends BaseStatus {}

export interface ConsentStatus extends BaseStatus {}

export interface RoleStatus extends BaseStatus {}

export interface PolicyStatus extends BaseStatus {}

export interface ScopeStatus extends BaseStatus {}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: RoleStatus;
  managedSubjects?: {
    id: string;
    name: string;
    relationship: string;
    ageGroup: AgeGroupStatus;
  }[];
  consents?: {
    id: string;
    policy: PolicyStatus;
    status: ConsentStatus;
    scopes: ScopeStatus[];
  }[];
}

interface ProfileProps {
  profileData: ProfileData;
  isManagingSubjects?: boolean;
  onProfileUpdate(profileId: string, updates: Partial<ProfileData>): void;
  onManagedSubjectSelect(profileId: string): void;
}

export const Profile: React.FC<ProfileProps> = ({
  profileData,
  isManagingSubjects,
  onProfileUpdate,
  onManagedSubjectSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState(PROFILE_TABS.PERSONAL as string);
  const [editedProfileData, setEditedProfileData] = useState<ProfileData>(profileData);

  const handleTabSelect = (_: unknown, data: { value: string }): void => {
    setSelectedTab(data.value);
  };

  const handleSave = (updates: Partial<ProfileData>): void => {
    if (profileData && onProfileUpdate) {
      onProfileUpdate(profileData.id, updates);
    }
    setEditedProfileData(updates as ProfileData)
  };

  if (!profileData) {
    return null;
  }

  return (
    <div className="profile-container">
      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value={PROFILE_TABS.PERSONAL}>Personal Profile</Tab>
        {isManagingSubjects && (
          <Tab value={PROFILE_TABS.MANAGED}>Managed Subjects</Tab>
        )}
        <Tab value={PROFILE_TABS.CONSENTS}>Consents</Tab>
      </TabList>

      <div>
        {selectedTab === PROFILE_TABS.PERSONAL && (
          <PersonalProfileTab
            profileData={editedProfileData}
            onSave={handleSave}
          />
        )}

        {selectedTab === PROFILE_TABS.MANAGED && isManagingSubjects && (
          <ManagedSubjectsTab
            managedSubjects={profileData.managedSubjects}
            onSubjectSelect={onManagedSubjectSelect}
          />
        )}

        {selectedTab === PROFILE_TABS.CONSENTS && (
          <ConsentsTab consents={profileData.consents} />
        )}
      </div>
    </div>
  );
};

export default Profile;
