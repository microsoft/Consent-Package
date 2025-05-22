import React, { useState, useEffect, useCallback } from "react";
import {
  TabList,
  Tab,
  Button,
  Spinner,
  Text,
} from "@fluentui/react-components";
import PersonalProfileTab from "./PersonalProfileTab.js";
import ManagedSubjectsTab from "./ManagedSubjectsTab.js";
import ConsentsTab from "./ConsentsTab.js";
import type { ProfileProps, ProfileData } from "./Profile.type.js";
import type {
  CreateConsentInput,
  AgeGroup,
  ConsentRecord,
} from "@open-source-consent/types";
import { deserializeConsentRecord } from "../utils/consentUtils.js";
import "./index.css";

enum PROFILE_TABS {
  PERSONAL = "personal",
  MANAGED = "managed",
  CONSENTS = "consents",
}

type ManagedSubject = NonNullable<ProfileData["managedSubjects"]>[number];

interface SubjectForConsentUpdate {
  id: string;
  name?: string;
  ageForGroupDetermination?: number | string;
  directAgeGroup?: AgeGroup;
  roleForRelationship?: string;
}

const getAgeGroup = (ageInYears: number | string | undefined): AgeGroup => {
  if (ageInYears === undefined) return "18+";
  const age =
    typeof ageInYears === "string" ? parseInt(ageInYears, 10) : ageInYears;
  if (isNaN(age)) return "18+";

  if (age < 13) return "under13";
  if (age >= 13 && age <= 17) return "13-17";
  return "18+";
};

// TODO: Move and dedupe with other age group utils
const ageGroupToBasicInfo = (ageGroupId: AgeGroup): ProfileData["role"] => {
  switch (ageGroupId) {
    case "under13":
      return { id: "under13", label: "Under 13" };
    case "13-17":
      return { id: "13-17", label: "13-17" };
    case "18+":
      return { id: "18+", label: "18+" };
    default:
      return { id: ageGroupId, label: ageGroupId };
  }
};

export const Profile: React.FC<ProfileProps> = ({
  profileData,
  onProfileUpdate,
  onManagedSubjectSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState(
    PROFILE_TABS.PERSONAL as string
  );
  const [editedProfileData, setEditedProfileData] =
    useState<ProfileData | null>(profileData);
  const [selectedSubject, setSelectedSubject] = useState<ManagedSubject | null>(
    null
  );
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [saveConsentError, setSaveConsentError] = useState<string | null>(null);

  const [isLoadingConsents, setIsLoadingConsents] = useState(false);
  const [consentsError, setConsentsError] = useState<string | null>(null);
  const [isLoadingProxySubjects, setIsLoadingProxySubjects] = useState(false);
  const [proxySubjectsError, setProxySubjectsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    setEditedProfileData(
      profileData
        ? {
            ...profileData,
            consents: profileData.consents || [],
            managedSubjects:
              profileData.managedSubjects?.map((ms) => ({
                ...ms,
                consents: ms.consents || [],
              })) || [],
          }
        : null
    );
    setSelectedSubject(null);
  }, [profileData]);

  useEffect(() => {
    if (editedProfileData?.id) {
      setIsLoadingProxySubjects(true);
      setProxySubjectsError(null);
      fetch(`/api/proxies/${editedProfileData.id}/consents`)
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to fetch consents by proxy: ${response.status} ${errorText}`
            );
          }
          const rawConsentsByProxy = (await response.json()) as any[];
          return rawConsentsByProxy.map(deserializeConsentRecord);
        })
        .then((consentsByProxy: ConsentRecord[]) => {
          if (!consentsByProxy || consentsByProxy.length === 0) {
            return; // No consents, so no managed subjects to derive
          }

          const subjectsFromProxyConsents = new Map<string, ManagedSubject>();

          for (const consent of consentsByProxy) {
            if (
              consent.consenter.type === "proxy" &&
              consent.consenter.proxyDetails &&
              !subjectsFromProxyConsents.has(consent.subjectId) // Process each subject only once
            ) {
              subjectsFromProxyConsents.set(consent.subjectId, {
                id: consent.subjectId,
                name: `Managed Subject (${consent.subjectId.substring(0, 6)})`,
                relationship:
                  consent.consenter.proxyDetails.relationship || "Managed",
                ageGroup: ageGroupToBasicInfo(
                  consent.consenter.proxyDetails.subjectAgeGroup
                ),
                consents: [],
              });
            }
          }

          const newManagedSubjectsArray = Array.from(
            subjectsFromProxyConsents.values()
          );

          if (newManagedSubjectsArray.length === 0) return;

          setEditedProfileData((prev) => {
            if (!prev) return null;

            const existingManagedSubjects = prev.managedSubjects || [];
            const existingManagedSubjectIds = new Set(
              existingManagedSubjects.map((ms) => ms.id)
            );

            const newSubjectsToAdd = newManagedSubjectsArray.filter(
              (ps) => !existingManagedSubjectIds.has(ps.id)
            );

            if (newSubjectsToAdd.length === 0) return prev;

            const combinedManagedSubjects = [
              ...existingManagedSubjects,
              ...newSubjectsToAdd,
            ];
            return {
              ...prev,
              managedSubjects: combinedManagedSubjects as NonNullable<
                ProfileData["managedSubjects"]
              >,
            };
          });
        })
        .catch((err: any) => {
          console.error(
            "Error fetching or processing proxy-consented subjects:",
            err
          );
          setProxySubjectsError(
            err.message ||
              "Failed to fetch or process proxy-consented subjects."
          );
        })
        .finally(() => {
          setIsLoadingProxySubjects(false);
        });
    }
  }, [editedProfileData?.id]);

  const fetchConsentsForSubject = useCallback(
    async (subjectId: string): Promise<ConsentRecord[] | null> => {
      try {
        const response = await fetch(`/api/subjects/${subjectId}/consents`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch consents for subject ${subjectId}: ${response.status} ${errorText}`
          );
        }
        const rawConsents = (await response.json()) as any[];
        return rawConsents.map(deserializeConsentRecord);
      } catch (err: any) {
        console.error("Error fetching or processing consents:", err.message);
        setConsentsError(err.message);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (editedProfileData?.id) {
      setIsLoadingConsents(true);
      setConsentsError(null);
      fetchConsentsForSubject(editedProfileData.id)
        .then((consents) => {
          if (consents) {
            setEditedProfileData((prev) =>
              prev ? { ...prev, consents } : null
            );
          }
        })
        .catch((err) => {
          console.error(
            "Error in fetchConsentsForSubject chain (main profile):",
            err
          );
          setConsentsError(
            err.message || "Failed to process consents for profile."
          );
        })
        .finally(() => setIsLoadingConsents(false));
    }
  }, [editedProfileData?.id, fetchConsentsForSubject]);

  useEffect(() => {
    if (editedProfileData?.managedSubjects) {
      setIsLoadingConsents(true);
      setConsentsError(null);
      Promise.all(
        editedProfileData.managedSubjects.map(async (ms) => {
          const consentsResult = await fetchConsentsForSubject(ms.id);
          return { subjectId: ms.id, consents: consentsResult };
        })
      )
        .then((results) => {
          setEditedProfileData((prev) => {
            if (!prev) return null;
            const newManagedSubjects = prev.managedSubjects?.map((ms) => {
              const foundResult = results.find((r) => r.subjectId === ms.id);
              return foundResult && foundResult.consents
                ? { ...ms, consents: foundResult.consents }
                : ms;
            });
            return { ...prev, managedSubjects: newManagedSubjects };
          });
        })
        .catch((err) => {
          console.error(
            "Error in Promise.all chain (managed subjects consents):",
            err
          );
          setConsentsError(
            err.message || "Failed to process consents for managed subjects."
          );
        })
        .finally(() => setIsLoadingConsents(false));
    }
  }, [
    editedProfileData?.managedSubjects?.map((ms) => ms.id).join(","),
    fetchConsentsForSubject,
  ]);

  const refreshConsentsForSubjectUI = useCallback(
    async (subjectId: string) => {
      setIsLoadingConsents(true);
      const fetchedConsents = await fetchConsentsForSubject(subjectId);
      setIsLoadingConsents(false);
      if (fetchedConsents) {
        setEditedProfileData((prev) => {
          if (!prev) return null;
          if (prev.id === subjectId) {
            return { ...prev, consents: fetchedConsents };
          }
          if (prev.managedSubjects) {
            return {
              ...prev,
              managedSubjects: prev.managedSubjects.map((ms) =>
                ms.id === subjectId ? { ...ms, consents: fetchedConsents } : ms
              ),
            };
          }
          return prev;
        });
        if (selectedSubject && selectedSubject.id === subjectId) {
          setSelectedSubject((prev) =>
            prev ? { ...prev, consents: fetchedConsents } : null
          );
        }
      }
    },
    [fetchConsentsForSubject, selectedSubject]
  );

  const handleTabSelect = (_: unknown, data: { value: string }): void => {
    setSelectedTab(data.value);
  };

  const handleSave = (updates: Partial<ProfileData>): void => {
    if (editedProfileData && onProfileUpdate) {
      onProfileUpdate(editedProfileData.id, updates);
    }
    setEditedProfileData((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleScopeChangeAndUpdateConsent = useCallback(
    async (
      subjectForConsent: SubjectForConsentUpdate,
      isProxyConsenter: boolean,
      proxyConsenterId: string,
      policyId: string,
      scopeId: string,
      currentActiveScopes: string[],
      action: "grant" | "revoke"
    ) => {
      setIsSavingConsent(true);
      setSaveConsentError(null);

      try {
        let finalGrantedScopes = [...currentActiveScopes];
        if (action === "grant") {
          if (!finalGrantedScopes.includes(scopeId)) {
            finalGrantedScopes.push(scopeId);
          }
        } else {
          finalGrantedScopes = finalGrantedScopes.filter((s) => s !== scopeId);
        }

        let determinedAgeGroup: AgeGroup = "18+";
        if (isProxyConsenter) {
          if (subjectForConsent.directAgeGroup) {
            determinedAgeGroup = subjectForConsent.directAgeGroup;
          } else if (subjectForConsent.ageForGroupDetermination !== undefined) {
            determinedAgeGroup = getAgeGroup(
              subjectForConsent.ageForGroupDetermination
            );
          }
        }

        const consentInput: CreateConsentInput = {
          subjectId: subjectForConsent.id,
          policyId: policyId,
          consenter: isProxyConsenter
            ? {
                type: "proxy",
                userId: proxyConsenterId,
                proxyDetails: {
                  relationship:
                    subjectForConsent.roleForRelationship || "unknown",
                  subjectAgeGroup: determinedAgeGroup,
                },
              }
            : {
                type: "self",
                userId: subjectForConsent.id,
              },
          grantedScopes: finalGrantedScopes,
          metadata: {
            consentMethod: "digital_form",
          },
        };

        const response = await fetch("/api/consents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(consentInput),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to save consent changes: ${response.status} ${
              errorBody || response.statusText
            }`
          );
        }
        await refreshConsentsForSubjectUI(subjectForConsent.id);
      } catch (err: any) {
        console.error("Error saving consent changes:", err);
        setSaveConsentError(err.message || "An unknown error occurred.");
      } finally {
        setIsSavingConsent(false);
      }
    },
    [refreshConsentsForSubjectUI]
  );

  const handleSubjectUpdate = (
    subjectId: string,
    subjectUpdates: Partial<ManagedSubject>
  ): void => {
    if (!editedProfileData?.managedSubjects) return;

    const updatedSubjects = editedProfileData.managedSubjects.map((subject) =>
      subject.id === subjectId ? { ...subject, ...subjectUpdates } : subject
    );

    const profileUpdates: Partial<ProfileData> = {
      managedSubjects: updatedSubjects,
    };

    if (selectedSubject && selectedSubject.id === subjectId) {
      setSelectedSubject({ ...selectedSubject, ...subjectUpdates });
    }
    handleSave(profileUpdates);
  };

  const handleSubjectSelect = (subjectId: string): void => {
    const subject = editedProfileData?.managedSubjects?.find(
      (s) => s.id === subjectId
    );
    if (subject) {
      setSelectedSubject(subject);
      if (onManagedSubjectSelect) onManagedSubjectSelect(subjectId);
    }
  };

  const handleBackClick = (): void => {
    setSelectedSubject(null);
  };

  if (!editedProfileData) {
    return isLoadingConsents ? (
      <Spinner label="Loading profile data..." />
    ) : (
      <Text>Profile data not available.</Text>
    );
  }

  const consentsLoadingOrErrorDisplay = (
    <>
      {isLoadingConsents && <Spinner label="Loading consents..." />}
      {consentsError && (
        <div style={{ color: "red" }}>
          <Text>Error loading consents: {consentsError}</Text>
        </div>
      )}
    </>
  );

  if (selectedSubject) {
    const subjectArgsForUpdate: SubjectForConsentUpdate = {
      id: selectedSubject.id,
      name: selectedSubject.name,
      directAgeGroup: selectedSubject.ageGroup.id as AgeGroup,
      roleForRelationship: selectedSubject.ageGroup.label,
    };
    return (
      <div className="profile-container">
        <Button
          appearance="subtle"
          onClick={handleBackClick}
          disabled={isSavingConsent}
        >
          Back to Profile
        </Button>
        {consentsLoadingOrErrorDisplay}
        {isSavingConsent && <Spinner label="Saving consent..." />}
        {saveConsentError && (
          <div style={{ color: "red" }}>Error: {saveConsentError}</div>
        )}
        <PersonalProfileTab
          profileData={{
            email: "",
            role: selectedSubject.ageGroup,
            ...selectedSubject,
          }}
          onSave={(updates) => handleSubjectUpdate(selectedSubject.id, updates)}
        />
        <ConsentsTab
          consents={selectedSubject.consents}
          onGrantScope={(consentId, policyId, scopeId, currentScopes) => {
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              true,
              editedProfileData.id,
              policyId,
              scopeId,
              currentScopes,
              "grant"
            );
          }}
          onRevokeScope={(consentId, policyId, scopeId, currentScopes) => {
            void handleScopeChangeAndUpdateConsent(
              subjectArgsForUpdate,
              true,
              editedProfileData.id,
              policyId,
              scopeId,
              currentScopes,
              "revoke"
            );
          }}
        />
      </div>
    );
  }

  const selfProfileArgsForUpdate: SubjectForConsentUpdate = {
    id: editedProfileData.id,
    name: editedProfileData.name,
    ageForGroupDetermination: undefined,
    roleForRelationship: editedProfileData.role?.label,
  };

  return (
    <div className="profile-container">
      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value={PROFILE_TABS.PERSONAL}>Personal Profile</Tab>
        {editedProfileData.managedSubjects &&
          editedProfileData.managedSubjects.length > 0 && (
            <Tab value={PROFILE_TABS.MANAGED}>Managed Subjects</Tab>
          )}
        {(!editedProfileData.managedSubjects ||
          editedProfileData.managedSubjects.length === 0) && (
          <Tab value={PROFILE_TABS.CONSENTS}>Consents</Tab>
        )}
      </TabList>
      {isLoadingProxySubjects && (
        <Spinner label="Loading managed subjects..." />
      )}
      {proxySubjectsError && (
        <div style={{ color: "red" }}>
          <Text>Error loading managed subjects: {proxySubjectsError}</Text>
        </div>
      )}
      {consentsLoadingOrErrorDisplay}
      <div>
        {selectedTab === PROFILE_TABS.PERSONAL && (
          <PersonalProfileTab
            profileData={editedProfileData}
            onSave={handleSave}
          />
        )}

        {selectedTab === PROFILE_TABS.MANAGED &&
          editedProfileData.managedSubjects &&
          editedProfileData.managedSubjects.length > 0 && (
            <ManagedSubjectsTab
              managedSubjects={editedProfileData.managedSubjects}
              onSubjectSelect={handleSubjectSelect}
              onSubjectUpdate={handleSubjectUpdate}
            />
          )}

        {selectedTab === PROFILE_TABS.CONSENTS &&
          (!editedProfileData.managedSubjects ||
            editedProfileData.managedSubjects.length === 0) && (
            <>
              {isSavingConsent && <Spinner label="Saving consent..." />}
              {saveConsentError && (
                <div style={{ color: "red" }}>
                  <Text>Error: {saveConsentError}</Text>
                </div>
              )}
              <ConsentsTab
                consents={editedProfileData.consents}
                onGrantScope={(consentId, policyId, scopeId, currentScopes) => {
                  void handleScopeChangeAndUpdateConsent(
                    selfProfileArgsForUpdate,
                    false,
                    editedProfileData.id,
                    policyId,
                    scopeId,
                    currentScopes,
                    "grant"
                  );
                }}
                onRevokeScope={(
                  consentId,
                  policyId,
                  scopeId,
                  currentScopes
                ) => {
                  void handleScopeChangeAndUpdateConsent(
                    selfProfileArgsForUpdate,
                    false,
                    editedProfileData.id,
                    policyId,
                    scopeId,
                    currentScopes,
                    "revoke"
                  );
                }}
              />
            </>
          )}
      </div>
    </div>
  );
};

export default Profile;
