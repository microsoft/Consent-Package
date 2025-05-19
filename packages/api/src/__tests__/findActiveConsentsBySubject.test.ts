import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
  type MockContext,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");

describe("findActiveConsentsBySubject function", () => {
  let registeredHandlers: Record<string, Function>;
  let consentServiceMocks: any;
  let context: MockContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment([
      "../functions/findActiveConsentsBySubject.ts",
    ]);
    registeredHandlers = env.registeredHandlers;
    consentServiceMocks = env.consentServiceMocks;
    context = createMockContext();
  });

  it("should return active consents when valid subject ID is provided", async () => {
    const expectedConsents = [
      {
        id: "active-consent-1",
        status: "granted",
        subjectId: "test-subject-id",
      },
      {
        id: "active-consent-2",
        status: "granted",
        subjectId: "test-subject-id",
      },
    ];
    consentServiceMocks.getLatestConsentVersionsForSubject.mockResolvedValue(
      expectedConsents
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.jsonBody).toEqual(expectedConsents);
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterMockModule = await import("../shared/dataAdapter.js");
    (
      dataAdapterMockModule.getInitializedDataAdapter as any
    ).mockRejectedValueOnce(new Error("Database connection failed."));

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };

    consentServiceMocks.getLatestConsentVersionsForSubject.mockResolvedValue(
      []
    );

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle missing subject ID parameter", async () => {
    const request: MockRequest = {
      params: {},
    };

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Subject ID is required" });
  });

  it("should return empty array when no active consents are found", async () => {
    consentServiceMocks.getLatestConsentVersionsForSubject.mockResolvedValue(
      []
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/empty-subject",
      params: { subjectId: "empty-subject" },
    };

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.jsonBody).toEqual([]);
  });

  it("should handle error when retrieving active consents", async () => {
    const errorMessage = "Failed to retrieve active consents";
    consentServiceMocks.getLatestConsentVersionsForSubject.mockRejectedValue(
      new Error(errorMessage)
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/error-subject",
      params: { subjectId: "error-subject" },
    };

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: errorMessage,
    });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in error", async () => {
    consentServiceMocks.getLatestConsentVersionsForSubject.mockRejectedValue(
      "String error"
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: "An error occurred while retrieving consent versions for subject.",
    });
    expect(context.error).toHaveBeenCalled();
  });
});
