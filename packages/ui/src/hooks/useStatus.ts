import { useState, useCallback } from "react";

export interface StatusState {
  isLoadingConsents: boolean;
  isLoadingProxySubjects: boolean;
  isSavingConsent: boolean;
  consentsError: string | null;
  proxySubjectsError: string | null;
  saveConsentError: string | null;
}

export const useStatus = () => {
  const [status, setStatus] = useState<StatusState>({
    isLoadingConsents: false,
    isLoadingProxySubjects: false,
    isSavingConsent: false,
    consentsError: null,
    proxySubjectsError: null,
    saveConsentError: null,
  });

  const updateStatus = useCallback((updates: Partial<StatusState>) => {
    setStatus((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    status,
    updateStatus,
  };
};

export default useStatus;
