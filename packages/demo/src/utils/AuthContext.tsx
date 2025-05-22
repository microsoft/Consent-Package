import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { ProfileData } from "@open-source-consent/ui";
import {
  getCurrentUserId,
  login as storeLogin,
  logout as storeLogout,
  fetchUserProfile,
} from "./userManagement.js";

interface AuthContextType {
  currentUser: ProfileData | null;
  isLoading: boolean;
  login(subjectId: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth is primarily simulated in this demo just to show how consents
 * are managed across multiple subjects.
 * This framework does not provide auth or user management, what is shown
 * here is purely to demonstrate the consent management functionality.
 * @returns
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
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

    // Storage event listener to handle auth changes across tabs
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === "currentUserId") {
        void loadProfile(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return (): void => window.removeEventListener("storage", handleStorageChange);
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

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
