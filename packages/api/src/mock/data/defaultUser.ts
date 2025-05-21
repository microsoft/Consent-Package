import type { ProfileData } from "@open-source-consent/ui"; // Assuming ProfileData is the shape we want

export const defaultMockUser: ProfileData = {
  id: "mock-user-123",
  name: "Mock User [Client-Side]",
  email: "mock.user@example.com",
  role: {
    id: "self",
    label: "Myself",
  },
  consents: [
    {
      id: "mock-consent-1",
      policy: {
        id: "sample-policy-1", // Matches the default policy ID
        label: "Open Source Consent Policy (Mocked Consent)",
      },
      status: {
        id: "granted",
        label: "Scopes Allowed",
      },
      scopes: [{ id: "basic_profile", label: "Basic Information" }],
    },
  ],
  managedSubjects: [],
};
