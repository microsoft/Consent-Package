# API

## Endpoints

### Consents

*   **`POST /consents`**: Create a new consent record.
    *   Request Body: (`GrantConsentInput`)
    *   Response Body: `ConsentRecord`
*   **`GET /consents/{id}`**: Retrieve a specific consent record by ID.
    *   Path Parameters: `id` (string)
    *   Response Body: `ConsentRecord` or `null`/404
*   **`PATCH /consents/{id}`**: Update a consent record (e.g., revoke).
    *   Path Parameters: `id` (string)
    *   Request Body: (`RevokeConsentInput` or similar)
    *   Response Body: `ConsentRecord`

### Subjects

*   **`GET /subjects/{subjectId}/consents`**: Retrieve active consents for a specific subject.
    *   Path Parameters: `subjectId` (string)
    *   Query Parameters:
        *   `scope` (string, optional, repeatable): Filter consents by specific granted scopes.
    *   Response Body: `ConsentRecord[]`