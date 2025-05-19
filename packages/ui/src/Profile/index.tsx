import React, { useState, useEffect } from 'react';
import {
  TabList,
  Tab,
  Button,
} from '@fluentui/react-components';
import PersonalProfileTab from './PersonalProfileTab.js';
import ManagedSubjectsTab from './ManagedSubjectsTab.js';
import ConsentsTab from './ConsentsTab.js';
import type { ProfileProps, ProfileData } from './Profile.type.js';
import './index.css';

enum PROFILE_TABS {
  PERSONAL = 'personal',
  MANAGED = 'managed',
  CONSENTS = 'consents',
}

type ManagedSubject = NonNullable<ProfileData['managedSubjects']>[number];

export const Profile: React.FC<ProfileProps> = ({
  profileData,
  isManagingSubjects,
  onProfileUpdate,
  onManagedSubjectSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState(PROFILE_TABS.PERSONAL as string);
  const [editedProfileData, setEditedProfileData] = useState<ProfileData>(profileData);
  const [selectedSubject, setSelectedSubject] = useState<ManagedSubject | null>(null);

  useEffect(() => {
    setEditedProfileData(profileData);
  }, [profileData]);

  const handleTabSelect = (_: unknown, data: { value: string }): void => {
    setSelectedTab(data.value);
  };

  const handleSave = (updates: Partial<ProfileData>): void => {
    if (profileData && onProfileUpdate) {
      onProfileUpdate(profileData.id, updates);
    }
    setEditedProfileData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSubjectUpdate = (subjectId: string, subjectUpdates: Partial<ManagedSubject>): void => {
    if (!editedProfileData.managedSubjects) return;

    const updatedSubjects = editedProfileData.managedSubjects.map(subject =>
      subject.id === subjectId ? { ...subject, ...subjectUpdates } : subject
    );

    const profileUpdates: Partial<ProfileData> = {
      managedSubjects: updatedSubjects
    };

    if (selectedSubject) setSelectedSubject({ ...selectedSubject, ...subjectUpdates });
    handleSave(profileUpdates);
  };

  const handleSubjectSelect = (subjectId: string): void => {
    const subject = editedProfileData.managedSubjects?.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      onManagedSubjectSelect(subjectId);
    }
  };

  const handleBackClick = (): void => {
    setSelectedSubject(null);
  };

  if (!profileData) {
    return null;
  }

  if (selectedSubject) {
    return (
      <div className="profile-container">
        <Button
          appearance="subtle"
          onClick={handleBackClick}
        >
          Back to Profile
        </Button>
        <PersonalProfileTab
          profileData={{
            email: '',
            role: selectedSubject.ageGroup,
            ...selectedSubject,
          }}
          onSave={(updates) => handleSubjectUpdate(selectedSubject.id, updates)}
        />
        <ConsentsTab consents={selectedSubject.consents} />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value={PROFILE_TABS.PERSONAL}>Personal Profile</Tab>
        {isManagingSubjects && (
          <Tab value={PROFILE_TABS.MANAGED}>Managed Subjects</Tab>
        )}
        {!isManagingSubjects && (
          <Tab value={PROFILE_TABS.CONSENTS}>Consents</Tab>
        )}
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
            managedSubjects={editedProfileData.managedSubjects}
            onSubjectSelect={handleSubjectSelect}
            onSubjectUpdate={handleSubjectUpdate}
          />
        )}

        {selectedTab === PROFILE_TABS.CONSENTS && !isManagingSubjects && (
          <ConsentsTab consents={editedProfileData.consents} />
        )}
      </div>
    </div>
  );
};

export default Profile;
