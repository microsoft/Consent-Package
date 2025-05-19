// @ts-nocheck
import { Card, Text, makeStyles } from '@fluentui/react-components';
import { AgeSelect, Profile, RoleSelect, Signature, type ProfileData } from "@open-source-consent/ui";

const useStyles = makeStyles({
  root: {
    padding: "24px",
    margin: "16px",
    "@media (max-width: 768px)": {
      padding: "24px",
    },
  }
});

const consents = [
  {
    id: 'consent1',
    policy: {
      id: 'policy1',
      label: 'Policy 1'
    },
    status: {
      id: 'granted',
      label: 'Scopes Allowed'
    },
    scopes: [
      { id: 'basic_info', label: 'Basic Info' },
      { id: 'medical_history', label: 'Medical History' },
      { id: 'genetic_data', label: 'Genetic Data' },
      { id: 'nutrition_data', label: 'Nutrition Data' }
    ]
  },
  {
    id: 'consent2',
    policy: {
      id: 'policy1',
      label: 'Policy 1'
    },
    status: {
      id: 'revoked',
      label: 'Scopes Revoked'
    },
    scopes: [
      { id: 'location_data', label: 'Location Data' },
      { id: 'camera_usage', label: 'Camera Usage' }
    ]
  },
  {
    id: 'consent3',
    policy: {
      id: 'policy2',
      label: 'Policy 2'
    },
    status: {
      id: 'granted',
      label: 'Scopes Allowed'
    },
    scopes: [
      { id: 'usage_analytics', label: 'Usage Analytics Info' },
      { id: 'performance_metrics', label: 'Performance Metrics' },
      { id: 'activity_log', label: 'Activity Log' }
    ]
  }
];

const proxySampleProfileData: ProfileData = {
  id: 'user123',
  name: 'Proxy Smith',
  email: 'proxy.smith@example.com',
  role: {
    id: 'proxy',
    label: 'Parent / Guardian / Representative'
  },
  managedSubjects: [
    {
      id: 'child1',
      name: 'Emma Smith',
      relationship: 'Daughter',
      ageGroup: {
        id: 'under13',
        label: 'Child'
      }
    },
    {
      id: 'child2',
      name: 'Michael Smith',
      relationship: 'Nephew',
      ageGroup: {
        id: '13-17',
        label: 'Teen'
      }
    }
  ],
  consents
};

const selfSampleProfileData: ProfileData = {
  id: 'user123',
  name: 'Self Smith',
  email: 'self.smith@example.com',
  role: {
    id: 'self',
    label: 'Myself'
  },
  consents
};

const defaultRoles = [
  {
    id: 'self',
    label: 'Self',
    description: 'I am providing consent for myself'
  },
  {
    id: 'proxy',
    label: 'Parent / Guardian / Representative',
    description: 'I am providing consent on behalf of someone else'
  }
];

export function ComponentsPlayground(): JSX.Element {
  const styles = useStyles();

  return (
    <Card className={styles.root}>
      <Text as="h1" size={600} weight="semibold" underline>
        Components Playground
      </Text>

      <RoleSelect 
        roles={defaultRoles}
        onSubmit={(roleId: string) => console.info(roleId)} 
      />
      <AgeSelect useDatePicker onSubmit={(ageRangeId: string) => console.info(ageRangeId)} />
      <AgeSelect onSubmit={(ageRangeId: string) => console.info(ageRangeId)} />
      <Signature onSignatureSubmit={(signature: string, date: Date) => console.info(signature, date)} />
      <Signature isDrawnSignature onSignatureSubmit={(signature: string, date: Date) => console.info(signature, date)} />
      <Profile
        profileData={proxySampleProfileData}
        isManagingSubjects={proxySampleProfileData.role.id === 'proxy'}
        onProfileUpdate={(profileId: string, updates: Partial<ProfileData>) => console.info('profile update', { profileId, updates })}
        onManagedSubjectSelect={(profileId: string) => console.info('selected managed profile', profileId)}
      />
      <Profile
        profileData={selfSampleProfileData}
        isManagingSubjects={selfSampleProfileData.role.id === 'proxy'}
        onProfileUpdate={(profileId: string, updates: Partial<ProfileData>) => console.info('profile update', { profileId, updates })}
        onManagedSubjectSelect={(profileId: string) => console.info('selected managed profile', profileId)}
      />
    </Card>
  );
} 
