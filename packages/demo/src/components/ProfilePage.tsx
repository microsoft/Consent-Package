import { useLocation } from "react-router-dom";
import { Text, Card, makeStyles } from "@fluentui/react-components";
import { Profile, useConsentFlow } from "@open-source-consent/ui";
import type { ProfileData, ConsentFlowFormData } from "@open-source-consent/ui";
import type { PolicyScope } from "@open-source-consent/types";

const useStyles = makeStyles({
  root: {
    padding: "24px",
    margin: "16px",
    "@media (max-width: 768px)": {
      padding: "24px",
    },
  },
});

const sampleProfileData: ProfileData = {
  id: "user123",
  name: "Billy Bob [Demo]. Create new profile from 'Get Started'",
  email: "billy@example.com",
  role: {
    id: "self",
    label: "Myself",
  },
  consents: [
    {
      id: "consent1",
      policy: {
        id: "policy1",
        label: "Data Collection Policy",
      },
      status: {
        id: "granted",
        label: "Scopes Allowed",
      },
      scopes: [
        { id: "basic_info", label: "Basic Information" },
        { id: "preferences", label: "User Preferences" },
      ],
    },
  ],
};

export function ProfilePage(): JSX.Element {
  const location = useLocation();
  const styles = useStyles();
  const { policy } = useConsentFlow("sample-group-1");

  const formData: ConsentFlowFormData = location.state?.formData;

  const getConsentScopes = (
    type: "allowed" | "revoked" /* TODO: Reuse ConsentStatus */,
    grantedScopes: string[]
  ): ProfileData["consents"] => {
    const common = {
      policy: {
        id: policy?.id ?? "sample-group-1",
        label: policy?.title ?? "Open Source Consent Policy",
      },
    };
    let result: ProfileData["consents"][number] = {
      id: "",
      policy: common.policy,
      status: { id: "", label: "" },
      scopes: [],
    };

    if (type === "allowed") {
      result = {
        id: "consent1",
        ...common,
        status: {
          id: "granted",
          label: "Scopes Allowed",
        },
        scopes: grantedScopes.map((scopeId: string) => {
          const scope = policy?.availableScopes.find(
            (s: PolicyScope) => s.key === scopeId
          );
          return {
            id: scopeId,
            label: scope ? `${scope.name} (${scope.description})` : scopeId,
          };
        }),
      };
    }

    if (type === "revoked") {
      result = {
        id: "consent2",
        ...common,
        status: {
          id: "revoked",
          label: "Scopes Revoked",
        },
        scopes: (policy?.availableScopes ?? [])
          .filter((scope: PolicyScope) => !grantedScopes?.includes(scope.key))
          .map((scope: PolicyScope) => ({
            id: scope.key,
            label: `${scope.name} (${scope.description})`,
          })),
      };
    }

    return [result];
  };

  // Create profile data from formData
  const profileData: ProfileData = !formData
    ? sampleProfileData
    : {
        id: "user123", // TODO: Get from API
        name: formData?.name,
        email: "email@example.com",
        role: {
          id: formData?.roleId,
          label: formData?.isProxy
            ? "Parent / Guardian / Representative"
            : "Myself", // TODO: Get label from API
        },
        managedSubjects: formData?.managedSubjects.map((subject) => {
          let ageGroupLabel =
            subject.ageRangeId === "under13"
              ? "Child"
              : subject.ageRangeId === "13-17"
                ? "Teen"
                : "Adult"; // TODO: Get label from API

          if (subject.age === undefined) ageGroupLabel = "N/A";
          else if (subject.age < 1)
            ageGroupLabel = `${ageGroupLabel} (less than 1 year old)`;
          else if (subject.age === 1)
            ageGroupLabel = `${ageGroupLabel} (1 year old)`;
          else ageGroupLabel = `${ageGroupLabel} (${subject.age} years old)`;

          return {
            id: subject.id,
            name: subject.name,
            relationship: "Unknown",
            ageGroup: {
              id: subject.ageRangeId,
              label: ageGroupLabel,
            },
            consents: [
              ...getConsentScopes("allowed", subject?.grantedScopes ?? []),
              ...getConsentScopes("revoked", subject?.grantedScopes ?? []),
            ],
          };
        }),
        consents: formData
          ? [
              ...getConsentScopes("allowed", formData?.grantedScopes ?? []),
              ...getConsentScopes("revoked", formData?.grantedScopes ?? []),
            ]
          : [],
      };

  const handleProfileUpdate = (
    profileId: string,
    updates: Partial<ProfileData>
  ): void => {
    console.info("handleProfileUpdate", { profileId, updates });
  };

  const handleManagedSubjectSelect = (profileId: string): void => {
    console.info("handleManagedSubjectSelect", profileId);
  };

  return (
    <Card className={styles.root}>
      <Text as="h1" size={600} weight="semibold" underline>
        Profile
      </Text>

      <Profile
        profileData={profileData}
        isManagingSubjects={profileData.role.id === "proxy"}
        onProfileUpdate={handleProfileUpdate}
        onManagedSubjectSelect={handleManagedSubjectSelect}
      />
    </Card>
  );
}
