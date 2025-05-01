import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockContext,
  type MockRequest,
  initializeTestEnvironment,
} from "./utils";

vi.mock("@azure/functions");
vi.mock("../shared/dataAdapter.js");
vi.mock("@open-source-consent/core");

describe("hello function", () => {
  let registeredHandlers: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const env = await initializeTestEnvironment(["../functions/standalone.js"]);
    registeredHandlers = env.registeredHandlers;
  });

  it("should return greeting with default name", async () => {
    const request: MockRequest = {
      query: new Map(),
      url: "http://localhost/api/hello",
    };
    const context = createMockContext();

    const result = await registeredHandlers.hello(request, context);

    expect(result.body).toBe("Hello, world!");
  });

  it("should return greeting with provided name", async () => {
    const queryMap = new Map();
    queryMap.set("name", "Test");
    const request: MockRequest = {
      query: queryMap,
      url: "http://localhost/api/hello?name=Test",
    };
    const context = createMockContext();

    const result = await registeredHandlers.hello(request, context);

    expect(result.body).toBe("Hello, Test!");
  });
});
