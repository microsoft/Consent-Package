import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockContext, initializeTestEnvironment } from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("getConsents function", () => {
  let registeredHandlers: Record<string, Function>;
  let dataAdapterMocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment([
      "../functions/getConsents.js",
    ]);
    registeredHandlers = env.registeredHandlers;
    dataAdapterMocks = env.dataAdapter;
  });

  it("should return consents when successful", async () => {
    const request = {};
    const context = createMockContext();

    const result = await registeredHandlers.getConsents(request, context);

    expect(result.jsonBody).toEqual([
      { id: "test-consent-1", status: "granted" },
      { id: "test-consent-2", status: "revoked" },
    ]);
  });

  it("should handle database initialization failure", async () => {
    const dataAdapterModule = await import("../shared/dataAdapter.js");
    (dataAdapterModule.getInitializedDataAdapter as any).mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const request = {};
    const context = createMockContext();

    const result = await registeredHandlers.getConsents(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Database connection failed." });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle error when fetching consents", async () => {
    dataAdapterMocks.getAllConsents.mockRejectedValueOnce(
      new Error("Failed to fetch consents")
    );

    const request = {};
    const context = createMockContext();

    const result = await registeredHandlers.getConsents(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Failed to fetch consents" });
    expect(context.error).toHaveBeenCalled();
  });

  it("should handle non-Error object in error", async () => {
    dataAdapterMocks.getAllConsents.mockRejectedValueOnce("String error");

    const request = {};
    const context = createMockContext();

    const result = await registeredHandlers.getConsents(request, context);

    expect(result.status).toBe(500);
    expect(result.jsonBody).toEqual({ error: "Failed to retrieve consents" });
    expect(context.error).toHaveBeenCalled();
  });
});
