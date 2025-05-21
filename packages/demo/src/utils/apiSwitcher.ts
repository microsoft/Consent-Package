import { routes, createErrorResponse } from "@open-source-consent/api/mock";

function shouldUseMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === "true";
}

async function mockFetchInternal(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let urlString: string;
  if (typeof input === "string") {
    urlString = input;
  } else if (input instanceof URL) {
    urlString = input.href;
  } else {
    urlString = input.url;
  }
  const method = init?.method?.toUpperCase() || "GET";

  try {
    for (const route of routes) {
      const matches = urlString.match(route.pathRegex);
      if (route.method === method && matches) {
        return await route.handler(init, matches);
      }
    }

    console.warn(`[Mock API] No mock handler for ${method} ${urlString}.`);
    return createErrorResponse(
      `Mock API endpoint not found: ${method} ${urlString}`,
      404
    );
  } catch (e) {
    const error = e as Error;
    console.error(
      `[Mock API] Error processing ${method} ${urlString}:`,
      error.message
    );
    return createErrorResponse(
      error.message || "Error processing mock request",
      500
    );
  }
}

if (shouldUseMockApi()) {
  (window as any).fetch = mockFetchInternal;
}
