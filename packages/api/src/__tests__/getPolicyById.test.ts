import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("getPolicyById function", () => {
  let registeredHandlers: Record<string, Function>;
  let policyServiceMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env: any = await initializeTestEnvironment([
      "../functions/getPolicyById.js",
    ]);
    registeredHandlers = env.registeredHandlers;
    policyServiceMocks = env.policyServiceMocks;
  });

  it("should return a policy when a valid policyId is provided", async () => {
    const mockPolicy = { id: "test-policy-id", content: "Policy Content" };
    policyServiceMocks.getPolicyById.mockResolvedValue(mockPolicy);

    const request: MockRequest = {
      params: { policyId: "test-policy-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(200);
    expect(result.jsonBody).toEqual(mockPolicy);
    expect(policyServiceMocks.getPolicyById).toHaveBeenCalledWith(
      "test-policy-id"
    );
  });

  it("should return 404 if policy is not found", async () => {
    policyServiceMocks.getPolicyById.mockResolvedValue(null);

    const request: MockRequest = {
      params: { policyId: "non-existent-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(404);
    expect(result.jsonBody).toEqual({
      error: "Policy with ID 'non-existent-id' not found.",
    });
  });

  it("should return 400 if policyId is not provided", async () => {
    const request: MockRequest = {
      params: {}, // policyId is missing
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Policy ID is required" });
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterModule = await import("../shared/dataAdapter.js");
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("Database connection failed.")
    );

    const request: MockRequest = {
      params: { policyId: "test-policy-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle service error when retrieving policy", async () => {
    policyServiceMocks.getPolicyById.mockRejectedValueOnce(
      new Error("Service unavailable")
    );

    const request: MockRequest = {
      params: { policyId: "test-policy-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Service unavailable" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in service error", async () => {
    policyServiceMocks.getPolicyById.mockRejectedValueOnce("String error");

    const request: MockRequest = {
      params: { policyId: "test-policy-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getPolicyById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: "An internal server error occurred.",
    });
    expect(context.error).toHaveBeenCalled();
  });
});
