import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PolicyService } from "../services/PolicyService.js";
import type {
  IPolicyDataAdapter,
  Policy,
  CreatePolicyInput,
  NewPolicyVersionDataInput,
} from "@open-source-consent/types";

describe("PolicyService", () => {
  let mockDataAdapter: IPolicyDataAdapter;
  let policyService: PolicyService;

  const mockDate = new Date("2025-01-01T00:00:00Z");
  const mockEffectiveDate = new Date("2025-01-15T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    mockDataAdapter = {
      createPolicy: vi.fn() as IPolicyDataAdapter["createPolicy"],
      updatePolicyStatus: vi.fn() as IPolicyDataAdapter["updatePolicyStatus"],
      findPolicyById: vi.fn() as IPolicyDataAdapter["findPolicyById"],
      findLatestActivePolicyByGroupId:
        vi.fn() as IPolicyDataAdapter["findLatestActivePolicyByGroupId"],
      findAllPolicyVersionsByGroupId:
        vi.fn() as IPolicyDataAdapter["findAllPolicyVersionsByGroupId"],
      listPolicies: vi.fn() as IPolicyDataAdapter["listPolicies"],
    };

    policyService = PolicyService.getInstance(mockDataAdapter);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createPolicy", () => {
    it("should create a new policy with the provided data", async () => {
      // Arrange
      const inputData: CreatePolicyInput = {
        policyGroupId: "group1",
        version: 1,
        contentSections: [
          {
            title: "Section 1",
            description: "Content 1",
            content: "Content 1",
          },
        ],
        availableScopes: [
          {
            key: "scope1",
            name: "Scope 1",
            description: "Scope 1 description",
          },
        ],
        effectiveDate: mockEffectiveDate,
        status: "draft",
      };

      const expectedPolicy: Policy = {
        id: "policy123",
        ...inputData,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createPolicy as any).mockResolvedValue(expectedPolicy);

      // Act
      const result = await policyService.createPolicy(inputData);

      // Assert
      expect(mockDataAdapter.createPolicy).toHaveBeenCalledWith(inputData);
      expect(result).toEqual(expectedPolicy);
    });

    it("should throw an error if required fields are missing", async () => {
      // Arrange
      const inputData = {
        // Missing policyGroupId, contentSections, etc.
        status: "draft",
      } as CreatePolicyInput; // Type assertion to test runtime validation

      // Act & Assert
      await expect(policyService.createPolicy(inputData)).rejects.toThrowError(
        "Missing required fields for policy creation: policyGroupId, contentSections, availableScopes, effectiveDate, status."
      );
      expect(mockDataAdapter.createPolicy).not.toHaveBeenCalled();
    });

    it("should allow creating a policy with a specific version if provided", async () => {
      // Arrange
      const inputData: CreatePolicyInput & { version?: number } = {
        policyGroupId: "group1",
        contentSections: [
          {
            title: "Section 1",
            description: "Content 1",
            content: "Content 1",
          },
        ],
        availableScopes: [
          {
            key: "scope1",
            name: "Scope 1",
            description: "Scope 1 description",
          },
        ],
        effectiveDate: mockEffectiveDate,
        status: "active",
        version: 5, // Explicitly providing version
      };

      const expectedPolicy: Policy = {
        id: "policy789",
        ...inputData,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.createPolicy as any).mockResolvedValue(expectedPolicy);

      // Act
      const result = await policyService.createPolicy(inputData);

      // Assert
      expect(mockDataAdapter.createPolicy).toHaveBeenCalledWith(inputData);
      expect(result).toEqual(expectedPolicy);
    });
  });

  describe("createNewPolicyVersion", () => {
    it("should create a new policy version and archive the old one", async () => {
      // Arrange
      const policyIdToSupersede = "oldPolicy123";
      const oldPolicyVersion = 2;
      const oldPolicy: Policy = {
        id: policyIdToSupersede,
        policyGroupId: "group1",
        version: oldPolicyVersion,
        contentSections: [
          {
            title: "Old Section",
            description: "Old Content",
            content: "Old Content",
          },
        ],
        availableScopes: [
          { key: "scope1", name: "Scope 1", description: "Old Scope Desc" },
        ],
        effectiveDate: new Date("2024-01-01T00:00:00Z"),
        status: "active",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const newVersionData: NewPolicyVersionDataInput = {
        contentSections: [
          {
            title: "New Section",
            description: "New Content",
            content: "New Content",
          },
        ],
        availableScopes: [
          { key: "scope2", name: "Scope 2", description: "New Scope Desc" },
        ],
        effectiveDate: mockEffectiveDate,
        status: "draft", // New version starts as draft
      };

      const expectedNewPolicy: Policy = {
        id: "newPolicy456",
        policyGroupId: oldPolicy.policyGroupId,
        version: oldPolicyVersion + 1,
        contentSections: newVersionData.contentSections,
        availableScopes: newVersionData.availableScopes,
        effectiveDate: newVersionData.effectiveDate,
        status: newVersionData.status || "draft",
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (mockDataAdapter.findPolicyById as any).mockResolvedValue(oldPolicy);
      (mockDataAdapter.createPolicy as any).mockResolvedValue(
        expectedNewPolicy
      );
      (mockDataAdapter.updatePolicyStatus as any).mockResolvedValue({
        ...oldPolicy,
        status: "archived",
        updatedAt: mockDate,
      });

      // Act
      const result = await policyService.createNewPolicyVersion(
        policyIdToSupersede,
        newVersionData
      );

      // Assert
      expect(mockDataAdapter.findPolicyById).toHaveBeenCalledWith(
        policyIdToSupersede
      );
      expect(mockDataAdapter.createPolicy).toHaveBeenCalledWith({
        ...newVersionData,
        policyGroupId: oldPolicy.policyGroupId,
        version: oldPolicyVersion + 1,
        status: newVersionData.status || "draft", // Ensure status is part of createPolicy input
        effectiveDate: newVersionData.effectiveDate, // Ensure effectiveDate is part of createPolicy input
      });
      expect(mockDataAdapter.updatePolicyStatus).toHaveBeenCalledWith(
        policyIdToSupersede,
        "archived",
        oldPolicyVersion
      );
      expect(result).toEqual(expectedNewPolicy);
    });

    it("should throw an error if the policy to supersede is not found", async () => {
      // Arrange
      const policyIdToSupersede = "nonExistentPolicy";
      const newVersionData: NewPolicyVersionDataInput = {
        contentSections: [
          {
            title: "New Section",
            description: "New Content",
            content: "New Content",
          },
        ],
        availableScopes: [
          { key: "scope2", name: "Scope 2", description: "New Scope Desc" },
        ],
        effectiveDate: mockEffectiveDate,
        status: "draft",
      };

      (mockDataAdapter.findPolicyById as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        policyService.createNewPolicyVersion(
          policyIdToSupersede,
          newVersionData
        )
      ).rejects.toThrowError(
        `Policy with ID ${policyIdToSupersede} not found to supersede.`
      );
      expect(mockDataAdapter.createPolicy).not.toHaveBeenCalled();
      expect(mockDataAdapter.updatePolicyStatus).not.toHaveBeenCalled();
    });

    it("should throw an error if the policy to supersede is already archived", async () => {
      // Arrange
      const policyIdToSupersede = "archivedPolicy123";
      const oldPolicy: Policy = {
        id: policyIdToSupersede,
        policyGroupId: "group1",
        version: 1,
        contentSections: [],
        availableScopes: [],
        effectiveDate: new Date(),
        status: "archived", // Already archived
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newVersionData: NewPolicyVersionDataInput = {
        contentSections: [],
        availableScopes: [],
        effectiveDate: mockEffectiveDate,
        status: "draft",
      };

      (mockDataAdapter.findPolicyById as any).mockResolvedValue(oldPolicy);

      // Act & Assert
      await expect(
        policyService.createNewPolicyVersion(
          policyIdToSupersede,
          newVersionData
        )
      ).rejects.toThrowError(
        `Policy ${policyIdToSupersede} cannot be superseded as it is already archived.`
      );
      expect(mockDataAdapter.createPolicy).not.toHaveBeenCalled();
      expect(mockDataAdapter.updatePolicyStatus).not.toHaveBeenCalled();
    });

    it("should still return the new policy if archiving the old one fails", async () => {
      // Arrange
      const policyIdToSupersede = "oldPolicyToFailArchive";
      const oldPolicyVersion = 1;
      const oldPolicy: Policy = {
        id: policyIdToSupersede,
        policyGroupId: "group2",
        version: oldPolicyVersion,
        contentSections: [{ title: "Old", description: "Old", content: "Old" }],
        availableScopes: [{ key: "s1", name: "S1", description: "S1" }],
        effectiveDate: new Date("2023-01-01T00:00:00Z"),
        status: "active",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-01T00:00:00Z"),
      };

      const newVersionData: NewPolicyVersionDataInput = {
        contentSections: [{ title: "New", description: "New", content: "New" }],
        availableScopes: [{ key: "s2", name: "S2", description: "S2" }],
        effectiveDate: mockEffectiveDate,
        status: "draft",
      };

      const expectedNewPolicy: Policy = {
        id: "newPolicy789",
        policyGroupId: oldPolicy.policyGroupId,
        version: oldPolicyVersion + 1,
        contentSections: newVersionData.contentSections,
        availableScopes: newVersionData.availableScopes,
        effectiveDate: newVersionData.effectiveDate,
        status: newVersionData.status || "draft",
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (mockDataAdapter.findPolicyById as any).mockResolvedValue(oldPolicy);
      (mockDataAdapter.createPolicy as any).mockResolvedValue(
        expectedNewPolicy
      );
      (mockDataAdapter.updatePolicyStatus as any).mockRejectedValue(
        new Error("Failed to archive")
      );

      // Act
      const result = await policyService.createNewPolicyVersion(
        policyIdToSupersede,
        newVersionData
      );

      // Assert
      expect(result).toEqual(expectedNewPolicy); // Should still return the new policy
      expect(mockDataAdapter.updatePolicyStatus).toHaveBeenCalledWith(
        policyIdToSupersede,
        "archived",
        oldPolicyVersion
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to archive policy ${policyIdToSupersede} after creating new version ${expectedNewPolicy.id}. Error: Error: Failed to archive`
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("updatePolicyStatus", () => {
    it("should update the status of a policy", async () => {
      // Arrange
      const policyId = "policyToUpdateStatus";
      const newStatus = "active";
      const expectedVersion = 3;
      const updatedPolicy: Policy = {
        id: policyId,
        policyGroupId: "groupX",
        version: expectedVersion, // Version should remain the same after status update
        contentSections: [],
        availableScopes: [],
        effectiveDate: mockEffectiveDate,
        status: newStatus,
        createdAt: mockDate,
        updatedAt: mockDate, // Should be updated
      };

      (mockDataAdapter.updatePolicyStatus as any).mockResolvedValue(
        updatedPolicy
      );

      // Act
      const result = await policyService.updatePolicyStatus(
        policyId,
        newStatus,
        expectedVersion
      );

      // Assert
      expect(mockDataAdapter.updatePolicyStatus).toHaveBeenCalledWith(
        policyId,
        newStatus,
        expectedVersion
      );
      expect(result).toEqual(updatedPolicy);
    });

    it("should throw an error if policyId is missing", async () => {
      // Act & Assert
      await expect(
        policyService.updatePolicyStatus(
          null as any, // Test runtime validation
          "active",
          1
        )
      ).rejects.toThrowError(
        "Policy ID and status are required to update policy status."
      );
    });

    it("should throw an error if status is missing", async () => {
      // Act & Assert
      await expect(
        policyService.updatePolicyStatus(
          "somePolicyId",
          null as any, // Test runtime validation
          1
        )
      ).rejects.toThrowError(
        "Policy ID and status are required to update policy status."
      );
    });

    it("should throw an error if status is empty string", async () => {
      // Act & Assert
      await expect(
        policyService.updatePolicyStatus("somePolicyId", "" as any, 1)
      ).rejects.toThrowError(
        "Policy ID and status are required to update policy status."
      );
    });

    it("should throw an error for invalid status value", async () => {
      // Act & Assert
      await expect(
        policyService.updatePolicyStatus(
          "somePolicyId",
          "invalidStatus" as any,
          1
        )
      ).rejects.toThrowError("Invalid status provided for policy update.");
    });

    it.each([["active"], ["draft"], ["archived"]])(
      "should allow valid status value: %s",
      async (validStatus: string) => {
        // Arrange
        const policyId = "policyToUpdateStatus";
        const expectedVersion = 1;
        const updatedPolicy: Policy = {
          id: policyId,
          policyGroupId: "groupX",
          version: expectedVersion,
          contentSections: [],
          availableScopes: [],
          effectiveDate: mockEffectiveDate,
          status: validStatus as Policy["status"],
          createdAt: mockDate,
          updatedAt: mockDate,
        };
        (mockDataAdapter.updatePolicyStatus as any).mockResolvedValue(
          updatedPolicy
        );

        // Act
        const result = await policyService.updatePolicyStatus(
          policyId,
          validStatus as Policy["status"],
          expectedVersion
        );

        // Assert
        expect(mockDataAdapter.updatePolicyStatus).toHaveBeenCalledWith(
          policyId,
          validStatus as Policy["status"],
          expectedVersion
        );
        expect(result).toEqual(updatedPolicy);
      }
    );
  });

  describe("getPolicyById", () => {
    it("should retrieve a policy by its ID", async () => {
      // Arrange
      const policyId = "existingPolicy123";
      const mockPolicy: Policy = {
        id: policyId,
        policyGroupId: "groupA",
        version: 1,
        contentSections: [{ title: "T", description: "D", content: "C" }],
        availableScopes: [{ key: "s", name: "N", description: "Ds" }],
        effectiveDate: mockEffectiveDate,
        status: "active",
        createdAt: mockDate,
        updatedAt: mockDate,
      };
      (mockDataAdapter.findPolicyById as any).mockResolvedValue(mockPolicy);

      // Act
      const result = await policyService.getPolicyById(policyId);

      // Assert
      expect(mockDataAdapter.findPolicyById).toHaveBeenCalledWith(policyId);
      expect(result).toEqual(mockPolicy);
    });

    it("should return null if the policy is not found", async () => {
      // Arrange
      const policyId = "nonExistentPolicy456";
      (mockDataAdapter.findPolicyById as any).mockResolvedValue(null);

      // Act
      const result = await policyService.getPolicyById(policyId);

      // Assert
      expect(mockDataAdapter.findPolicyById).toHaveBeenCalledWith(policyId);
      expect(result).toBeNull();
    });
  });

  describe("getLatestActivePolicyByGroupId", () => {
    it("should retrieve the latest active policy for a group ID", async () => {
      // Arrange
      const policyGroupId = "groupB";
      const mockPolicy: Policy = {
        id: "policy789",
        policyGroupId: policyGroupId,
        version: 3, // Assuming this is the latest active
        contentSections: [],
        availableScopes: [],
        effectiveDate: mockEffectiveDate,
        status: "active",
        createdAt: mockDate,
        updatedAt: mockDate,
      };
      (
        mockDataAdapter.findLatestActivePolicyByGroupId as any
      ).mockResolvedValue(mockPolicy);

      // Act
      const result =
        await policyService.getLatestActivePolicyByGroupId(policyGroupId);

      // Assert
      expect(
        mockDataAdapter.findLatestActivePolicyByGroupId
      ).toHaveBeenCalledWith(policyGroupId);
      expect(result).toEqual(mockPolicy);
    });

    it("should return null if no active policy is found for the group ID", async () => {
      // Arrange
      const policyGroupId = "groupC_noActive";
      (
        mockDataAdapter.findLatestActivePolicyByGroupId as any
      ).mockResolvedValue(null);

      // Act
      const result =
        await policyService.getLatestActivePolicyByGroupId(policyGroupId);

      // Assert
      expect(
        mockDataAdapter.findLatestActivePolicyByGroupId
      ).toHaveBeenCalledWith(policyGroupId);
      expect(result).toBeNull();
    });
  });

  describe("getAllPolicyVersionsByGroupId", () => {
    it("should retrieve all policy versions for a group ID", async () => {
      // Arrange
      const policyGroupId = "groupD";
      const mockPolicies: Policy[] = [
        {
          id: "policyV1",
          policyGroupId: policyGroupId,
          version: 1,
          contentSections: [],
          availableScopes: [],
          effectiveDate: new Date("2024-01-01"),
          status: "archived",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
        },
        {
          id: "policyV2",
          policyGroupId: policyGroupId,
          version: 2,
          contentSections: [],
          availableScopes: [],
          effectiveDate: mockEffectiveDate,
          status: "active",
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];
      (mockDataAdapter.findAllPolicyVersionsByGroupId as any).mockResolvedValue(
        mockPolicies
      );

      // Act
      const result =
        await policyService.getAllPolicyVersionsByGroupId(policyGroupId);

      // Assert
      expect(
        mockDataAdapter.findAllPolicyVersionsByGroupId
      ).toHaveBeenCalledWith(policyGroupId);
      expect(result).toEqual(mockPolicies);
    });

    it("should return an empty array if no policies are found for the group ID", async () => {
      // Arrange
      const policyGroupId = "groupE_noPolicies";
      (mockDataAdapter.findAllPolicyVersionsByGroupId as any).mockResolvedValue(
        []
      );

      // Act
      const result =
        await policyService.getAllPolicyVersionsByGroupId(policyGroupId);

      // Assert
      expect(
        mockDataAdapter.findAllPolicyVersionsByGroupId
      ).toHaveBeenCalledWith(policyGroupId);
      expect(result).toEqual([]);
    });
  });

  describe("listPolicies", () => {
    it("should retrieve a list of all policies", async () => {
      // Arrange
      const mockPoliciesList: Policy[] = [
        {
          id: "policy1",
          policyGroupId: "groupX",
          version: 1,
          contentSections: [],
          availableScopes: [],
          effectiveDate: new Date("2024-01-01"),
          status: "active",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "policy2",
          policyGroupId: "groupY",
          version: 2,
          contentSections: [],
          availableScopes: [],
          effectiveDate: mockEffectiveDate,
          status: "draft",
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];
      (mockDataAdapter.listPolicies as any).mockResolvedValue(mockPoliciesList);

      // Act
      const result = await policyService.listPolicies();

      // Assert
      expect(mockDataAdapter.listPolicies).toHaveBeenCalled();
      expect(result).toEqual(mockPoliciesList);
    });

    it("should return an empty array if no policies exist", async () => {
      // Arrange
      (mockDataAdapter.listPolicies as any).mockResolvedValue([]);

      // Act
      const result = await policyService.listPolicies();

      // Assert
      expect(mockDataAdapter.listPolicies).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
