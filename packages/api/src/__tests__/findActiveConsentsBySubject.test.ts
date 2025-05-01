import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("findActiveConsentsBySubject function", () => {
  let registeredHandlers: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment([
      "../functions/findActiveConsentsBySubject.js",
    ]);
    registeredHandlers = env.registeredHandlers;
  });

  it("should return active consents when valid subject ID is provided", async () => {
    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.jsonBody).toEqual([
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
    ]);
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterMock = await import("../shared/dataAdapter.js");
    (dataAdapterMock.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };
    const context = createMockContext();

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
    const context = createMockContext();

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({ error: "Subject ID is required" });
  });

  it("should return empty array when no active consents are found", async () => {
    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/empty-subject",
      params: { subjectId: "empty-subject" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.jsonBody).toEqual([]);
  });

  it("should handle error when retrieving active consents", async () => {
    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/error-subject",
      params: { subjectId: "error-subject" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({
      error: "Failed to retrieve active consents",
    });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in error", async () => {
    const consentServiceMock = await import("@open-source-consent/core");
    (consentServiceMock.ConsentService as any).mockImplementationOnce(() => ({
      findActiveConsentsBySubject: vi.fn().mockRejectedValue("String error"),
    }));

    const request: MockRequest = {
      url: "http://localhost/api/consent/subject/test-subject-id",
      params: { subjectId: "test-subject-id" },
    };
    const context = createMockContext();

    const result = await registeredHandlers.findActiveConsentsBySubject(
      request,
      context
    );

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Unknown error occurred" });
    expect(context.error).toHaveBeenCalled();
  });
});
