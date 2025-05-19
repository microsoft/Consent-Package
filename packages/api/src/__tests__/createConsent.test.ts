import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("createConsent function", () => {
  let registeredHandlers: Record<string, Function>;
  let consentServiceMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment([
      "../functions/createConsent.js",
    ]);
    registeredHandlers = env.registeredHandlers;
    consentServiceMocks = env.consentServiceMocks;
  });

  it("should create a consent when valid data is provided", async () => {
    const request: MockRequest = {
      json: vi.fn().mockResolvedValue({
        subjectId: "test-subject",
        policyId: "test-policy",
      }),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createConsent(request, context);

    expect(result.jsonBody).toEqual({
      id: "new-consent-id",
      status: "granted",
    });
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterModule = await import("../shared/dataAdapter.js");
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("Database connection failed.")
    );

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue({
        subjectId: "test-subject",
        policyId: "test-policy",
      }),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createConsent(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle consent creation error", async () => {
    consentServiceMocks.grantConsent.mockRejectedValueOnce(
      new Error("Consent already modified")
    );

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue({
        subjectId: "test-subject",
        policyId: "test-policy",
      }),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createConsent(request, context);

    expect(result.status).toBe(409);
    expect(result.jsonBody).toEqual({ error: "Consent already modified" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle invalid request body", async () => {
    const request: MockRequest = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createConsent(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Invalid JSON" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in error", async () => {
    const consentServiceMockModule = await import("@open-source-consent/core");
    (
      consentServiceMockModule.ConsentService.getInstance as any
    ).mockReturnValueOnce({
      ...consentServiceMocks,
      grantConsent: vi.fn().mockRejectedValue("String error"),
    });

    const request: MockRequest = {
      json: vi.fn().mockResolvedValue({
        subjectId: "test-subject",
        policyId: "test-policy",
      }),
    };
    const context = createMockContext();

    const result = await registeredHandlers.createConsent(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({
      error: "An error occurred while creating the consent.",
    });
    expect(context.error).toHaveBeenCalled();
  });
});
