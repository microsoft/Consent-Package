import { describe, it, expect } from "vitest";
import { CosmosDBDataAdapter } from "../index.js";

describe("CosmosDB Data Adapter", () => {
  it("should export the CosmosDBDataAdapter class", () => {
    expect(CosmosDBDataAdapter).toBeDefined();
    expect(typeof CosmosDBDataAdapter).toBe("function");

    // Test constructor
    const adapter = new CosmosDBDataAdapter({
      endpoint: "test-endpoint",
      key: "test-key",
      databaseName: "test-db",
      containerName: "test-container",
    });

    expect(adapter).toBeInstanceOf(CosmosDBDataAdapter);
    expect(adapter.initialize).toBeDefined();
    expect(typeof adapter.initialize).toBe("function");
  });
});
