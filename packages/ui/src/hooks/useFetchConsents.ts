// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useCallback } from 'react';
import { deserializeConsentRecord } from '../utils/consentUtils.js';
import type { ConsentRecord } from '@open-source-consent/types';
import type { StatusState } from './useStatus.js';
import { fetchWithConfig } from '../utils/fetchWithConfig.js';

/**
 * Hook for fetching consents for a subject
 */
export default function useFetchConsents(
  updateStatus: (updates: Partial<StatusState>) => void,
): {
  fetchConsentsForSubject(subjectId: string): Promise<ConsentRecord[] | null>;
} {
  /**
   * Fetch consents for a specific subject
   */
  const fetchConsentsForSubject = useCallback(
    async (subjectId: string): Promise<ConsentRecord[] | null> => {
      try {
        const response = await fetchWithConfig(
          `/api/subjects/${subjectId}/consents`,
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch consents: ${response.status} ${errorText}`,
          );
        }
        const rawConsents = await response.json();
        return rawConsents.map(deserializeConsentRecord);
      } catch (err: any) {
        console.error('Error fetching consents:', err.message);
        updateStatus({ consentsError: err.message });
        return null;
      }
    },
    [updateStatus],
  );

  return {
    fetchConsentsForSubject,
  };
}
