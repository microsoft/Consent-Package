import { useCallback } from "react";
import type { AgeGroup, CreateConsentInput } from "@open-source-consent/types";
import type {
  ProfileData,
  ManagedSubject,
  SubjectForConsentUpdate,
} from "../Profile/Profile.type.js";
import { getAgeGroup } from "../utils/ageUtils.js";
import type { StatusState } from "./useStatus.js";
import useFetchConsents from "./useFetchConsents.js";

export const useConsents = (
  profileData: ProfileData | null,
  updateStatus: (updates: Partial<StatusState>) => void
) => {
  const { fetchConsentsForSubject } = useFetchConsents(updateStatus);

  const refreshConsentsForSubject = useCallback(
    async (
      subjectId: string,
      setProfileData: (
        updater: (prev: ProfileData | null) => ProfileData | null
      ) => void,
      selectedSubject: ManagedSubject | null,
      setSelectedSubject: (
        updater: (prev: ManagedSubject | null) => ManagedSubject | null
      ) => void
    ) => {
      updateStatus({ isLoadingConsents: true });
      const fetchedConsents = await fetchConsentsForSubject(subjectId);
      updateStatus({ isLoadingConsents: false });

      if (fetchedConsents) {
        setProfileData((prev) => {
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

        if (selectedSubject?.id === subjectId) {
          setSelectedSubject((prev) =>
            prev ? { ...prev, consents: fetchedConsents } : null
          );
        }
      }
    },
    [fetchConsentsForSubject, updateStatus]
  );

  const updateConsents = useCallback(
    async (profileId: string, managedSubjects?: ManagedSubject[]) => {
      if (!profileId) return;

      updateStatus({ isLoadingConsents: true, consentsError: null });

      try {
        // Fetch main profile consents
        const mainConsents = await fetchConsentsForSubject(profileId);
        const updatedProfile: Partial<ProfileData> = {};

        if (mainConsents) {
          updatedProfile.consents = mainConsents;
        }

        // Fetch consents for all managed subjects
        if (managedSubjects?.length) {
          const results = await Promise.all(
            managedSubjects.map(async (ms) => {
              const consents = await fetchConsentsForSubject(ms.id);
              return { subjectId: ms.id, consents };
            })
          );

          const updatedManagedSubjects = managedSubjects.map((ms) => {
            const foundResult = results.find((r) => r.subjectId === ms.id);
            return foundResult && foundResult.consents
              ? { ...ms, consents: foundResult.consents }
              : { ...ms, consents: [] }; // Ensure consents is at least an empty array
          });

          updatedProfile.managedSubjects = updatedManagedSubjects;
        }

        return updatedProfile;
      } catch (err: any) {
        console.error("Error fetching consents:", err);
        updateStatus({
          consentsError: err.message || "Failed to load consents",
        });
        return null;
      } finally {
        updateStatus({ isLoadingConsents: false });
      }
    },
    [fetchConsentsForSubject, updateStatus]
  );

  const handleScopeChange = useCallback(
    async (
      subjectForConsent: SubjectForConsentUpdate,
      isProxyConsenter: boolean,
      proxyConsenterId: string,
      policyId: string,
      scopeId: string,
      currentActiveScopes: string[],
      action: "grant" | "revoke",
      refreshConsents: (subjectId: string) => Promise<void>
    ) => {
      updateStatus({ isSavingConsent: true, saveConsentError: null });

      try {
        const finalGrantedScopes =
          action === "grant"
            ? [...currentActiveScopes, scopeId].filter(
                (s, i, a) => a.indexOf(s) === i
              ) // Add and deduplicate
            : currentActiveScopes.filter((s) => s !== scopeId); // Remove

        let determinedAgeGroup: AgeGroup = "18+";
        if (isProxyConsenter) {
          determinedAgeGroup =
            subjectForConsent.directAgeGroup ||
            (subjectForConsent.ageForGroupDetermination !== undefined
              ? getAgeGroup(subjectForConsent.ageForGroupDetermination)
              : "18+");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(consentInput),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Failed to save consent: ${response.status} ${errorBody || response.statusText}`
          );
        }

        await refreshConsents(subjectForConsent.id);
      } catch (err: any) {
        console.error("Error saving consent:", err);
        updateStatus({
          saveConsentError: err.message || "Failed to save consent",
        });
      } finally {
        updateStatus({ isSavingConsent: false });
      }
    },
    [updateStatus]
  );

  return {
    refreshConsentsForSubject,
    updateConsents,
    handleScopeChange,
  };
};

export default useConsents;
