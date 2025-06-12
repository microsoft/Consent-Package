// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React, { useState, useEffect, useCallback } from 'react';
import {
  TabList,
  Tab,
  Button,
  Spinner,
  Text,
} from '@fluentui/react-components';
import PersonalProfileTab from './PersonalProfileTab.js';
import ManagedSubjectsTab from './ManagedSubjectsTab.js';
import ConsentsTab from './ConsentsTab.js';
import type {
  ProfileProps,
  ManagedSubject,
  SubjectForConsentUpdate,
} from './Profile.type.js';
import type { AgeGroup } from '@open-source-consent/types';
import './index.css';

import useProfileData from '../hooks/useProfileData.js';
import useStatus from '../hooks/useStatus.js';
import useConsents from '../hooks/useConsents.js';
import useFetchManagedSubjects from '../hooks/useFetchManagedSubjects.js';

enum PROFILE_TABS {
  PERSONAL = 'personal',
  MANAGED = 'managed',
  CONSENTS = 'consents',
}

export const Profile: React.FC<ProfileProps> = ({
  profileData: initialProfileData,
  onManagedSubjectSelect,
  subjectIdToDisplayName,
}) => {
  const [selectedTab, setSelectedTab] = useState(PROFILE_TABS.PERSONAL);
  const [selectedSubject, setSelectedSubject] = useState<ManagedSubject | null>(
    null,
  );

  const { profileData, setProfileData } = useProfileData(initialProfileData);
  const { status, updateStatus } = useStatus();
  const { refreshConsentsForSubject, updateConsents, handleScopeChange } =
    useConsents(profileData, updateStatus);

  // Initialize the managed proxies fetching hook
  useFetchManagedSubjects(
    profileData?.id,
    updateStatus,
    setProfileData,
    subjectIdToDisplayName,
  );

  useEffect(() => {
    setProfileData(
      initialProfileData
        ? {
            ...initialProfileData,
            consents: initialProfileData.consents || [],
            managedSubjects: (initialProfileData.managedSubjects || []).map(
              (ms) => ({
                ...ms,
                consents: ms.consents || [],
              }),
            ),
          }
        : null,
    );
    setSelectedSubject(null);
  }, [initialProfileData, setProfileData]);

  useEffect(() => {
    const updateProfileConsents = async () => {
      if (!profileData?.id) return;

      const updatedProfileData = await updateConsents(
        profileData.id,
        profileData.managedSubjects,
      );
      if (updatedProfileData) {
        setProfileData((prev) =>
          prev ? { ...prev, ...updatedProfileData } : null,
        );
      }
    };

    void updateProfileConsents();
  }, [profileData?.id, updateConsents, setProfileData]);

  const refreshConsentsForSubjectUI = useCallback(
    async (subjectId: string) => {
      await refreshConsentsForSubject(
        subjectId,
        setProfileData,
        selectedSubject,
        (updater) => setSelectedSubject(updater(selectedSubject)),
      );
    },
    [refreshConsentsForSubject, selectedSubject, setProfileData],
  );

  const handleScopeChangeAndUpdateConsent = useCallback(
    async (
      subjectForConsent: SubjectForConsentUpdate,
      isProxyConsenter: boolean,
      proxyConsenterId: string,
      policyId: string,
      scopeId: string,
      currentActiveScopes: string[],
      action: 'grant' | 'revoke',
    ) => {
      await handleScopeChange(
        subjectForConsent,
        isProxyConsenter,
        proxyConsenterId,
        policyId,
        scopeId,
        currentActiveScopes,
        action,
        refreshConsentsForSubjectUI,
      );
    },
    [handleScopeChange, refreshConsentsForSubjectUI],
  );

  const handleTabSelect = (_: unknown, data: { value: string }): void => {
    setSelectedTab(data.value as PROFILE_TABS);
  };

  const handleSubjectSelect = useCallback(
    (subjectId: string): void => {
      const subject = profileData?.managedSubjects?.find(
        (s) => s.id === subjectId,
      );
      if (subject) {
        setSelectedSubject(subject);
        if (onManagedSubjectSelect) onManagedSubjectSelect(subjectId);
      }
    },
    [profileData?.managedSubjects, onManagedSubjectSelect],
  );

  if (!profileData) {
    return status.isLoadingConsents ? (
      <Spinner label="Loading profile data..." />
    ) : (
      <Text>Profile data not available.</Text>
    );
  }

  const statusDisplay = (
    <>
      {status.isLoadingConsents && <Spinner label="Loading consents..." />}
      {status.consentsError && (
        <div style={{ color: 'red' }}>
          <Text>Error loading consents: {status.consentsError}</Text>
        </div>
      )}
      {status.isLoadingProxySubjects && (
        <Spinner label="Loading managed proxies..." />
      )}
      {status.proxySubjectsError && (
        <div style={{ color: 'red' }}>
          <Text>
            Error loading managed proxies: {status.proxySubjectsError}
          </Text>
        </div>
      )}
      {status.isSavingConsent && <Spinner label="Saving consent..." />}
      {status.saveConsentError && (
        <div style={{ color: 'red' }}>
          <Text>Error: {status.saveConsentError}</Text>
        </div>
      )}
    </>
  );

  if (selectedSubject) {
    const subjectArgsForUpdate: SubjectForConsentUpdate = {
      id: selectedSubject.id,
      name: selectedSubject.name,
      directAgeGroup: selectedSubject.ageGroup.id as AgeGroup,
      roleForRelationship: selectedSubject.relationship,
    };

    return (
      <div className="profile-container">
        <Button
          appearance="subtle"
          onClick={() => setSelectedSubject(null)}
          disabled={status.isSavingConsent}
        >
          Back to Profile
        </Button>
        {statusDisplay}
        <PersonalProfileTab
          profileData={{
            email: '',
            role: selectedSubject.ageGroup,
            ...selectedSubject,
          }}
        />
        <ConsentsTab
          consents={selectedSubject.consents}
          onGrantScope={(_, policyId, scopeId, currentScopes) => {
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              true,
              profileData.id,
              policyId,
              scopeId,
              currentScopes,
              'grant',
            );
          }}
          onRevokeScope={(_, policyId, scopeId, currentScopes) => {
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              true,
              profileData.id,
              policyId,
              scopeId,
              currentScopes,
              'revoke',
            );
          }}
        />
      </div>
    );
  }

  const hasManagedSubjects =
    profileData.managedSubjects && profileData.managedSubjects.length > 0;

  return (
    <div className="profile-container">
      {statusDisplay}
      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value={PROFILE_TABS.PERSONAL}>Personal Information</Tab>
        {hasManagedSubjects && (
          <Tab value={PROFILE_TABS.MANAGED}>Managed Proxies</Tab>
        )}
        <Tab value={PROFILE_TABS.CONSENTS}>View/Edit Consent Data</Tab>
      </TabList>

      {selectedTab === PROFILE_TABS.PERSONAL && (
        <PersonalProfileTab profileData={profileData} />
      )}
      {selectedTab === PROFILE_TABS.MANAGED && hasManagedSubjects && (
        <ManagedSubjectsTab
          managedSubjects={profileData.managedSubjects}
          onSubjectSelect={handleSubjectSelect}
        />
      )}
      {selectedTab === PROFILE_TABS.CONSENTS && (
        <ConsentsTab
          consents={profileData.consents}
          onGrantScope={(_, policyId, scopeId, currentScopes) => {
            const subjectArgsForUpdate: SubjectForConsentUpdate = {
              id: profileData.id,
              name: profileData.name,
              directAgeGroup: profileData.role.id as AgeGroup,
            };
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              false,
              profileData.id,
              policyId,
              scopeId,
              currentScopes,
              'grant',
            );
          }}
          onRevokeScope={(_, policyId, scopeId, currentScopes) => {
            const subjectArgsForUpdate: SubjectForConsentUpdate = {
              id: profileData.id,
              name: profileData.name,
              directAgeGroup: profileData.role.id as AgeGroup,
            };
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              false,
              profileData.id,
              policyId,
              scopeId,
              currentScopes,
              'revoke',
            );
          }}
        />
      )}
    </div>
  );
};

export default Profile;
