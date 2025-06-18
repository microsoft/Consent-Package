# API

## Endpoints

### Consents

- **`POST /api/consent`**: Create a new consent record.
  - Request Body: `CreateConsentInput`
  - Response Body: `ConsentRecord` (Status 201)

- **`GET /api/consent/{id}`**: Retrieve a specific consent record by ID.
  - Path Parameters: `id` (string)
  - Response Body: `ConsentRecord` or 404

- **`GET /api/consents/subject/{subjectId}/latest-versions`**: Retrieve the latest version of each consent for a specific subject.
  - Path Parameters: `subjectId` (string)
  - Response Body: `ConsentRecord[]`

- **`GET /api/proxies/{proxyId}/consents`**: Retrieve consents where the specified user is acting as a proxy.
  - Path Parameters: `proxyId` (string)
  - Response Body: `ConsentRecord[]`

### Policies

- **`POST /api/policies`**: Create a new policy version.
  - Request Body: `CreatePolicyInput`
    - The `contentSections` array within the request body should contain objects with `title`, `description`, and `content`. The `content` field accepts HTML and is sanitized by the API.
  - Response Body: `Policy` (Status 201)

- **`GET /api/policies`**: List all policy versions.
  - Response Body: `Policy[]`

- **`GET /api/policies/{policyId}`**: Retrieve a specific policy version by ID.
  - Path Parameters: `policyId` (string)
  - Response Body: `Policy` or 404

- **`GET /api/policyGroups/{policyGroupId}/latest`**: Retrieve the latest *active* policy version for a specific policy group.
  - Path Parameters: `policyGroupId` (string)
  - Response Body: `Policy` or 404

- **`GET /api/policyGroups/{policyGroupId}/versions`**: Retrieve all policy versions for a specific policy group, sorted by version ascending.
  - Path Parameters: `policyGroupId` (string)
  - Response Body: `Policy[]`
