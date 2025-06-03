import { useState } from 'react';
import type { ProfileData } from '../Profile/Profile.type.js';

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
      : null,
  );

  return {
    profileData,
    setProfileData,
  };
};

export default useProfileData;
