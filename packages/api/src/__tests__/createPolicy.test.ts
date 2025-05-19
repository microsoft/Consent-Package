import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";
import type { CreatePolicyInput } from "@open-source-consent/types";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("createPolicy function", () => {
  let registeredHandlers: Record<string, Function>;
  let policyServiceMocks: any;

  const validPolicyInput: CreatePolicyInput = {
    policyGroupId: "test-group-id",
    status: "active",
    version: 1,
    effectiveDate: new Date(),
    contentSections: [],
    availableScopes: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env: any = await initializeTestEnvironment([
      "../functions/createPolicy.js",
    ]);
    registeredHandlers = env.registeredHandlers;
    policyServiceMocks = env.policyServiceMocks;
  });

  it("should create a policy when valid data is provided", async () => {
    const createdPolicy = { ...validPolicyInput, id: "new-policy-id" };
    policyServiceMocks.createPolicy.mockResolvedValue(createdPolicy);

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(validPolicyInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(201);
    expect(result.jsonBody).toEqual(createdPolicy);
    expect(policyServiceMocks.createPolicy).toHaveBeenCalledWith(
      validPolicyInput
    );
  });

  it("should return 400 if request body is invalid JSON", async () => {
    const request: MockRequest = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody?.error).toContain("Invalid JSON");
    expect(context.error).toHaveBeenCalled();
  });

  it("should return 400 if policyGroupId is missing", async () => {
    const { policyGroupId, ...rest } = validPolicyInput;
    const invalidInput = rest as Omit<CreatePolicyInput, "policyGroupId">;

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(invalidInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Missing required fields" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should return 400 if status is missing", async () => {
    const { status, ...rest } = validPolicyInput;
    const invalidInput = rest as Omit<CreatePolicyInput, "status">;

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(invalidInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Missing required fields" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should return 400 if effectiveDate is missing", async () => {
    const { effectiveDate, ...rest } = validPolicyInput;
    const invalidInput = rest as Omit<CreatePolicyInput, "effectiveDate">;
    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(invalidInput),
    };
    const context = createMockContext();
    const result = await registeredHandlers.createPolicy(request, context);
    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Missing required fields" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should return 400 if contentSections is missing", async () => {
    const { contentSections, ...rest } = validPolicyInput;
    const invalidInput = rest as Omit<CreatePolicyInput, "contentSections">;
    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(invalidInput),
    };
    const context = createMockContext();
    const result = await registeredHandlers.createPolicy(request, context);
    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Missing required fields" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should return 400 if availableScopes is missing", async () => {
    const { availableScopes, ...rest } = validPolicyInput;
    const invalidInput = rest as Omit<CreatePolicyInput, "availableScopes">;
    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(invalidInput),
    };
    const context = createMockContext();
    const result = await registeredHandlers.createPolicy(request, context);
    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Missing required fields" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterModule = await import("../shared/dataAdapter.js");
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("Database connection failed.")
    );

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(validPolicyInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle service error during policy creation", async () => {
    policyServiceMocks.createPolicy.mockRejectedValueOnce(
      new Error("Creation failed")
    );

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(validPolicyInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Creation failed" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in service error", async () => {
    policyServiceMocks.createPolicy.mockRejectedValueOnce("String error");

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue(validPolicyInput),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createPolicy(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Policy creation failed:" });
    expect(context.error).toHaveBeenCalled();
  });
});
