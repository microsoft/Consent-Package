import { useState, useCallback, useEffect } from "react";
import type { ProfileData } from "@open-source-consent/ui";
import {
  getCurrentUserId,
  login as storeLogin,
  logout as storeLogout,
  fetchUserProfile,
} from "./userManagement.js";

export interface AuthHook {
  currentUser: ProfileData | null;
  isLoading: boolean;
  login(subjectId: string): Promise<void>;
  logout(): void;
}

/**
 * Auth is primarily simulated in this demo just to show how consents
 * are managed across multiple subjects.
 * This framework does not provide auth or user management, what is shown
 * here is purely to demonstrate the consent management functionality.
 * @returns
 */
export function useAuth(): AuthHook {
  const [currentUser, setCurrentUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | null) => {
    setIsLoading(true);
    if (userId) {
      const userProfileData = await fetchUserProfile(userId);
      setCurrentUser(userProfileData);
      if (!userProfileData) {
        storeLogout();
      }
    } else {
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    void loadProfile(currentUserId);
  }, [loadProfile]);

  const login = useCallback(
    async (subjectId: string) => {
      setIsLoading(true);
      storeLogin(subjectId);
      await loadProfile(subjectId);
    },
    [loadProfile]
  );

  const logout = useCallback(() => {
    storeLogout();
    setCurrentUser(null);
  }, []);

  return { currentUser, isLoading, login, logout };
}
