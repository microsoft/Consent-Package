import type { ProfileData } from '@open-source-consent/ui';

export const defaultMockUser: ProfileData = {
  id: 'mock-user-123',
  name: 'Mock User',
  email: 'mock.user@example.com',
  role: {
    id: 'self',
    label: 'Myself',
  },
  consents: [
    {
      version: 1,
      subjectId: 'mock-user-123',
      consentedAt: new Date('2025-05-20T00:00:00Z'),
      consenter: {
        type: 'self',
        userId: 'mock-user-123',
      },
      metadata: {
        consentMethod: 'digital_form',
      },
      createdAt: new Date('2025-05-20T00:00:00Z'),
      updatedAt: new Date('2025-05-20T00:00:00Z'),
      id: 'mock-consent-1',
      policyId: 'sample-group-1',
      status: 'granted',
      grantedScopes: {
        basic_profile: {
          grantedAt: new Date('2025-05-20T00:00:00Z'),
        },
      },
    },
  ],
  managedSubjects: [],
};
