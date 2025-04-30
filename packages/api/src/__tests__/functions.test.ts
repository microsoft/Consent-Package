import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "@azure/functions";

vi.mock("@azure/functions", () => ({
  app: {
    http: vi.fn(),
  },
}));

vi.mock("../shared/dataAdapter.js", () => ({
  getInitializedDataAdapter: vi.fn().mockResolvedValue({
    getAllConsents: vi.fn().mockResolvedValue([
      { id: "test-consent-1", status: "granted" },
      { id: "test-consent-2", status: "revoked" },
    ]),
  }),
}));

vi.mock("@open-source-consent/core", () => ({
  ConsentService: vi.fn().mockImplementation(() => ({
    grantConsent: vi
      .fn()
      .mockResolvedValue({ id: "new-consent-id", status: "granted" }),
  })),
}));

describe("Azure Functions", () => {
  let registeredHandlers: Record<string, Function> = {};

  beforeEach(() => {
    registeredHandlers = {};
    vi.clearAllMocks();

    // Capture the registered HTTP handlers
    (app.http as any).mockImplementation((name: string, config: any) => {
      registeredHandlers[name] = config.handler;
    });

    // Reset modules and load functions to register handlers
    vi.resetModules();
  });

  describe("hello function, canary test", () => {
    beforeEach(async () => {
      await import("../functions/standalone.js");
    });

    it("should return greeting with default name", async () => {
      const request = {
        query: new Map(),
        url: "http://localhost/api/hello",
      };
      const context = { log: vi.fn() };

      const result = await registeredHandlers.hello(request, context);

      expect(result.body).toBe("Hello, world!");
    });

    it("should return greeting with provided name", async () => {
      const queryMap = new Map();
      queryMap.set("name", "Test");
      const request = {
        query: queryMap,
        url: "http://localhost/api/hello?name=Test",
      };
      const context = { log: vi.fn() };

      const result = await registeredHandlers.hello(request, context);

      expect(result.body).toBe("Hello, Test!");
    });
  });

  describe("getConsents function", () => {
    beforeEach(async () => {
      await import("../functions/getConsents.js");
    });

    it("should return consents when successful", async () => {
      const request = {};
      const context = { log: vi.fn() };

      const result = await registeredHandlers.getConsents(request, context);

      expect(result.jsonBody).toEqual([
        { id: "test-consent-1", status: "granted" },
        { id: "test-consent-2", status: "revoked" },
      ]);
    });

    it("should handle database initialization failure", async () => {
      const dataAdapterMock = await import("../shared/dataAdapter.js");
      (dataAdapterMock.getInitializedDataAdapter as any).mockRejectedValueOnce(
        new Error("DB connection failed")
      );

      const request = {};
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.getConsents(request, context);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({ error: "Database connection failed." });
      expect(context.error).toHaveBeenCalled();
    });

    it("should handle error when fetching consents", async () => {
      const dataAdapterMock = await import("../shared/dataAdapter.js");
      (dataAdapterMock.getInitializedDataAdapter as any).mockResolvedValueOnce({
        getAllConsents: vi
          .fn()
          .mockRejectedValue(new Error("Failed to fetch consents")),
      });

      const request = {};
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.getConsents(request, context);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({ error: "Failed to fetch consents" });
      expect(context.error).toHaveBeenCalled();
    });

    it("should handle non-Error object in error", async () => {
      const dataAdapterMock = await import("../shared/dataAdapter.js");
      (dataAdapterMock.getInitializedDataAdapter as any).mockResolvedValueOnce({
        getAllConsents: vi.fn().mockRejectedValue("String error"),
      });

      const request = {};
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.getConsents(request, context);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({ error: "Failed to retrieve consents" });
      expect(context.error).toHaveBeenCalled();
    });
  });

  describe("createConsent function", () => {
    beforeEach(async () => {
      await import("../functions/createConsent.js");
    });

    it("should create a consent when valid data is provided", async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          subjectId: "test-subject",
          policyId: "test-policy",
        }),
      };
      const context = { log: vi.fn() };

      const result = await registeredHandlers.createConsent(request, context);

      expect(result.jsonBody).toEqual({
        id: "new-consent-id",
        status: "granted",
      });
    });

    it("should handle database initialization failure", async () => {
      const dataAdapterMock = await import("../shared/dataAdapter.js");
      (dataAdapterMock.getInitializedDataAdapter as any).mockRejectedValueOnce(
        new Error("DB connection failed")
      );

      const request = {
        json: vi.fn().mockResolvedValue({
          subjectId: "test-subject",
          policyId: "test-policy",
        }),
      };
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.createConsent(request, context);

      expect(result.status).toBe(500);
      expect(result.jsonBody).toEqual({ error: "Database connection failed." });
      expect(context.error).toHaveBeenCalled();
    });

    it("should handle consent creation error", async () => {
      const consentServiceMock = await import("@open-source-consent/core");
      (consentServiceMock.ConsentService as any).mockImplementationOnce(() => ({
        grantConsent: vi
          .fn()
          .mockRejectedValue(new Error("Consent already modified")),
      }));

      const request = {
        json: vi.fn().mockResolvedValue({
          subjectId: "test-subject",
          policyId: "test-policy",
        }),
      };
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.createConsent(request, context);

      expect(result.status).toBe(409);
      expect(result.jsonBody).toEqual({ error: "Consent already modified" });
      expect(context.error).toHaveBeenCalled();
    });

    it("should handle invalid request body", async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      };
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.createConsent(request, context);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({ error: "Invalid JSON" });
      expect(context.error).toHaveBeenCalled();
    });

    it("should handle non-Error object in error", async () => {
      const consentServiceMock = await import("@open-source-consent/core");
      (consentServiceMock.ConsentService as any).mockImplementationOnce(() => ({
        grantConsent: vi.fn().mockRejectedValue("String error"),
      }));

      const request = {
        json: vi.fn().mockResolvedValue({
          subjectId: "test-subject",
          policyId: "test-policy",
        }),
      };
      const context = { log: vi.fn(), error: vi.fn() };

      const result = await registeredHandlers.createConsent(request, context);

      expect(result.status).toBe(400);
      expect(result.jsonBody).toEqual({ error: "Unknown error occurred" });
      expect(context.error).toHaveBeenCalled();
    });
  });
});
