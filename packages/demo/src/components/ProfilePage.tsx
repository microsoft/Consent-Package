import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { Text, Card, makeStyles, Spinner } from "@fluentui/react-components";
import { Profile } from "@open-source-consent/ui";
import type { ProfileData } from "@open-source-consent/ui";
import { fetchUserProfile } from "../utils/userManagement.js";

const useStyles = makeStyles({
  root: {
    padding: "24px",
    margin: "16px",
    "@media (max-width: 768px)": {
      padding: "24px",
    },
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: "24px",
  },
});

interface AppOutletContext {
  user: ProfileData | null;
}

export function ProfilePage(): JSX.Element {
  const styles = useStyles();
  const { user: loggedInUser } = useOutletContext<AppOutletContext>();
  const { userId } = useParams<{ userId: string }>();

  const [profileToDisplay, setProfileToDisplay] = useState<ProfileData | null>(
    null
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided in the URL.");
      setIsLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setError(null);
      try {
        const fetchedProfile = await fetchUserProfile(userId);
        if (fetchedProfile) {
          setProfileToDisplay(fetchedProfile);
        } else {
          setError("Profile not found.");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      }
      setIsLoadingProfile(false);
    };

    void loadProfile();
  }, [userId]);

  const handleProfileUpdate = (
    profileId: string,
    updates: Partial<ProfileData>
  ): void => {
    console.info("Profile updated (mock):", { profileId, updates });
  };

  const handleManagedSubjectSelect = (subjectId: string): void => {
    console.info("Managed subject selected:", subjectId);
  };

  if (isLoadingProfile) {
    return (
      <Card className={`${styles.root} ${styles.centered}`}>
        <Spinner label={`Loading profile for ${userId || "user"}...`} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${styles.root} ${styles.centered}`}>
        <Text as="h2">Error</Text>
        <Text>{error}</Text>
      </Card>
    );
  }

  if (!profileToDisplay) {
    return (
      <Card className={`${styles.root} ${styles.centered}`}>
        <Text as="h2">Profile not available.</Text>
        <Text>The profile for the specified user ID could not be loaded.</Text>
      </Card>
    );
  }

  return (
    <Card className={styles.root}>
      <Text as="h1" size={600} weight="semibold" underline>
        Profile ({profileToDisplay.name})
      </Text>

      <Profile
        profileData={profileToDisplay}
        isManagingSubjects={
          loggedInUser?.id === profileToDisplay.id &&
          profileToDisplay.role?.id !== "self" &&
          profileToDisplay.managedSubjects &&
          profileToDisplay.managedSubjects.length > 0
        }
        onProfileUpdate={handleProfileUpdate}
        onManagedSubjectSelect={handleManagedSubjectSelect}
      />
    </Card>
  );
}
