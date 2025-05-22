import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { Text, Card, makeStyles, Spinner } from "@fluentui/react-components";
import { Profile } from "@open-source-consent/ui";
import type { ProfileData } from "@open-source-consent/ui";
import { fetchUserProfile } from "../utils/userManagement.js"; // Import the fetch function

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
    flexDirection: "column", // Align text vertically
    justifyContent: "center",
    alignItems: "center",
    height: "100%", // Or a fixed height like 300px
    padding: "24px",
  },
});

interface AppOutletContext {
  user: ProfileData | null; // This is the logged-in user
}

export function ProfilePage(): JSX.Element {
  const styles = useStyles();
  const { user: loggedInUser } = useOutletContext<AppOutletContext>(); // Renamed for clarity
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
    // Potentially re-fetch or update local state if editable
  };

  const handleManagedSubjectSelect = (subjectId: string): void => {
    console.info("Managed subject selected:", subjectId);
    // Navigate or perform action for managed subject
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
    // This case should ideally be covered by the error state if fetch fails
    // or if fetchUserProfile returns null explicitly for a not-found user.
    return (
      <Card className={`${styles.root} ${styles.centered}`}>
        <Text as="h2">Profile not available.</Text>
        <Text>The profile for the specified user ID could not be loaded.</Text>
      </Card>
    );
  }

  // The check `currentUser.id !== userId` has been removed.
  // Now we display the profile fetched based on `userId` from the URL.
  // `loggedInUser` (the old `currentUser`) can be used for permission checks, e.g., edit button.

  return (
    <Card className={styles.root}>
      <Text as="h1" size={600} weight="semibold" underline>
        Profile ({profileToDisplay.name})
      </Text>

      <Profile
        profileData={profileToDisplay}
        isManagingSubjects={
          // Logic for isManagingSubjects might need to consider `loggedInUser` vs `profileToDisplay`
          // For now, let's assume it's based on the displayed profile's data AND if loggedInUser is the same.
          loggedInUser?.id === profileToDisplay.id &&
          profileToDisplay.role?.id !== "self" &&
          profileToDisplay.managedSubjects &&
          profileToDisplay.managedSubjects.length > 0
        }
        onProfileUpdate={handleProfileUpdate}
        onManagedSubjectSelect={handleManagedSubjectSelect}
        // Consider adding an isEditable prop based on `loggedInUser?.id === profileToDisplay.id`
      />
    </Card>
  );
}
