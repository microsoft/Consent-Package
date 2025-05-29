// @ts-nocheck
import { Card, Text, makeStyles } from '@fluentui/react-components';
import {
  AgeSelect,
  Profile,
  RoleSelect,
  Signature,
  type ProfileData,
} from '@open-source-consent/ui';

const useStyles = makeStyles({
  root: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      padding: '24px',
    },
  },
});

const consents = [
  {
    id: 'consent1',
    policy: {
      id: 'policy1',
      label: 'Policy 1',
    },
    status: {
      id: 'granted',
      label: 'Scopes Allowed',
    },
    scopes: [
      { id: 'basic_info', label: 'Basic Info', required: true },
      { id: 'medical_history', label: 'Medical History', required: false },
      { id: 'genetic_data', label: 'Genetic Data', required: false },
      { id: 'nutrition_data', label: 'Nutrition Data', required: false },
    ],
  },
  {
    id: 'consent2',
    policy: {
      id: 'policy1',
      label: 'Policy 1',
    },
    status: {
      id: 'revoked',
      label: 'Scopes Revoked',
    },
    scopes: [
      { id: 'location_data', label: 'Location Data', required: false },
      { id: 'camera_usage', label: 'Camera Usage', required: false },
    ],
  },
  {
    id: 'consent3',
    policy: {
      id: 'policy2',
      label: 'Policy 2',
    },
    status: {
      id: 'granted',
      label: 'Scopes Allowed',
    },
    scopes: [
      { id: 'usage_analytics', label: 'Usage Analytics Info', required: true },
      {
        id: 'performance_metrics',
        label: 'Performance Metrics',
        required: true,
      },
      { id: 'activity_log', label: 'Activity Log', required: false },
    ],
  },
];

const proxySampleProfileData: ProfileData = {
  id: 'user123',
  name: 'Proxy Smith',
  email: 'proxy.smith@example.com',
  role: {
    id: 'proxy',
    label: 'Parent / Guardian / Representative',
  },
  managedSubjects: [
    {
      id: 'child1',
      name: 'Emma Smith',
      relationship: 'Daughter',
      ageGroup: {
        id: 'under13',
        label: 'Child',
      },
      consents,
    },
    {
      id: 'child2',
      name: 'Michael Smith',
      relationship: 'Nephew',
      ageGroup: {
        id: '13-17',
        label: 'Teen',
      },
    },
  ],
  consents,
};

const selfSampleProfileData: ProfileData = {
  id: 'user123',
  name: 'Self Smith',
  email: 'self.smith@example.com',
  role: {
    id: 'self',
    label: 'Myself',
  },
  consents,
};

const defaultRoles = [
  {
    id: 'self',
    label: 'Self',
    description: 'I am providing consent for myself',
  },
  {
    id: 'proxy',
    label: 'Parent / Guardian / Representative',
    description: 'I am providing consent on behalf of someone else',
  },
];

export function ComponentsPlayground(): JSX.Element {
  const styles = useStyles();

  return (
    <Card className={styles.root}>
      <Text as="h1" size={600} weight="semibold" underline>
        Components Playground
      </Text>

      <Text size={400}>
        The Playground provides examples of how the components in the Consent
        Package can be used. New components and current component updates can be
        viewed here.
      </Text>

      <br />
      <Text size={400}>
        RoleSelect with default roles -- returns the role id
      </Text>
      <RoleSelect
        roles={defaultRoles}
        onSubmit={(roleId: string) => console.info(roleId)}
      />

      <br />
      <br />
      <Text size={400}>
        AgeSelect (using a date picker) -- returns the age range id, DOB and age
      </Text>
      <AgeSelect
        useDatePicker
        onSubmit={(ageRangeId: string, dob?: Date, age?: number) =>
          console.info(ageRangeId, dob, age)
        }
      />

      <br />
      <br />
      <Text size={400}>
        AgeSelect (of possible ranges) -- returns the age range id
      </Text>
      <AgeSelect onSubmit={(ageRangeId: string) => console.info(ageRangeId)} />

      <br />
      <br />
      <Text size={400}>Signature (digital) -- returns the text and date</Text>
      <Signature
        onSignatureSubmit={(signature: string, date: Date) =>
          console.info(signature, date)
        }
      />

      <br />
      <br />
      <Text size={400}>
        Signature (drawn) -- returns the signature as a base64 string which can
        be parsed into an image and date
      </Text>
      <Signature
        isDrawnSignature
        onSignatureSubmit={(signature: string, date: Date) =>
          console.info(signature, date)
        }
      />

      <br />
      <br />
      <Text size={400}>Profile (Proxy)</Text>
      <Profile
        profileData={proxySampleProfileData}
        isManagingSubjects={proxySampleProfileData.role.id === 'proxy'}
        onProfileUpdate={(profileId: string, updates: Partial<ProfileData>) =>
          console.info('profile update', { profileId, updates })
        }
        onManagedSubjectSelect={(profileId: string) =>
          console.info('selected managed profile', profileId)
        }
      />

      <br />
      <br />
      <Text size={400}>Profile (Self-consenting)</Text>
      <Profile
        profileData={selfSampleProfileData}
        isManagingSubjects={selfSampleProfileData.role.id === 'proxy'}
        onProfileUpdate={(profileId: string, updates: Partial<ProfileData>) =>
          console.info('profile update', { profileId, updates })
        }
        onManagedSubjectSelect={(profileId: string) =>
          console.info('selected managed profile', profileId)
        }
      />
    </Card>
  );
}
