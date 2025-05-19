import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("getConsentById function", () => {
  let registeredHandlers: Record<string, Function>;
  let consentServiceMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment([
      "../functions/getConsentById.js",
    ]);
    registeredHandlers = env.registeredHandlers;
    consentServiceMocks = env.consentServiceMocks;
  });

  it("should return consent when valid ID is provided", async () => {
    const request: MockRequest = {
      url: "http://localhost/api/consent/test-consent-id",
      params: { id: "test-consent-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.jsonBody).toEqual({
      id: "test-consent-id",
      status: "granted",
    });
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterMock = await import("../shared/dataAdapter.js");
    (dataAdapterMock.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("Database connection failed.")
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/test-consent-id",
      params: { id: "test-consent-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle missing ID parameter", async () => {
    const request: MockRequest = {
      params: {},
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Consent ID is required" });
  });

  it("should return 404 when consent is not found", async () => {
    const request: MockRequest = {
      params: { id: "not-found" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.status).toBe(404);
    expect(result.jsonBody).toEqual({ error: "Consent record not found" });
  });

  it("should handle error when retrieving consent", async () => {
    const request: MockRequest = {
      url: "http://localhost/api/consent/error-id",
      params: { id: "error-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: "Failed to retrieve consent",
    });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in error", async () => {
    const consentServiceMockModule = await import("@open-source-consent/core");
    (
      consentServiceMockModule.ConsentService.getInstance as vi.Mock
    ).mockReturnValueOnce({
      ...consentServiceMocks,
      getConsentDetails: vi.fn().mockRejectedValue("String error"),
    });

    const request: MockRequest = {
      url: "http://localhost/api/consent/test-consent-id",
      params: { id: "test-consent-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.getConsentById(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: "An error occurred while retrieving the consent record.",
    });
    expect(context.error).toHaveBeenCalled();
  });
});
