# API

## Endpoints

### Consents

*   **`POST /consents`**: Create a new consent record.
    *   Request Body: (`CreateConsentInput`)
    *   Response Body: `ConsentRecord`
*   **`GET /consents/{id}`**: Retrieve a specific consent record by ID.
    *   Path Parameters: `id` (string)
    *   Response Body: `ConsentRecord` or `null`/404

### Subjects

*   **`GET /subjects/{subjectId}/consents`**: Retrieve active consents for a specific subject.
    *   Path Parameters: `subjectId` (string)
    *   Query Parameters:
        *   `scope` (string, optional, repeatable): Filter consents by specific granted scopes.
    *   Response Body: `ConsentRecord[]`

### Policies

*   **`POST /api/policies`**: Create a new policy version.
    *   Request Body: (`CreatePolicyInput`)
        *   The `contentSections` array within the request body should contain objects with `title`, `description`, and `content`. The `content` field accepts HTML and is sanitized by the API.
    *   Response Body: `Policy` (Status 201)
*   **`GET /api/policies`**: List all policy versions.
    *   Response Body: `Policy[]`
*   **`GET /api/policies/{policyId}`**: Retrieve a specific policy version by ID.
    *   Path Parameters: `policyId` (string)
    *   Response Body: `Policy` or 404
*   **`GET /api/policyGroups/{policyGroupId}/latest`**: Retrieve the latest *active* policy version for a specific policy group.
    *   Path Parameters: `policyGroupId` (string)
    *   Response Body: `Policy` or 404
*   **`GET /api/policyGroups/{policyGroupId}/versions`**: Retrieve all policy versions for a specific policy group, sorted by version ascending.
    *   Path Parameters: `policyGroupId` (string)
    *   Response Body: `Policy[]`