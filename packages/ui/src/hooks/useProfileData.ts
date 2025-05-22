import { useState, useCallback } from "react";
import type { ProfileData, ManagedSubject } from "../Profile/Profile.type.js";

export const useProfileData = (initialData: ProfileData | null) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(
    initialData
      ? {
          ...initialData,
          consents: initialData.consents || [],
          managedSubjects:
            initialData.managedSubjects?.map((ms) => ({
              ...ms,
              consents: ms.consents || [],
            })) || [],
        }
      : null
  );

  const handleSave = useCallback((updates: Partial<ProfileData>): void => {
    setProfileData((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const handleSubjectUpdate = useCallback(
    (subjectId: string, subjectUpdates: Partial<ManagedSubject>): void => {
      if (!profileData?.managedSubjects) return;

      const updatedSubjects = profileData.managedSubjects.map((subject) =>
        subject.id === subjectId ? { ...subject, ...subjectUpdates } : subject
      );

      handleSave({ managedSubjects: updatedSubjects });
    },
    [profileData?.managedSubjects, handleSave]
  );

  return {
    profileData,
    setProfileData,
    handleSave,
    handleSubjectUpdate,
  };
};

export default useProfileData;
