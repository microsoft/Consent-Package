import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsentService } from '../services/ConsentService.js';
import type {
  IConsentDataAdapter,
  IDataAdapter,
  Policy,
  ConsentRecord,
  CreateConsentInput,
} from '@open-source-consent/types';

describe('ConsentService', () => {
  let mockDataAdapter: IConsentDataAdapter;
  let consentService: ConsentService;

  const mockDate = new Date('2025-01-01T00:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const fullMockAdapter = {
      createConsent: vi.fn(),
      updateConsentStatus: vi.fn(),
      findConsentById: vi.fn(),
      findConsentsBySubject: vi.fn(),
      findLatestConsentBySubjectAndPolicy: vi.fn(),
      findAllConsentVersionsBySubjectAndPolicy: vi.fn(),
      getAllConsents: vi.fn(),
      createPolicy: vi.fn(),
      updatePolicyStatus: vi.fn(),
      findPolicyById: vi.fn(),
      findLatestActivePolicyByGroupId: vi.fn(),
      findAllPolicyVersionsByGroupId: vi.fn(),
      listPolicies: vi.fn(),
      getConsentsByProxyId: vi.fn(),
    };

    mockDataAdapter = fullMockAdapter as IConsentDataAdapter;

    consentService = ConsentService.getInstance(mockDataAdapter);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('grantConsent', () => {
    it('should create a new consent record with granted status when no prior consent exists', async () => {
      // Arrange
      const mockConsentInput: CreateConsentInput = {
        subjectId: 'user123',
        policyId: 'policy456',
        dateOfBirth: new Date('1990-01-01'),
        consenter: {
          type: 'self',
          userId: 'user123',
        },
        grantedScopes: ['email', 'profile'],
        revokedScopes: ['notifications'],
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const mockPolicy: Policy = {
        id: 'policy456',
        policyGroupId: 'group1',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2025-01-01'),
        title: 'Test Policy',
        contentSections: [
          {
            title: 'section1',
            content: 'content1',
            description: 'Section 1 Description',
          },
        ],
        availableScopes: [
          { key: 'email', name: 'Email', description: 'Access to email' },
          { key: 'profile', name: 'Profile', description: 'Access to profile' },
          {
            key: 'notifications',
            name: 'Notifications',
            description: 'Access to notifications',
          }, // Another scope not granted
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const mockCreatedConsent: ConsentRecord = {
        id: 'consent789',
        version: 1,
        subjectId: 'user123',
        policyId: 'policy456',
        status: 'granted',
        consentedAt: mockDate,
        dateOfBirth: mockConsentInput.dateOfBirth,
        consenter: {
          type: 'self',
          userId: 'user123',
        },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            required: false,
            grantedAt: mockDate,
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            required: false,
            grantedAt: mockDate,
          },
        },
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createConsent as any).mockResolvedValue(
        mockCreatedConsent,
      );
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null); // No existing consent
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicy);

      // Act
      const result = await consentService.grantConsent(mockConsentInput);

      // Assert
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: 'user123',
        policyId: 'policy456',
        status: 'granted',
        version: 1,
        consentedAt: mockDate,
        dateOfBirth: mockConsentInput.dateOfBirth,
        consenter: {
          type: 'self',
          userId: 'user123',
        },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: mockDate,
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            grantedAt: mockDate,
          },
        },
        revokedScopes: {
          notifications: {
            key: 'notifications',
            name: 'Notifications',
            description: 'Access to notifications',
            revokedAt: mockDate,
          },
        },
        revokedAt: undefined,
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(result).toEqual(mockCreatedConsent);
    });

    it('should supersede an existing active consent and create a new version', async () => {
      // Arrange
      const subjectId = 'user-supersede';
      const policyId = 'policy-supersede';
      const oldConsentVersion = 1;

      const mockPolicySupersede: Policy = {
        id: policyId,
        policyGroupId: 'groupSupersede',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2024-12-01'),
        title: 'Supersede Policy',
        contentSections: [{ title: 's1', content: 'c1', description: 'd1' }],
        availableScopes: [
          { key: 'email', name: 'Email', description: 'Access to email' },
          { key: 'profile', name: 'Profile', description: 'Access to profile' },
          {
            key: 'offline_access',
            name: 'Offline',
            description: 'Offline access',
          },
        ],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
      };

      const existingConsent: ConsentRecord = {
        id: 'oldConsent123',
        subjectId,
        policyId,
        version: oldConsentVersion,
        status: 'granted',
        consentedAt: new Date('2024-12-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
      };

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email', 'profile'],
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '192.168.1.1',
        },
      };

      const newVersionConsent: ConsentRecord = {
        id: 'newConsent456',
        subjectId,
        policyId,
        version: oldConsentVersion + 1,
        status: 'granted',
        consentedAt: existingConsent.consentedAt,
        consenter: grantInput.consenter,
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: mockDate,
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            grantedAt: mockDate,
          },
        },
        revokedScopes: {
          offline_access: {
            key: 'offline_access',
            name: 'Offline',
            description: 'Offline access',
            revokedAt: mockDate,
          },
        },
        revokedAt: undefined,
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '192.168.1.1',
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(existingConsent);
      (mockDataAdapter.findConsentById as any).mockResolvedValue(
        existingConsent,
      );
      (mockDataAdapter.createConsent as any).mockResolvedValue(
        newVersionConsent,
      );
      (mockDataAdapter.updateConsentStatus as any).mockResolvedValue({
        ...existingConsent,
        status: 'superseded',
      });
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicySupersede);

      // Act
      const result = await consentService.grantConsent(grantInput);

      // Assert
      expect(
        mockDataAdapter.findLatestConsentBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        existingConsent.id,
      );
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: existingConsent.subjectId,
        policyId: existingConsent.policyId,
        version: oldConsentVersion + 1,
        status: 'granted',
        consentedAt: existingConsent.consentedAt,
        consenter: grantInput.consenter,
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: mockDate,
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            grantedAt: mockDate,
          },
        },
        revokedScopes: {
          offline_access: {
            key: 'offline_access',
            name: 'Offline',
            description: 'Offline access',
            revokedAt: mockDate,
          },
        },
        revokedAt: undefined,
        metadata: {
          consentMethod: 'digital_form',
          ipAddress: '192.168.1.1',
        },
      });
      expect(mockDataAdapter.updateConsentStatus).toHaveBeenCalledWith(
        existingConsent.id,
        'superseded',
        oldConsentVersion,
      );
      expect(result).toEqual(newVersionConsent);
    });

    it("should throw an error if trying to grant consent when the latest is 'revoked'", async () => {
      // Arrange
      const subjectId = 'user-revoked';
      const policyId = 'policy-revoked';

      // Mock policy for the test
      const mockPolicy: Policy = {
        id: policyId,
        policyGroupId: 'groupRevoked',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2024-11-01'),
        title: 'Revoked Test Policy',
        contentSections: [{ title: 's1', content: 'c1', description: 'd1' }],
        availableScopes: [
          { key: 'email', name: 'Email', description: 'Access to email' },
        ],
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01'),
      };

      const revokedConsent: ConsentRecord = {
        id: 'revokedConsent123',
        subjectId,
        policyId,
        version: 1,
        status: 'revoked', // Key condition
        consentedAt: new Date('2024-11-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: new Date('2024-11-01T00:00:00Z'),
          },
        },
        revokedAt: new Date('2024-11-15T00:00:00Z'),
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-11-01T00:00:00Z'),
        updatedAt: new Date('2024-11-15T00:00:00Z'),
      };

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email'],
        metadata: { consentMethod: 'digital_form' },
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(revokedConsent);

      // Mock the policy adapter
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicy);

      // Act & Assert
      await expect(
        consentService.grantConsent(grantInput),
      ).rejects.toThrowError(
        `Consent record ${revokedConsent.id} for subject ${subjectId} and policy ${policyId} is revoked and cannot be granted again.`,
      );
      expect(mockDataAdapter.createConsent).not.toHaveBeenCalled();
      expect(mockDataAdapter.updateConsentStatus).not.toHaveBeenCalled();
    });

    it("should throw an error if trying to grant consent when the latest is 'superseded'", async () => {
      // Arrange
      const subjectId = 'user-superseded-latest';
      const policyId = 'policy-superseded-latest';

      // Mock policy for the test
      const mockPolicy: Policy = {
        id: policyId,
        policyGroupId: 'groupSuperseded',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2024-10-01'),
        title: 'Superseded Test Policy',
        contentSections: [{ title: 's1', content: 'c1', description: 'd1' }],
        availableScopes: [
          { key: 'email', name: 'Email', description: 'Access to email' },
        ],
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-01'),
      };

      const supersededConsent: ConsentRecord = {
        id: 'supersededConsent456',
        subjectId,
        policyId,
        version: 1,
        status: 'superseded', // Key condition
        consentedAt: new Date('2024-10-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: new Date('2024-10-01T00:00:00Z'),
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-10-01T00:00:00Z'),
        updatedAt: new Date('2024-10-01T00:00:00Z'), // Date it was superseded
      };

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email'],
        metadata: { consentMethod: 'digital_form' },
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(supersededConsent);

      // Mock the policy adapter
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicy);

      // Act & Assert
      await expect(
        consentService.grantConsent(grantInput),
      ).rejects.toThrowError(
        `Consent record ${supersededConsent.id} for subject ${subjectId} and policy ${policyId} is superseded. The latest active should never be superseded, investigate issues with the DB.`,
      );
      expect(mockDataAdapter.createConsent).not.toHaveBeenCalled();
      expect(mockDataAdapter.updateConsentStatus).not.toHaveBeenCalled();
    });

    it('should handle proxy consent correctly when no prior consent exists', async () => {
      // Arrange
      const mockProxyConsentInput = {
        subjectId: 'child123',
        policyId: 'policy456',
        consenter: {
          type: 'proxy' as const,
          userId: 'parent456',
          proxyDetails: {
            relationship: 'parent',
            subjectAgeGroup: 'under13' as const,
          },
        },
        grantedScopes: ['app_usage'],
        metadata: {
          consentMethod: 'digital_form' as const,
        },
      };

      const mockPolicyForProxy: Policy = {
        id: 'policy456',
        policyGroupId: 'groupProxy',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2025-01-01'),
        title: 'Proxy Test Policy',
        contentSections: [
          { title: 's_proxy', content: 'c_proxy', description: 'd_proxy' },
        ],
        availableScopes: [
          {
            key: 'app_usage',
            name: 'App Usage',
            description: 'Tracks app usage',
          },
          {
            key: 'location',
            name: 'Location',
            description: 'Access to location',
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const mockCreatedConsent: ConsentRecord = {
        id: 'consent789',
        version: 1,
        subjectId: 'child123',
        policyId: 'policy456',
        status: 'granted',
        consentedAt: mockDate,
        consenter: {
          type: 'proxy',
          userId: 'parent456',
          proxyDetails: {
            relationship: 'parent',
            subjectAgeGroup: 'under13',
          },
        },
        grantedScopes: {
          app_usage: {
            key: 'app_usage',
            name: 'App Usage',
            description: 'Tracks app usage',
            grantedAt: mockDate,
          },
        },
        metadata: {
          consentMethod: 'digital_form',
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createConsent as any).mockResolvedValue(
        mockCreatedConsent,
      );
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null); // No existing consent
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicyForProxy);

      // Act
      const result = await consentService.grantConsent(mockProxyConsentInput);

      // Assert
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: 'child123',
        policyId: 'policy456',
        status: 'granted',
        version: 1,
        consentedAt: mockDate,
        consenter: {
          type: 'proxy',
          userId: 'parent456',
          proxyDetails: {
            relationship: 'parent',
            subjectAgeGroup: 'under13',
          },
        },
        grantedScopes: {
          app_usage: {
            key: 'app_usage',
            name: 'App Usage',
            description: 'Tracks app usage',
            grantedAt: mockDate,
          },
        },
        revokedScopes: {
          location: {
            key: 'location',
            name: 'Location',
            description: 'Access to location',
            revokedAt: mockDate,
          },
        },
        revokedAt: undefined,
        metadata: {
          consentMethod: 'digital_form',
        },
      });

      expect(result).toEqual(mockCreatedConsent);
    });

    it('should throw an optimistic concurrency error if consent version changes during grant (supersede)', async () => {
      // Arrange
      const subjectId = 'user-optimistic-lock';
      const policyId = 'policy-optimistic-lock';
      const oldConsentVersion = 1;
      const actualDbVersion = 2; // Simulate version changed in DB

      const mockOptimisticPolicy: Policy = {
        id: policyId,
        policyGroupId: 'groupOptLock',
        version: 1,
        status: 'active',
        effectiveDate: new Date('2024-12-01'),
        title: 'Optimistic Lock Policy',
        contentSections: [
          { title: 's_opt', content: 'c_opt', description: 'd_opt' },
        ],
        availableScopes: [
          { key: 'email', name: 'Email', description: 'Access to email' },
          { key: 'profile', name: 'Profile', description: 'Access to profile' },
        ],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
      };

      const existingConsent: ConsentRecord = {
        id: 'oldConsentOptimistic123',
        subjectId,
        policyId,
        version: oldConsentVersion, // This is what grantConsent initially fetches/expects
        status: 'granted',
        consentedAt: new Date('2024-12-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
      };

      // This is what supersedeConsent's internal findConsentById will find
      const consentInDbActuallyHasVersion2: ConsentRecord = {
        ...existingConsent,
        version: actualDbVersion,
      };

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email', 'profile'],
        metadata: { consentMethod: 'digital_form' },
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(
        existingConsent, // grantConsent initially sees version 1
      );
      // supersedeConsent will call findConsentById, make it return the changed version
      (mockDataAdapter.findConsentById as any).mockResolvedValue(
        consentInDbActuallyHasVersion2,
      );
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockOptimisticPolicy);

      // Act & Assert
      // The supersedeConsent method is called with expectedOldVersion = existingConsent.version (which is 1)
      // but it finds a record with version 2, triggering the error.
      await expect(
        consentService.grantConsent(grantInput),
      ).rejects.toThrowError(
        `Optimistic concurrency check failed for consent ${existingConsent.id}. Expected version ${oldConsentVersion}, found ${actualDbVersion}.`,
      );

      expect(
        mockDataAdapter.findLatestConsentBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        existingConsent.id,
      );
      expect(mockDataAdapter.createConsent).not.toHaveBeenCalled();
      expect(mockDataAdapter.updateConsentStatus).not.toHaveBeenCalled();
    });
  });

  describe('grantConsent scenarios for required scope revocation', () => {
    const subjectId = 'user-req-test';
    const policyId = 'policy-req-test';
    const mockPolicyReq: Policy = {
      id: policyId,
      policyGroupId: 'groupReqTest',
      version: 1,
      status: 'active',
      effectiveDate: new Date('2025-01-01'),
      title: 'Required Scope Test Policy',
      contentSections: [{ title: 's1', content: 'c1', description: 'd1' }],
      availableScopes: [
        {
          key: 'email',
          name: 'Email',
          description: 'Access to email',
          required: true,
        },
        {
          key: 'profile',
          name: 'Profile',
          description: 'Access to profile',
          required: false,
        },
        {
          key: 'notifications',
          name: 'Notifications',
          description: 'Access to notifications',
          required: false,
        },
        {
          key: 'offline_access',
          name: 'Offline Access',
          description: 'Offline access',
          required: true,
        },
      ],
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    beforeEach(() => {
      // Ensure findPolicyById is mocked for these specific tests
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockPolicyReq);
    });

    it('UPDATE: should revoke all scopes and set status to "revoked" if a required scope is revoked', async () => {
      const existingConsent: ConsentRecord = {
        id: 'existingConsentWithReq',
        subjectId,
        policyId,
        version: 1,
        status: 'granted',
        consentedAt: new Date('2024-12-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            required: true,
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            required: false,
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(existingConsent);
      (mockDataAdapter.findConsentById as any).mockResolvedValue(
        existingConsent,
      ); // For supersedeConsent internal call
      const newVersionId = 'newVersionRevokedAll';
      (mockDataAdapter.createConsent as any).mockImplementation(
        async (data: any) => ({
          ...data,
          id: newVersionId,
          version: existingConsent.version + 1,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      );

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['profile'], // Attempting to keep 'profile'
        revokedScopes: ['email'], // Revoking the required 'email' scope
        metadata: { consentMethod: 'digital_form', ipAddress: '1.2.3.4' },
      };

      const result = await consentService.grantConsent(grantInput);

      expect(result.status).toBe('revoked');
      expect(result.grantedScopes).toEqual({});
      expect(result.revokedScopes).toHaveProperty('email');
      expect(result.revokedScopes?.['email'].revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('profile');
      expect(result.revokedScopes?.['profile'].revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('notifications');
      expect(result.revokedScopes?.['notifications'].revokedAt).toEqual(
        mockDate,
      );
      expect(result.revokedScopes).toHaveProperty('offline_access');
      expect(result.revokedScopes?.['offline_access'].revokedAt).toEqual(
        mockDate,
      );
      expect(result.revokedAt).toEqual(mockDate);

      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revoked',
          grantedScopes: {},
          revokedScopes: expect.objectContaining({
            email: expect.objectContaining({ revokedAt: mockDate }),
            profile: expect.objectContaining({ revokedAt: mockDate }),
            notifications: expect.objectContaining({ revokedAt: mockDate }),
            offline_access: expect.objectContaining({ revokedAt: mockDate }),
          }),
          revokedAt: mockDate,
        }),
      );
      expect(mockDataAdapter.updateConsentStatus).toHaveBeenCalledWith(
        existingConsent.id,
        'superseded',
        existingConsent.version,
      );
    });

    it('UPDATE: should NOT revoke all if a non-required scope is revoked and a required scope remains granted', async () => {
      const existingConsent: ConsentRecord = {
        id: 'existingConsentWithReqNonReq',
        subjectId,
        policyId,
        version: 1,
        status: 'granted',
        consentedAt: new Date('2024-12-01T00:00:00Z'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            required: true,
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
          profile: {
            key: 'profile',
            name: 'Profile',
            description: 'Access to profile',
            required: false,
            grantedAt: new Date('2024-12-01T00:00:00Z'),
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
      };

      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(existingConsent);
      (mockDataAdapter.findConsentById as any).mockResolvedValue(
        existingConsent,
      );
      const newVersionId = 'newVersionNonReqRevoked';
      (mockDataAdapter.createConsent as any).mockImplementation(
        async (data: any) => ({
          ...data,
          id: newVersionId,
          version: existingConsent.version + 1,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      );

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email'], // Keeping required 'email'
        revokedScopes: ['profile'], // Revoking non-required 'profile'
        metadata: { consentMethod: 'digital_form', ipAddress: '1.2.3.5' },
      };

      const result = await consentService.grantConsent(grantInput);

      expect(result.status).toBe('granted');
      expect(result.grantedScopes).toHaveProperty('email');
      expect(result.grantedScopes?.['email'].grantedAt).toEqual(mockDate); // GrantedAt is updated to operationTimestamp
      expect(result.revokedScopes).toHaveProperty('profile');
      expect(result.revokedScopes?.['profile'].revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('notifications'); // Was not granted, so should be in revoked
      expect(result.revokedScopes).toHaveProperty('offline_access'); // Was not granted, so should be in revoked
      expect(result.revokedAt).toBeUndefined();

      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'granted',
          grantedScopes: expect.objectContaining({
            email: expect.objectContaining({ grantedAt: mockDate }),
          }),
          revokedScopes: expect.objectContaining({
            profile: expect.objectContaining({ revokedAt: mockDate }),
            notifications: expect.objectContaining({ revokedAt: mockDate }),
            offline_access: expect.objectContaining({ revokedAt: mockDate }),
          }),
          revokedAt: undefined,
        }),
      );
    });

    it('CREATE: should revoke all and set status to "revoked" if a required scope is in revokedScopes and no scopes are granted', async () => {
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null); // No existing consent
      const createdConsentId = 'createdRevokedAll';
      (mockDataAdapter.createConsent as any).mockImplementation(
        async (data: any) => ({
          ...data,
          id: createdConsentId,
          version: 1,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      );

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: [], // No scopes granted
        revokedScopes: ['email'], // Revoking required 'email'
        metadata: { consentMethod: 'digital_form', ipAddress: '1.2.3.6' },
      };

      const result = await consentService.grantConsent(grantInput);

      expect(result.status).toBe('revoked');
      expect(result.grantedScopes).toEqual({});
      expect(result.revokedScopes).toHaveProperty('email');
      expect(result.revokedScopes?.['email'].revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('profile');
      expect(result.revokedScopes?.['profile'].revokedAt).toEqual(mockDate);
      // All available scopes should be in revokedScopes
      expect(Object.keys(result.revokedScopes || {}).length).toBe(
        mockPolicyReq.availableScopes.length,
      );
      mockPolicyReq.availableScopes.forEach((scope) => {
        expect(result.revokedScopes).toHaveProperty(scope.key);
        expect(result.revokedScopes?.[scope.key]?.revokedAt).toEqual(mockDate);
      });
      expect(result.revokedAt).toEqual(mockDate);

      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revoked',
          grantedScopes: {},
          revokedScopes: expect.objectContaining({
            email: expect.objectContaining({ revokedAt: mockDate }),
            profile: expect.objectContaining({ revokedAt: mockDate }),
            notifications: expect.objectContaining({ revokedAt: mockDate }),
            offline_access: expect.objectContaining({ revokedAt: mockDate }),
          }),
          revokedAt: mockDate,
        }),
      );
    });

    it('CREATE: should revoke all if attempting to grant some scopes while a required scope is revoked', async () => {
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null);
      const createdConsentId = 'createdReqGrantedAnotherReqRevokedToFullRevoke';
      (mockDataAdapter.createConsent as any).mockImplementation(
        async (data: any) => ({
          ...data,
          id: createdConsentId,
          version: 1,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      );

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email'], // Attempting to grant required 'email'
        revokedScopes: ['offline_access'], // Revoking required 'offline_access'
        metadata: { consentMethod: 'digital_form', ipAddress: '1.2.3.8' },
      };

      // NEW EXPECTATION: With the updated logic, if any required scope (offline_access)
      // is in input.revokedScopes during an initial consent creation, all scopes are revoked.
      const result = await consentService.grantConsent(grantInput);

      expect(result.status).toBe('revoked');
      expect(result.grantedScopes).toEqual({}); // No scopes should be granted
      // All available scopes from the policy should be in revokedScopes
      expect(result.revokedScopes).toHaveProperty('email');
      expect(result.revokedScopes?.['email']?.revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('profile');
      expect(result.revokedScopes?.['profile']?.revokedAt).toEqual(mockDate);
      expect(result.revokedScopes).toHaveProperty('notifications');
      expect(result.revokedScopes?.['notifications']?.revokedAt).toEqual(
        mockDate,
      );
      expect(result.revokedScopes).toHaveProperty('offline_access');
      expect(result.revokedScopes?.['offline_access']?.revokedAt).toEqual(
        mockDate,
      );
      expect(result.revokedAt).toEqual(mockDate); // Overall record should be marked revoked at this time

      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revoked',
          grantedScopes: {},
          revokedScopes: expect.objectContaining({
            email: expect.objectContaining({ revokedAt: mockDate }),
            profile: expect.objectContaining({ revokedAt: mockDate }),
            notifications: expect.objectContaining({ revokedAt: mockDate }),
            offline_access: expect.objectContaining({ revokedAt: mockDate }),
          }),
          revokedAt: mockDate,
        }),
      );
    });

    it('CREATE: should revoke all if granting a required scope that is also explicitly in revokedScopes', async () => {
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null);
      const createdConsentId = 'createdReqGrantedAndRevoked';
      (mockDataAdapter.createConsent as any).mockImplementation(
        async (data: any) => ({
          ...data,
          id: createdConsentId,
          version: 1,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      );

      const grantInput: CreateConsentInput = {
        subjectId,
        policyId,
        consenter: { type: 'self' as const, userId: subjectId },
        grantedScopes: ['email'], // Granting required 'email'
        revokedScopes: ['email'], // Also revoking required 'email'
        metadata: { consentMethod: 'digital_form', ipAddress: '1.2.3.9' },
      };

      const result = await consentService.grantConsent(grantInput);
      expect(result.status).toBe('revoked');
      expect(result.grantedScopes).toEqual({});
      mockPolicyReq.availableScopes.forEach((scope) => {
        expect(result.revokedScopes).toHaveProperty(scope.key);
        expect(result.revokedScopes?.[scope.key]?.revokedAt).toEqual(mockDate);
      });
      expect(result.revokedAt).toEqual(mockDate);

      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revoked',
          grantedScopes: {},
          revokedScopes: expect.objectContaining({
            email: expect.objectContaining({ revokedAt: mockDate }),
            profile: expect.objectContaining({ revokedAt: mockDate }),
            // ... and others
          }),
          revokedAt: mockDate,
        }),
      );
    });
  });

  describe('getConsentDetails', () => {
    it('should retrieve consent details by id', async () => {
      // Arrange
      const mockConsent: ConsentRecord = {
        id: 'consent123',
        version: 1,
        subjectId: 'user123',
        policyId: 'policy456',
        status: 'granted',
        consentedAt: new Date('2024-12-15'),
        consenter: {
          type: 'self',
          userId: 'user123',
        },
        grantedScopes: {
          email: {
            key: 'email',
            name: 'Email',
            description: 'Access to email',
            required: false,
            grantedAt: new Date('2024-12-15'),
          },
        },
        metadata: {
          consentMethod: 'digital_form',
        },
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-15'),
      };

      (mockDataAdapter.findConsentById as any).mockResolvedValue(mockConsent);

      // Act
      const result = await consentService.getConsentDetails('consent123');

      // Assert
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        'consent123',
      );
      expect(result).toEqual(mockConsent);
    });

    it('should return null when consent not found', async () => {
      // Arrange
      (mockDataAdapter.findConsentById as any).mockResolvedValue(null);

      // Act
      const result = await consentService.getConsentDetails('nonexistent');

      // Assert
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        'nonexistent',
      );
      expect(result).toBeNull();
    });
  });

  describe('getSubjectConsentStatus', () => {
    it('should return consent status for each requested scope when no policyId is given', async () => {
      // Arrange
      const subjectId = 'user123';
      const mockConsents: ConsentRecord[] = [
        {
          id: 'consent123',
          version: 1,
          subjectId: 'user123',
          policyId: 'policy456',
          status: 'granted',
          consentedAt: new Date('2024-12-15'),
          consenter: {
            type: 'self',
            userId: 'user123',
          },
          grantedScopes: {
            email: {
              key: 'email',
              name: 'Email',
              description: 'Access to email',
              required: false,
              grantedAt: new Date('2024-12-15'),
            },
            profile: {
              key: 'profile',
              name: 'Profile',
              description: 'Access to profile',
              required: false,
              grantedAt: new Date('2024-12-15'),
            },
          },
          metadata: {
            consentMethod: 'digital_form',
          },
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date('2024-12-15'),
        },
        {
          id: 'consent456',
          version: 2,
          subjectId: 'user123',
          policyId: 'policy789',
          status: 'granted',
          consentedAt: new Date('2024-12-16'),
          consenter: {
            type: 'self',
            userId: 'user123',
          },
          grantedScopes: {
            location: {
              key: 'location',
              name: 'Location',
              description: 'Access to location',
              required: false,
              grantedAt: new Date('2024-12-16'),
            },
          },
          revokedScopes: {
            location: {
              key: 'location',
              name: 'Location',
              description: 'Access to location',
              required: false,
              revokedAt: new Date('2024-12-17'),
            },
          },
          metadata: {
            consentMethod: 'digital_form',
          },
          createdAt: new Date('2024-12-16'),
          updatedAt: new Date('2024-12-17'),
        },
      ];

      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue(
        mockConsents,
      );

      // Act
      const result = await consentService.getSubjectConsentStatus(subjectId, [
        'email',
        'profile',
        'location',
        'camera',
      ]);

      // Assert
      expect(mockDataAdapter.findConsentsBySubject).toHaveBeenCalledWith(
        'user123',
      );
      expect(result).toEqual({
        email: true,
        profile: true,
        location: false, // This scope is revoked
        camera: false, // This scope was never granted
      });
    });

    it('should return all false when subject has no consents and no policyId is given', async () => {
      // Arrange
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue([]);

      // Act
      const result = await consentService.getSubjectConsentStatus('user456', [
        'email',
        'profile',
      ]);

      // Assert
      expect(mockDataAdapter.findConsentsBySubject).toHaveBeenCalledWith(
        'user456',
      );
      expect(result).toEqual({
        email: false,
        profile: false,
      });
    });

    describe('when policyId is provided', () => {
      const subjectId = 'userWithPolicy';
      const policyId = 'specificPolicy123';
      const scopes = ['email', 'profile', 'offline_access'];

      it('should return all false if no consent record exists for the policy', async () => {
        (
          mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
        ).mockResolvedValue(null);
        const result = await consentService.getSubjectConsentStatus(
          subjectId,
          scopes,
          policyId,
        );
        expect(result).toEqual({
          email: false,
          profile: false,
          offline_access: false,
        });
        expect(
          mockDataAdapter.findLatestConsentBySubjectAndPolicy,
        ).toHaveBeenCalledWith(subjectId, policyId);
      });

      it("should return all false if latest consent for policy is not 'granted'", async () => {
        const revokedConsent: ConsentRecord = {
          id: 'c1',
          subjectId,
          policyId,
          version: 1,
          status: 'revoked',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: subjectId },
          grantedScopes: {
            email: {
              key: 'email',
              name: 'Email',
              description: 'Access to email',
              required: false,
              grantedAt: mockDate,
            },
          },
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        };
        (
          mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
        ).mockResolvedValue(revokedConsent);
        const result = await consentService.getSubjectConsentStatus(
          subjectId,
          scopes,
          policyId,
        );
        expect(result).toEqual({
          email: false,
          profile: false,
          offline_access: false,
        });
      });

      it("should return true for granted scopes and false for others if latest consent is 'granted'", async () => {
        const grantedConsent: ConsentRecord = {
          id: 'c2',
          subjectId,
          policyId,
          version: 1,
          status: 'granted',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: subjectId },
          grantedScopes: {
            email: {
              key: 'email',
              name: 'Email',
              description: 'Access to email',
              required: false,
              grantedAt: mockDate,
            },
            // profile is not granted
          },
          revokedScopes: {
            // offline_access was granted then revoked implicitly by not being in grantedScopes if it was ever sought
          },
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        };
        (
          mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
        ).mockResolvedValue(grantedConsent);
        const result = await consentService.getSubjectConsentStatus(
          subjectId,
          ['email', 'profile', 'offline_access'],
          policyId,
        );
        expect(result).toEqual({
          email: true,
          profile: false,
          offline_access: false,
        });
      });

      it('should return false for a scope that is granted but also in revokedScopes', async () => {
        const partiallyRevokedConsent: ConsentRecord = {
          id: 'c3',
          subjectId,
          policyId,
          version: 2,
          status: 'granted',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: subjectId },
          grantedScopes: {
            email: {
              key: 'email',
              name: 'Email',
              description: 'Access to email',
              required: false,
              grantedAt: mockDate,
            },
            profile: {
              key: 'profile',
              name: 'Profile',
              description: 'Access to profile',
              required: false,
              grantedAt: mockDate,
            },
          },
          revokedScopes: {
            profile: {
              key: 'profile',
              name: 'Profile',
              description: 'Access to profile',
              required: false,
              revokedAt: mockDate,
            }, // profile is explicitly revoked
          },
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        };
        (
          mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
        ).mockResolvedValue(partiallyRevokedConsent);
        const result = await consentService.getSubjectConsentStatus(
          subjectId,
          ['email', 'profile'],
          policyId,
        );
        expect(result).toEqual({ email: true, profile: false });
      });
    });
  });

  describe('createInitialGrant', () => {
    it('should create a new initial consent record directly', async () => {
      // Arrange
      const mockConsentInput: CreateConsentInput = {
        subjectId: 'user-initial',
        policyId: 'policy-initial',
        dateOfBirth: new Date('2000-01-01'),
        consenter: {
          type: 'self' as const,
          userId: 'user-initial',
        },
        grantedScopes: ['read', 'write'],
        metadata: {
          consentMethod: 'digital_form' as const,
          ipAddress: '10.0.0.1',
        },
      };

      const mockInitialPolicy: Policy = {
        id: 'policy-initial',
        policyGroupId: 'groupInitial',
        version: 1,
        status: 'active',
        effectiveDate: mockDate,
        title: 'Initial Grant Policy',
        contentSections: [
          { title: 's_init', content: 'c_init', description: 'd_init' },
        ],
        availableScopes: [
          { key: 'read', name: 'Read', description: 'Read access' },
          { key: 'write', name: 'Write', description: 'Write access' },
          { key: 'delete', name: 'Delete', description: 'Delete access' },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const mockCreatedConsent: ConsentRecord = {
        id: 'initialConsent789',
        version: 1,
        subjectId: mockConsentInput.subjectId,
        policyId: mockConsentInput.policyId,
        status: 'granted',
        consentedAt: mockDate,
        dateOfBirth: mockConsentInput.dateOfBirth,
        consenter: mockConsentInput.consenter,
        grantedScopes: {
          read: {
            key: 'read',
            name: 'Read',
            description: 'Read access',
            grantedAt: mockDate,
          },
          write: {
            key: 'write',
            name: 'Write',
            description: 'Write access',
            grantedAt: mockDate,
          },
        },
        metadata: mockConsentInput.metadata,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createConsent as any).mockResolvedValue(
        mockCreatedConsent,
      );
      // Ensure findLatestConsentBySubjectAndPolicy is NOT called by createInitialGrant
      (mockDataAdapter.findLatestConsentBySubjectAndPolicy as any).mockClear();
      (
        (mockDataAdapter as unknown as IDataAdapter).findPolicyById as any
      ).mockResolvedValue(mockInitialPolicy);

      // Act
      const result = await consentService.createInitialGrant(mockConsentInput);

      // Assert
      expect(
        mockDataAdapter.findLatestConsentBySubjectAndPolicy,
      ).not.toHaveBeenCalled();
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: mockConsentInput.subjectId,
        policyId: mockConsentInput.policyId,
        status: 'granted',
        version: 1,
        consentedAt: mockDate,
        dateOfBirth: mockConsentInput.dateOfBirth,
        consenter: mockConsentInput.consenter,
        grantedScopes: {
          read: {
            key: 'read',
            name: 'Read',
            description: 'Read access',
            grantedAt: mockDate,
          },
          write: {
            key: 'write',
            name: 'Write',
            description: 'Write access',
            grantedAt: mockDate,
          },
        },
        revokedScopes: {
          delete: {
            key: 'delete',
            name: 'Delete',
            description: 'Delete access',
            revokedAt: mockDate,
          },
        },
        revokedAt: undefined,
        metadata: mockConsentInput.metadata,
      });
      expect(result).toEqual(mockCreatedConsent);
    });
  });

  describe('getLatestConsentForSubjectAndPolicy', () => {
    const subjectId = 'subj1';
    const policyId = 'pol1';

    it('should return the latest consent record if found', async () => {
      const mockConsent: ConsentRecord = {
        id: 'latestC1',
        subjectId,
        policyId,
        version: 2,
        status: 'granted',
        consentedAt: mockDate,
        dateOfBirth: new Date('1990-01-01'),
        consenter: { type: 'self', userId: subjectId },
        grantedScopes: {
          read: {
            key: 'read',
            name: 'Read',
            description: 'Read access',
            required: false,
            grantedAt: mockDate,
          },
        },
        metadata: { consentMethod: 'digital_form' },
        createdAt: mockDate,
        updatedAt: mockDate,
      };
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(mockConsent);

      const result = await consentService.getLatestConsentForSubjectAndPolicy(
        subjectId,
        policyId,
      );
      expect(result).toEqual(mockConsent);
      expect(
        mockDataAdapter.findLatestConsentBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
    });

    it('should return null if no consent record is found', async () => {
      (
        mockDataAdapter.findLatestConsentBySubjectAndPolicy as any
      ).mockResolvedValue(null);

      const result = await consentService.getLatestConsentForSubjectAndPolicy(
        subjectId,
        policyId,
      );
      expect(result).toBeNull();
      expect(
        mockDataAdapter.findLatestConsentBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
    });
  });

  describe('getAllConsentVersionsForSubjectAndPolicy', () => {
    const subjectId = 'subj2';
    const policyId = 'pol2';

    it('should return all consent versions for a subject and policy', async () => {
      const mockConsents: ConsentRecord[] = [
        {
          id: 'v1',
          subjectId,
          policyId,
          version: 1,
          status: 'superseded',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: subjectId },
          grantedScopes: {},
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'v2',
          subjectId,
          policyId,
          version: 2,
          status: 'granted',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: subjectId },
          grantedScopes: {},
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];
      (
        mockDataAdapter.findAllConsentVersionsBySubjectAndPolicy as any
      ).mockResolvedValue(mockConsents);
      const result =
        await consentService.getAllConsentVersionsForSubjectAndPolicy(
          subjectId,
          policyId,
        );
      expect(result).toEqual(mockConsents);
      expect(
        mockDataAdapter.findAllConsentVersionsBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
    });

    it('should return an empty array if no versions are found', async () => {
      (
        mockDataAdapter.findAllConsentVersionsBySubjectAndPolicy as any
      ).mockResolvedValue([]);
      const result =
        await consentService.getAllConsentVersionsForSubjectAndPolicy(
          subjectId,
          policyId,
        );
      expect(result).toEqual([]);
      expect(
        mockDataAdapter.findAllConsentVersionsBySubjectAndPolicy,
      ).toHaveBeenCalledWith(subjectId, policyId);
    });
  });

  describe('getLatestConsentVersionsForSubject', () => {
    const subjectId = 'subj3';
    const policyId1 = 'policyA';
    const policyId2 = 'policyB';

    const consentP1V1: ConsentRecord = {
      id: 'p1v1',
      subjectId,
      policyId: policyId1,
      version: 1,
      status: 'superseded',
      consentedAt: new Date('2023-01-01'),
      consenter: { type: 'self', userId: subjectId },
      grantedScopes: {
        d: {
          key: 'd',
          name: 'D',
          description: 'D access',
          required: false,
          grantedAt: new Date(),
        },
      },
      metadata: { consentMethod: 'digital_form' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const consentP1V2: ConsentRecord = {
      id: 'p1v2',
      subjectId,
      policyId: policyId1,
      version: 2,
      status: 'granted',
      consentedAt: new Date('2023-01-02'),
      consenter: { type: 'self', userId: subjectId },
      grantedScopes: {
        d: {
          key: 'd',
          name: 'D',
          description: 'D access',
          required: false,
          grantedAt: new Date(),
        },
      },
      metadata: { consentMethod: 'digital_form' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const consentP2V1: ConsentRecord = {
      id: 'p2v1',
      subjectId,
      policyId: policyId2,
      version: 1,
      status: 'granted',
      consentedAt: new Date('2023-02-01'),
      consenter: { type: 'self', userId: subjectId },
      grantedScopes: {
        d: {
          key: 'd',
          name: 'D',
          description: 'D access',
          required: false,
          grantedAt: new Date(),
        },
      },
      metadata: { consentMethod: 'digital_form' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return an empty array if no consents exist for the subject', async () => {
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue([]);
      const result =
        await consentService.getLatestConsentVersionsForSubject(subjectId);
      expect(result).toEqual([]);
      expect(mockDataAdapter.findConsentsBySubject).toHaveBeenCalledWith(
        subjectId,
      );
    });

    it("should return the latest version of each policy's consent for the subject", async () => {
      const allConsents = [consentP1V1, consentP1V2, consentP2V1]; // P1V2 is latest for P1, P2V1 is latest for P2
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue(
        allConsents,
      );
      const result =
        await consentService.getLatestConsentVersionsForSubject(subjectId);
      expect(result).toEqual(
        expect.arrayContaining([consentP1V2, consentP2V1]),
      );
      expect(result.length).toBe(2);
    });

    it('should handle a single policy with multiple versions correctly', async () => {
      const allConsents = [consentP1V1, consentP1V2];
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue(
        allConsents,
      );
      const result =
        await consentService.getLatestConsentVersionsForSubject(subjectId);
      expect(result).toEqual([consentP1V2]);
    });

    it('should handle a single policy with a single version correctly', async () => {
      const allConsents = [consentP2V1];
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue(
        allConsents,
      );
      const result =
        await consentService.getLatestConsentVersionsForSubject(subjectId);
      expect(result).toEqual([consentP2V1]);
    });
  });

  describe('getAllConsents', () => {
    it('should return all consent records', async () => {
      const mockConsents: ConsentRecord[] = [
        {
          id: 'allC1',
          subjectId: 's1',
          policyId: 'p1',
          version: 1,
          status: 'granted',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: 's1' },
          grantedScopes: {},
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'allC2',
          subjectId: 's2',
          policyId: 'p2',
          version: 1,
          status: 'revoked',
          consentedAt: mockDate,
          consenter: { type: 'self', userId: 's2' },
          grantedScopes: {},
          metadata: { consentMethod: 'digital_form' },
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];
      (mockDataAdapter.getAllConsents as any).mockResolvedValue(mockConsents);
      const result = await consentService.getAllConsents();
      expect(result).toEqual(mockConsents);
      expect(mockDataAdapter.getAllConsents).toHaveBeenCalled();
    });

    it('should return an empty array if no consents exist', async () => {
      (mockDataAdapter.getAllConsents as any).mockResolvedValue([]);
      const result = await consentService.getAllConsents();
      expect(result).toEqual([]);
      expect(mockDataAdapter.getAllConsents).toHaveBeenCalled();
    });
  });
});
