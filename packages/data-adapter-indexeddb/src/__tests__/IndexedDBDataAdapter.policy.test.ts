import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { IndexedDBDataAdapter } from "../IndexedDBDataAdapter.js";
import type { Policy, CreatePolicyInput } from "@open-source-consent/types";
import "fake-indexeddb/auto";

const DB_NAME = "OpenSourceConsentDB";
const POLICY_STORE_NAME = "policies";

let dataAdapter: IndexedDBDataAdapter;

async function deleteTestDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error("[Test Policy Debug] deleteTestDatabase: Error -", error);
      reject(error);
    };
    request.onblocked = (event) => {
      console.warn("[Test Policy Debug] deleteTestDatabase: Blocked -", event);
      const err = new Error(
        "Database deletion blocked. Please ensure all connections are closed."
      );
      if (dataAdapter && typeof dataAdapter.close === "function") {
        console.warn(
          "[Test Policy Debug] deleteTestDatabase: Attempting to close adapter DB due to block before rejecting."
        );
        void dataAdapter.close().catch((closeErr) => {
          console.error(
            "[Test Policy Debug] deleteTestDatabase: Error during adapter close on block:",
            closeErr
          );
        });
      }
      reject(err);
    };
  });
}

describe("IndexedDBDataAdapter - Policy Methods", () => {
  beforeAll(async () => {
    dataAdapter = new IndexedDBDataAdapter();

    await dataAdapter
      .close()
      .catch((err) =>
        console.warn(
          "[Test Policy Debug] beforeAll: Pre-emptive adapter close failed (normal if no prior DB):",
          err
        )
      );

    await deleteTestDatabase().catch((err) =>
      console.warn("[Test Policy Debug] beforeAll: Pre-delete DB failed:", err)
    );
    await dataAdapter.initialize();
  }, 30000);

  afterAll(async () => {
    if (dataAdapter) {
      await dataAdapter
        .close()
        .catch((err) =>
          console.warn(
            "[Test Policy Debug] afterAll: Adapter close failed:",
            err
          )
        );
    }
    await deleteTestDatabase().catch((err) =>
      console.error(
        "[Test Policy Debug] afterAll: Post-test delete DB failed:",
        err
      )
    );
  }, 30000);

  beforeEach(async () => {
    await dataAdapter.initialize();
    try {
      await dataAdapter.clearStore(POLICY_STORE_NAME);
    } catch (error) {
      console.error(
        `[Test Policy Debug] beforeEach: Failed to clear store '${POLICY_STORE_NAME}':`,
        error
      );
      throw error;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPolicy", () => {
    it("should create a policy record with auto-generated fields", async () => {
      const policyInput: CreatePolicyInput = {
        title: "Policy A",
        policyGroupId: "group1",
        version: 1,
        status: "draft",
        effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
        contentSections: [
          { title: "Intro", description: "Welcome", content: "Details..." },
        ],
        availableScopes: [
          {
            key: "read_data",
            name: "Read Data",
            description: "Allows reading.",
          },
        ],
      };

      const beforeCreateTimestamp = Date.now();
      const createdPolicy = await dataAdapter.createPolicy(policyInput);
      const afterCreateTimestamp = Date.now();

      expect(createdPolicy.id).toEqual(expect.any(String));
      expect(createdPolicy.policyGroupId).toBe(policyInput.policyGroupId);
      expect(createdPolicy.version).toBe(policyInput.version);
      expect(createdPolicy.status).toBe(policyInput.status);
      expect(new Date(createdPolicy.effectiveDate).toISOString()).toBe(
        policyInput.effectiveDate.toISOString()
      );
      expect(createdPolicy.contentSections).toEqual(
        policyInput.contentSections
      );
      expect(createdPolicy.availableScopes).toEqual(
        policyInput.availableScopes
      );

      expect(createdPolicy.createdAt).toBeInstanceOf(Date);
      expect(createdPolicy.updatedAt).toBeInstanceOf(Date);
      expect(createdPolicy.createdAt.getTime()).toEqual(
        createdPolicy.updatedAt.getTime()
      );
      expect(createdPolicy.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreateTimestamp - 1000
      );
      expect(createdPolicy.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreateTimestamp + 1000
      );

      const fetchedPolicy = await dataAdapter.findPolicyById(createdPolicy.id);
      expect(fetchedPolicy).not.toBeNull();
      expect(fetchedPolicy).toEqual(createdPolicy);
    });
  });

  describe("findPolicyById", () => {
    it("should return a policy record when found", async () => {
      const policyInput: CreatePolicyInput = {
        title: "Policy A",
        policyGroupId: "groupFind",
        version: 1,
        status: "active",
        effectiveDate: new Date(),
        contentSections: [],
        availableScopes: [],
      };
      const createdPolicy = await dataAdapter.createPolicy(policyInput);

      const foundPolicy = await dataAdapter.findPolicyById(createdPolicy.id);
      expect(foundPolicy).not.toBeNull();
      expect(foundPolicy).toEqual(createdPolicy);
    });

    it("should return null if policy is not found", async () => {
      const foundPolicy = await dataAdapter.findPolicyById("non-existent-id");
      expect(foundPolicy).toBeNull();
    });
  });

  describe("updatePolicyStatus", () => {
    let policyToUpdate: Policy;
    const initialEffectiveDate = new Date("2025-03-01T00:00:00.000Z");

    beforeEach(async () => {
      const initialPolicyData: CreatePolicyInput = {
        title: "Policy A",
        policyGroupId: "groupUpdate",
        version: 1,
        status: "draft",
        effectiveDate: initialEffectiveDate,
        contentSections: [
          { title: "Initial", content: "Content", description: "Desc" },
        ],
        availableScopes: [
          { key: "scope1", name: "Scope 1", description: "Desc 1" },
        ],
      };
      policyToUpdate = await dataAdapter.createPolicy(initialPolicyData);
    });

    it("should update a policy's status without incrementing version, and update 'updatedAt'", async () => {
      const newStatus = "active";
      const expectedVersionBeforeUpdate = policyToUpdate.version;

      await new Promise((resolve) => setTimeout(resolve, 50));
      const beforeUpdateTimestamp = Date.now();

      const updatedPolicy = await dataAdapter.updatePolicyStatus(
        policyToUpdate.id,
        newStatus,
        expectedVersionBeforeUpdate
      );
      const afterUpdateTimestamp = Date.now();

      expect(updatedPolicy.id).toBe(policyToUpdate.id);
      expect(updatedPolicy.status).toBe(newStatus);
      expect(updatedPolicy.version).toBe(expectedVersionBeforeUpdate);
      expect(updatedPolicy.updatedAt).toBeInstanceOf(Date);
      expect(updatedPolicy.updatedAt.getTime()).toBeGreaterThan(
        policyToUpdate.updatedAt.getTime()
      );
      expect(updatedPolicy.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdateTimestamp - 1000
      );
      expect(updatedPolicy.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdateTimestamp + 1000
      );
      expect(updatedPolicy.createdAt.getTime()).toEqual(
        policyToUpdate.createdAt.getTime()
      );
      expect(updatedPolicy.policyGroupId).toBe(policyToUpdate.policyGroupId);
      expect(new Date(updatedPolicy.effectiveDate).toISOString()).toBe(
        initialEffectiveDate.toISOString()
      );

      const fetchedPolicy = await dataAdapter.findPolicyById(policyToUpdate.id);
      expect(fetchedPolicy).toEqual(updatedPolicy);
    });

    it("should throw error if policy for status update is not found", async () => {
      await expect(
        dataAdapter.updatePolicyStatus("non-existent-id", "active", 1)
      ).rejects.toThrow(/^Policy with id .* not found/);
    });

    it("should throw error on version mismatch during status update", async () => {
      const incorrectVersion = policyToUpdate.version + 5;
      await expect(
        dataAdapter.updatePolicyStatus(
          policyToUpdate.id,
          "archived",
          incorrectVersion
        )
      ).rejects.toThrow(
        `Optimistic concurrency check failed for policy ${policyToUpdate.id}. Expected version ${incorrectVersion}, found ${policyToUpdate.version}.`
      );
    });
  });

  describe("findAllPolicyVersionsByGroupId", () => {
    const P_GROUP_ID = "groupForAllVersions";
    let p1v1: Policy, p1v2: Policy;
    const commonVersionData: Omit<
      CreatePolicyInput,
      "policyGroupId" | "version" | "status"
    > = {
      title: "Policy A",
      effectiveDate: new Date("2025-05-01T00:00:00.000Z"),
      contentSections: [
        { title: "All Versions", content: "Content", description: "Desc" },
      ],
      availableScopes: [
        { key: "v_scope", name: "V Scope", description: "Desc" },
      ],
    };

    beforeEach(async () => {
      p1v1 = await dataAdapter.createPolicy({
        ...commonVersionData,
        policyGroupId: P_GROUP_ID,
        version: 1,
        status: "draft",
      });
      p1v2 = await dataAdapter.createPolicy({
        ...commonVersionData,
        policyGroupId: P_GROUP_ID,
        version: 2,
        status: "active",
      });
      await dataAdapter.createPolicy({
        ...commonVersionData,
        policyGroupId: "otherGroup",
        version: 1,
        status: "active",
      });
    });

    it("should return all versions of policies for a given group ID, ordered by version ASC", async () => {
      const versions =
        await dataAdapter.findAllPolicyVersionsByGroupId(P_GROUP_ID);
      expect(versions.length).toBe(2);
      expect(versions[0].id).toBe(p1v1.id);
      expect(versions[0].version).toBe(1);
      expect(versions[1].id).toBe(p1v2.id);
      expect(versions[1].version).toBe(2);
    });

    it("should return an empty array if the policy group ID does not exist", async () => {
      const versions =
        await dataAdapter.findAllPolicyVersionsByGroupId("nonExistentGroup");
      expect(versions).toEqual([]);
    });
  });

  describe("findLatestActivePolicyByGroupId", () => {
    const P_GROUP_ID_1 = "latestActiveGroup1";
    const P_GROUP_ID_NO_ACTIVE = "noActiveGroup";
    const commonPolicyDetails: Omit<
      CreatePolicyInput,
      "policyGroupId" | "version" | "status"
    > = {
      title: "Policy A",
      effectiveDate: new Date("2025-04-01T00:00:00.000Z"),
      contentSections: [
        { title: "Latest Active", content: "Test", description: "Desc" },
      ],
      availableScopes: [
        { key: "la_scope", name: "LA Scope", description: "Desc" },
      ],
    };
    let activeV2: Policy;

    beforeEach(async () => {
      await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: P_GROUP_ID_1,
        version: 1,
        status: "draft",
      });
      activeV2 = await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: P_GROUP_ID_1,
        version: 2,
        status: "active",
      });
      await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: P_GROUP_ID_1,
        version: 3,
        status: "archived",
      });
      await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: "otherGroupWithActive",
        version: 1,
        status: "active",
      });
      await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: P_GROUP_ID_NO_ACTIVE,
        version: 1,
        status: "draft",
      });
      await dataAdapter.createPolicy({
        ...commonPolicyDetails,
        policyGroupId: P_GROUP_ID_NO_ACTIVE,
        version: 2,
        status: "archived",
      });
    });

    it("should return the latest active policy for a given group ID", async () => {
      const latestActive =
        await dataAdapter.findLatestActivePolicyByGroupId(P_GROUP_ID_1);
      expect(latestActive).not.toBeNull();
      expect(latestActive!.id).toBe(activeV2.id);
      expect(latestActive!.version).toBe(2);
      expect(latestActive!.status).toBe("active");
    });

    it("should return null if no active policy exists for the group ID", async () => {
      const latestActive =
        await dataAdapter.findLatestActivePolicyByGroupId(P_GROUP_ID_NO_ACTIVE);
      expect(latestActive).toBeNull();
    });

    it("should return null if the policy group ID does not exist", async () => {
      const latestActive = await dataAdapter.findLatestActivePolicyByGroupId(
        "nonExistentGroupForLatest"
      );
      expect(latestActive).toBeNull();
    });
  });

  describe("listPolicies", () => {
    let p_A_v2: Policy, p_A_v1: Policy, p_B_v1: Policy;
    const commonListData: Omit<
      CreatePolicyInput,
      "policyGroupId" | "version" | "status"
    > = {
      title: "Policy A",
      effectiveDate: new Date("2025-06-01T00:00:00.000Z"),
      contentSections: [
        { title: "List", content: "Content", description: "Desc" },
      ],
      availableScopes: [
        { key: "list_scope", name: "List Scope", description: "Desc" },
      ],
    };
    const P_GROUP_LIST_A = "listPGroupA";
    const P_GROUP_LIST_B = "listPGroupB";

    beforeEach(async () => {
      p_B_v1 = await dataAdapter.createPolicy({
        ...commonListData,
        policyGroupId: P_GROUP_LIST_B,
        version: 1,
        status: "active",
        title: "Policy B",
      });
      p_A_v1 = await dataAdapter.createPolicy({
        ...commonListData,
        policyGroupId: P_GROUP_LIST_A,
        version: 1,
        status: "draft",
        title: "Policy A",
      });
      p_A_v2 = await dataAdapter.createPolicy({
        ...commonListData,
        policyGroupId: P_GROUP_LIST_A,
        version: 2,
        status: "active",
        title: "Policy A",
      });
      await dataAdapter.createPolicy({
        ...commonListData,
        policyGroupId: "listPGroupC",
        version: 1,
        status: "draft",
        title: "Policy C",
      });
    });

    it("should return all policies, ordered by policyGroupId ASC, then version DESC", async () => {
      const allPolicies = await dataAdapter.listPolicies();

      expect(allPolicies.length).toBeGreaterThanOrEqual(3);

      const index_A_v2 = allPolicies.findIndex((p) => p.id === p_A_v2.id);
      const index_A_v1 = allPolicies.findIndex((p) => p.id === p_A_v1.id);
      const index_B_v1 = allPolicies.findIndex((p) => p.id === p_B_v1.id);

      expect(index_A_v2).not.toBe(-1);
      expect(index_A_v1).not.toBe(-1);
      expect(index_B_v1).not.toBe(-1);

      expect(index_A_v2).toBeLessThan(index_A_v1);
      expect(index_A_v1).toBeLessThan(index_B_v1);

      if (allPolicies.length >= 3) {
        expect(allPolicies[index_A_v2].id).toBe(p_A_v2.id);
        expect(allPolicies[index_A_v1].id).toBe(p_A_v1.id);
        expect(allPolicies[index_B_v1].id).toBe(p_B_v1.id);
      }
    });

    it("should return an empty array if no policies exist", async () => {
      const dbOpenRequest = indexedDB.open(DB_NAME);
      await new Promise<void>((resolve, reject) => {
        dbOpenRequest.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          await dataAdapter.clearStore(POLICY_STORE_NAME);
          db.close();
          resolve();
        };
        dbOpenRequest.onerror = (event) =>
          reject((event.target as IDBRequest).error);
      });
      const policies = await dataAdapter.listPolicies();
      expect(policies).toEqual([]);
    });
  });
});
