import { useEffect, useCallback } from 'react';
import { deserializeConsentRecord } from '../utils/consentUtils.js';
import type { ProfileData } from '../Profile/Profile.type.js';
import type { StatusState } from './useStatus.js';
import type { ConsentRecord } from '@open-source-consent/types';
import { fetchWithConfig } from '../utils/fetchWithConfig.js';

interface ProxySubject {
  id: string;
  name: string;
  relationship: string;
  ageGroup: {
    id: string;
    label: string;
  };
  consents: ConsentRecord[];
}

interface FetchManagedSubjectsResult {
  fetchProxySubjects(): Promise<ProxySubject[] | null>;
  fetchConsentsForSubject(subjectId: string): Promise<ConsentRecord[]>;
}

/**
 * Hook for fetching managed subjects with their consents
 */
export default function useFetchManagedSubjects(
  profileId: string | undefined,
  updateStatus: (updates: Partial<StatusState>) => void,
  setProfileData: (
    updater: (prev: ProfileData | null) => ProfileData | null,
  ) => void,
  subjectIdToDisplayName: (subjectId: string) => string,
): FetchManagedSubjectsResult {
  // Fetch consents for a specific subject
  const fetchConsentsForSubject = useCallback(
    async (subjectId: string): Promise<ConsentRecord[]> => {
      try {
        const response = await fetchWithConfig(
          `/api/subjects/${subjectId}/consents`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch consents: ${response.status}`);
        }
        const rawConsents = await response.json();
        return rawConsents.map(deserializeConsentRecord);
      } catch (err: any) {
        console.error(`Error fetching consents for subject ${subjectId}:`, err);
        return [];
      }
    },
    [],
  );

  // Fetch proxy subjects
  const fetchProxySubjects = useCallback(async (): Promise<
    ProxySubject[] | null
  > => {
    if (!profileId) return null;

    updateStatus({ isLoadingProxySubjects: true, proxySubjectsError: null });

    try {
      const response = await fetchWithConfig(
        `/api/proxies/${profileId}/consents`,
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch proxy consents: ${response.status} ${errorText}`,
        );
      }

      const rawConsentsByProxy = await response.json();
      const consentsByProxy = rawConsentsByProxy.map(deserializeConsentRecord);

      if (!consentsByProxy || consentsByProxy.length === 0) return [];

      const subjectsFromProxyConsents = new Map<string, ProxySubject>();

      for (const consent of consentsByProxy) {
        if (
          consent.consenter.type === 'proxy' &&
          consent.consenter.proxyDetails &&
          !subjectsFromProxyConsents.has(consent.subjectId)
        ) {
          subjectsFromProxyConsents.set(consent.subjectId, {
            id: consent.subjectId,
            name: subjectIdToDisplayName(consent.subjectId),
            relationship:
              consent.consenter.proxyDetails.relationship || 'Managed',
            ageGroup: {
              id: consent.consenter.proxyDetails.subjectAgeGroup,
              label: consent.consenter.proxyDetails.subjectAgeGroup,
            },
            consents: [], // Will be populated later
          });
        }
      }

      return Array.from(subjectsFromProxyConsents.values());
    } catch (err: any) {
      console.error('Error fetching proxy subjects:', err);
      updateStatus({
        proxySubjectsError: err.message || 'Failed to load managed subjects',
      });
      return null;
    } finally {
      updateStatus({ isLoadingProxySubjects: false });
    }
  }, [profileId, updateStatus, subjectIdToDisplayName]);

  // Load proxy subjects with their consents
  useEffect(() => {
    const loadProxySubjects = async () => {
      if (!profileId) return;

      const proxySubjects = await fetchProxySubjects();
      if (!proxySubjects || proxySubjects.length === 0) return;

      if (proxySubjects.length > 0) {
        const subjectsWithConsents = await Promise.all(
          proxySubjects.map(async (subject) => {
            try {
              const consents = await fetchConsentsForSubject(subject.id);
              return {
                ...subject,
                consents: consents || [],
              };
            } catch (err) {
              console.error(
                `Error fetching consents for proxy subject ${subject.id}:`,
                err,
              );
              return subject;
            }
          }),
        );

        setProfileData((prev) => {
          if (!prev) return null;

          const existingManagedSubjects = prev.managedSubjects || [];
          const existingManagedSubjectIds = new Set(
            existingManagedSubjects.map((ms) => ms.id),
          );

          const newSubjectsToAdd = subjectsWithConsents.filter(
            (ps) => !existingManagedSubjectIds.has(ps.id),
          );

          if (newSubjectsToAdd.length === 0) return prev;

          return {
            ...prev,
            managedSubjects: [...existingManagedSubjects, ...newSubjectsToAdd],
          };
        });
      }
    };

    void loadProxySubjects();
  }, [profileId, fetchProxySubjects, fetchConsentsForSubject, setProfileData]);

  return {
    fetchProxySubjects,
    fetchConsentsForSubject,
  };
}
