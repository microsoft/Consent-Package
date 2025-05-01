import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsentService } from "../services/ConsentService.js";
import type {
  IConsentDataAdapter,
  ConsentRecord,
} from "@open-source-consent/types";

describe("ConsentService", () => {
  let mockDataAdapter: IConsentDataAdapter;
  let consentService: ConsentService;

  const mockDate = new Date("2025-01-01T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    mockDataAdapter = {
      createConsent: vi.fn() as IConsentDataAdapter["createConsent"],
      updateConsent: vi.fn() as IConsentDataAdapter["updateConsent"],
      findConsentById: vi.fn() as IConsentDataAdapter["findConsentById"],
      findConsentsBySubject:
        vi.fn() as IConsentDataAdapter["findConsentsBySubject"],
    };

    consentService = new ConsentService(mockDataAdapter);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("grantConsent", () => {
    it("should create a new consent record with granted status", async () => {
      // Arrange
      const mockConsentInput = {
        subjectId: "user123",
        policyId: "policy456",
        consenter: {
          type: "self" as const,
          userId: "user123",
        },
        grantedScopes: ["email", "profile"],
        metadata: {
          consentMethod: "digital_form" as const,
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        },
      };

      const mockCreatedConsent: ConsentRecord = {
        id: "consent789",
        version: 1,
        subjectId: "user123",
        policyId: "policy456",
        status: "granted",
        consentedAt: mockDate,
        consenter: {
          type: "self",
          userId: "user123",
        },
        grantedScopes: {
          email: { grantedAt: mockDate },
          profile: { grantedAt: mockDate },
        },
        metadata: {
          consentMethod: "digital_form",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createConsent as any).mockResolvedValue(
        mockCreatedConsent
      );

      // Act
      const result = await consentService.grantConsent(mockConsentInput);

      // Assert
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: "user123",
        policyId: "policy456",
        status: "granted",
        consentedAt: mockDate,
        consenter: {
          type: "self",
          userId: "user123",
        },
        grantedScopes: {
          email: { grantedAt: mockDate },
          profile: { grantedAt: mockDate },
        },
        metadata: {
          consentMethod: "digital_form",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        },
      });

      expect(result).toEqual(mockCreatedConsent);
    });

    it("should handle proxy consent correctly", async () => {
      // Arrange
      const mockProxyConsentInput = {
        subjectId: "child123",
        policyId: "policy456",
        consenter: {
          type: "proxy" as const,
          userId: "parent456",
          proxyDetails: {
            relationship: "parent",
            subjectAgeGroup: "under13" as const,
          },
        },
        grantedScopes: ["app_usage"],
        metadata: {
          consentMethod: "digital_form" as const,
        },
      };

      const mockCreatedConsent: ConsentRecord = {
        id: "consent789",
        version: 1,
        subjectId: "child123",
        policyId: "policy456",
        status: "granted",
        consentedAt: mockDate,
        consenter: {
          type: "proxy",
          userId: "parent456",
          proxyDetails: {
            relationship: "parent",
            subjectAgeGroup: "under13",
          },
        },
        grantedScopes: {
          app_usage: { grantedAt: mockDate },
        },
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createConsent as any).mockResolvedValue(
        mockCreatedConsent
      );

      // Act
      const result = await consentService.grantConsent(mockProxyConsentInput);

      // Assert
      expect(mockDataAdapter.createConsent).toHaveBeenCalledWith({
        subjectId: "child123",
        policyId: "policy456",
        status: "granted",
        consentedAt: mockDate,
        consenter: {
          type: "proxy",
          userId: "parent456",
          proxyDetails: {
            relationship: "parent",
            subjectAgeGroup: "under13",
          },
        },
        grantedScopes: {
          app_usage: { grantedAt: mockDate },
        },
        metadata: {
          consentMethod: "digital_form",
        },
      });

      expect(result).toEqual(mockCreatedConsent);
    });
  });

  describe("revokeConsent", () => {
    it("should revoke all scopes when no specific scopes provided", async () => {
      // Arrange
      const mockRevokeInput = {
        consentId: "consent123",
        currentVersion: 2,
      };

      const mockUpdatedConsent: ConsentRecord = {
        id: "consent123",
        version: 3,
        subjectId: "user123",
        policyId: "policy456",
        status: "revoked",
        consentedAt: new Date("2022-12-15"),
        revokedAt: mockDate,
        consenter: {
          type: "self",
          userId: "user123",
        },
        grantedScopes: {
          email: { grantedAt: new Date("2022-12-15") },
        },
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date("2022-12-15"),
        updatedAt: mockDate,
      };

      (mockDataAdapter.updateConsent as any).mockResolvedValue(
        mockUpdatedConsent
      );

      // Act
      const result = await consentService.revokeConsent(mockRevokeInput);

      // Assert
      expect(mockDataAdapter.updateConsent).toHaveBeenCalledWith(
        "consent123",
        {
          status: "revoked",
          revokedAt: mockDate,
        },
        2
      );

      expect(result).toEqual(mockUpdatedConsent);
    });

    it("should revoke specific scopes when provided", async () => {
      // Arrange
      const mockRevokeInput = {
        consentId: "consent123",
        scopesToRevoke: ["email"],
        currentVersion: 2,
      };

      const mockUpdatedConsent: ConsentRecord = {
        id: "consent123",
        version: 3,
        subjectId: "user123",
        policyId: "policy456",
        status: "granted",
        consentedAt: new Date("2024-12-15"),
        consenter: {
          type: "self",
          userId: "user123",
        },
        grantedScopes: {
          email: { grantedAt: new Date("2024-12-15") },
          profile: { grantedAt: new Date("2024-12-15") },
        },
        revokedScopes: {
          email: { revokedAt: mockDate },
        },
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date("2024-12-15"),
        updatedAt: mockDate,
      };

      (mockDataAdapter.updateConsent as any).mockResolvedValue(
        mockUpdatedConsent
      );

      // Act
      const result = await consentService.revokeConsent(mockRevokeInput);

      // Assert
      expect(mockDataAdapter.updateConsent).toHaveBeenCalledWith(
        "consent123",
        {
          revokedScopes: {
            email: { revokedAt: mockDate },
          },
        },
        2
      );

      expect(result).toEqual(mockUpdatedConsent);
    });
  });

  describe("getConsentDetails", () => {
    it("should retrieve consent details by id", async () => {
      // Arrange
      const mockConsent: ConsentRecord = {
        id: "consent123",
        version: 1,
        subjectId: "user123",
        policyId: "policy456",
        status: "granted",
        consentedAt: new Date("2024-12-15"),
        consenter: {
          type: "self",
          userId: "user123",
        },
        grantedScopes: {
          email: { grantedAt: new Date("2024-12-15") },
        },
        metadata: {
          consentMethod: "digital_form",
        },
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date("2024-12-15"),
      };

      (mockDataAdapter.findConsentById as any).mockResolvedValue(mockConsent);

      // Act
      const result = await consentService.getConsentDetails("consent123");

      // Assert
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        "consent123"
      );
      expect(result).toEqual(mockConsent);
    });

    it("should return null when consent not found", async () => {
      // Arrange
      (mockDataAdapter.findConsentById as any).mockResolvedValue(null);

      // Act
      const result = await consentService.getConsentDetails("nonexistent");

      // Assert
      expect(mockDataAdapter.findConsentById).toHaveBeenCalledWith(
        "nonexistent"
      );
      expect(result).toBeNull();
    });
  });

  describe("getSubjectConsentStatus", () => {
    it("should return consent status for each requested scope", async () => {
      // Arrange
      const mockConsents: ConsentRecord[] = [
        {
          id: "consent123",
          version: 1,
          subjectId: "user123",
          policyId: "policy456",
          status: "granted",
          consentedAt: new Date("2024-12-15"),
          consenter: {
            type: "self",
            userId: "user123",
          },
          grantedScopes: {
            email: { grantedAt: new Date("2024-12-15") },
            profile: { grantedAt: new Date("2024-12-15") },
          },
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date("2024-12-15"),
          updatedAt: new Date("2024-12-15"),
        },
        {
          id: "consent456",
          version: 2,
          subjectId: "user123",
          policyId: "policy789",
          status: "granted",
          consentedAt: new Date("2024-12-16"),
          consenter: {
            type: "self",
            userId: "user123",
          },
          grantedScopes: {
            location: { grantedAt: new Date("2024-12-16") },
          },
          revokedScopes: {
            location: { revokedAt: new Date("2024-12-17") },
          },
          metadata: {
            consentMethod: "digital_form",
          },
          createdAt: new Date("2024-12-16"),
          updatedAt: new Date("2024-12-17"),
        },
      ];

      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue(
        mockConsents
      );

      // Act
      const result = await consentService.getSubjectConsentStatus("user123", [
        "email",
        "profile",
        "location",
        "camera",
      ]);

      // Assert
      expect(mockDataAdapter.findConsentsBySubject).toHaveBeenCalledWith(
        "user123"
      );
      expect(result).toEqual({
        email: true,
        profile: true,
        location: false, // This scope is revoked
        camera: false, // This scope was never granted
      });
    });

    it("should return all false when subject has no consents", async () => {
      // Arrange
      (mockDataAdapter.findConsentsBySubject as any).mockResolvedValue([]);

      // Act
      const result = await consentService.getSubjectConsentStatus("user456", [
        "email",
        "profile",
      ]);

      // Assert
      expect(mockDataAdapter.findConsentsBySubject).toHaveBeenCalledWith(
        "user456"
      );
      expect(result).toEqual({
        email: false,
        profile: false,
      });
    });
  });
});
