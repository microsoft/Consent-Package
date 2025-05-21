import {
  createPolicy,
  listPolicies,
  getPolicyById,
  getLatestActivePolicyByGroupId,
  getAllPolicyVersionsByGroupId,
  createConsent,
  getConsentById,
  findActiveConsentsBySubject,
} from "./index.js";

export async function getRequestBody(init?: RequestInit): Promise<any> {
  if (init?.body) {
    try {
      if (typeof init.body === "string") {
        return JSON.parse(init.body);
      } else if (init.body instanceof ReadableStream) {
        const reader = init.body.getReader();
        let chunks = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks += new TextDecoder().decode(value);
        }
        return JSON.parse(chunks);
      }
    } catch (error) {
      console.error("[Mock API] Error parsing request body:", error);
      return null;
    }
  }
  return null;
}

export function createJsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function createErrorResponse(message: string, status: number): Response {
  return createJsonResponse({ message }, status);
}

export const routes = [
  {
    method: "POST",
    pathRegex: /\/api\/policies$/,
    handler: async (init?: RequestInit): Promise<Response> => {
      const body = await getRequestBody(init);
      const data = await createPolicy(body);
      return createJsonResponse(data, 201);
    },
  },
  {
    method: "GET",
    pathRegex: /\/api\/policies$/,
    handler: async (): Promise<Response> => {
      const data = await listPolicies();
      return createJsonResponse(data, 200);
    },
  },
  {
    method: "GET",
    pathRegex: /\/api\/policies\/([^/]+)$/,
    handler: async (
      _init?: RequestInit,
      matches?: RegExpMatchArray
    ): Promise<Response> => {
      if (matches && matches[1]) {
        const policyId = matches[1];
        const data = await getPolicyById(policyId);
        return data
          ? createJsonResponse(data, 200)
          : createErrorResponse("Policy not found", 404);
      }
      return createErrorResponse("Invalid policy ID", 400);
    },
  },
  {
    method: "GET",
    pathRegex: /\/api\/policyGroups\/([^/]+)\/latest$/,
    handler: async (
      _init?: RequestInit,
      matches?: RegExpMatchArray
    ): Promise<Response> => {
      if (matches && matches[1]) {
        const policyGroupId = matches[1];
        const data = await getLatestActivePolicyByGroupId(policyGroupId);
        return data
          ? createJsonResponse(data, 200)
          : createErrorResponse("Policy not found for group", 404);
      }
      return createErrorResponse("Invalid policy group ID", 400);
    },
  },
  {
    method: "GET",
    pathRegex: /\/api\/policyGroups\/([^/]+)\/versions$/,
    handler: async (
      _init?: RequestInit,
      matches?: RegExpMatchArray
    ): Promise<Response> => {
      if (matches && matches[1]) {
        const policyGroupId = matches[1];
        const data = await getAllPolicyVersionsByGroupId(policyGroupId);
        return createJsonResponse(data, 200);
      }
      return createErrorResponse("Invalid policy group ID", 400);
    },
  },
  {
    method: "POST",
    pathRegex: /\/consents$/,
    handler: async (init?: RequestInit): Promise<Response> => {
      const body = await getRequestBody(init);
      const data = await createConsent(body);
      return createJsonResponse(data, 201);
    },
  },
  {
    method: "GET",
    pathRegex: /\/consents\/([^/]+)$/,
    handler: async (
      _init?: RequestInit,
      matches?: RegExpMatchArray
    ): Promise<Response> => {
      if (matches && matches[1]) {
        const consentId = matches[1];
        const data = await getConsentById(consentId);
        return data
          ? createJsonResponse(data, 200)
          : createErrorResponse("Consent not found", 404);
      }
      return createErrorResponse("Invalid consent ID", 400);
    },
  },
  {
    method: "GET",
    pathRegex: /\/subjects\/([^/]+)\/consents$/,
    handler: async (
      _init?: RequestInit,
      matches?: RegExpMatchArray
    ): Promise<Response> => {
      if (matches && matches[1]) {
        const subjectId = matches[1];
        const data = await findActiveConsentsBySubject(subjectId);
        return createJsonResponse(data, 200);
      }
      return createErrorResponse("Invalid subject ID", 400);
    },
  },
];
