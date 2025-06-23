# API Usage Examples

## API Package Setup

### Local Development Configuration

The API package is built on Azure Functions and requires specific configuration for local development:

```json
// packages/api/local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "CosmosDB_Endpoint": "https://localhost:8081",
    // Default publicly available key for the Cosmos DB emulator
    "CosmosDB_Key": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "CosmosDB_DatabaseName": "ConsentDB",
    "CORS_ORIGINS": "http://localhost:5173,http://localhost:3000",
    "NODE_TLS_REJECT_UNAUTHORIZED": "0"
  }
}
```

### Service Integration

The API package uses dependency injection to connect data adapters with business logic services:

```typescript
// Example of how the API package integrates services
import { CosmosDBAdapter } from '@open-source-consent/data-adapter-cosmosdb';
import { ConsentService } from '@open-source-consent/core';

// Initialize the data adapter with your configuration
const cosmosAdapter = new CosmosDBAdapter({
  endpoint: process.env.CosmosDB_Endpoint!,
  key: process.env.CosmosDB_Key!,
  databaseName: process.env.CosmosDB_DatabaseName!,
});

// The service handles all business logic
export const consentService = new ConsentService(cosmosAdapter);
```

### Production Deployment

For production deployment, the API package follows standard Azure Functions deployment patterns. You'll need to:

1. **Configure Application Settings**: Set environment variables for your Cosmos DB connection, CORS origins, and other configuration
2. **Deploy the Function App**: Use Azure CLI, Visual Studio Code, or your preferred deployment method
3. **Configure Security**: Set up authentication and authorization according to your requirements

The API package provides the foundation but doesn't dictate specific deployment strategies, allowing you to integrate with your existing infrastructure and security requirements.

## Data Adapter Configuration

### Cosmos DB Setup

#### Database Configuration

The system requires specific containers with appropriate partition keys for optimal performance:

```typescript
// Database schema requirements
const requiredContainers = [
  {
    name: 'consentRecords',
    partitionKey: '/subjectId',  // Partitioned by subject for efficient queries
    description: 'Stores all consent records with full audit history'
  },
  {
    name: 'policies', 
    partitionKey: '/policyGroupId',  // Partitioned by policy group
    description: 'Stores policy definitions and versions'
  }
];
```

#### Adapter Configuration

The Cosmos DB adapter can be configured for different environments:

```typescript
import { CosmosDBAdapter } from '@open-source-consent/data-adapter-cosmosdb';

// Basic configuration
const cosmosAdapter = new CosmosDBAdapter({
  endpoint: 'your-cosmos-endpoint',
  key: 'your-access-key', 
  databaseName: 'ConsentDB'
});

// Advanced configuration with connection policies
const cosmosAdapterAdvanced = new CosmosDBAdapter({
  endpoint: 'your-cosmos-endpoint',
  key: 'your-access-key',
  databaseName: 'ConsentDB',
  connectionPolicy: {
    requestTimeout: 30000,
    retryOptions: {
      maxRetryAttemptCount: 3,
      fixedRetryIntervalInMilliseconds: 1000,
    },
  },
});
```

#### Infrastructure Considerations

When setting up Cosmos DB for the consent package, consider:
- **Throughput**: Start with 400 RU/s per container for development, scale based on usage
- **Consistency**: Session consistency is typically sufficient for consent management
- **Backup**: Configure automatic backups for compliance requirements
- **Security**: Use managed identity or secure key management for production

The package abstracts database interactions through the adapter pattern, so you can configure your Cosmos DB instance according to your organization's standards while the application code remains unchanged.

### Alternative Storage with IndexedDB

For development, testing, or offline scenarios, you can use the IndexedDB adapter:

```typescript
import { IndexedDBAdapter } from '@open-source-consent/data-adapter-indexeddb';
import { ConsentService } from '@open-source-consent/core';

// Browser-based storage for local development
const indexedDBAdapter = new IndexedDBAdapter('ConsentDB');

// Use the same service interface
const consentService = new ConsentService(indexedDBAdapter);
```

This is particularly useful for:
- Local development without requiring Cosmos DB setup
- Testing scenarios
- Offline-capable applications
- Proof-of-concept implementations

## Environment-Specific Configuration

The package supports different configurations for various environments:

```typescript
// config/database.ts
import { CosmosDBAdapter } from '@open-source-consent/data-adapter-cosmosdb';
import { IndexedDBAdapter } from '@open-source-consent/data-adapter-indexeddb';

export function createDataAdapter() {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return new CosmosDBAdapter({
        endpoint: process.env.COSMOSDB_ENDPOINT!,
        key: process.env.COSMOSDB_KEY!,
        databaseName: process.env.COSMOSDB_DATABASE_NAME!,
      });
    
    case 'development':
      // Use IndexedDB for local development
      return new IndexedDBAdapter('ConsentDB-Dev');
    
    default:
      // Cosmos DB emulator for integration testing
      return new CosmosDBAdapter({
        endpoint: 'https://localhost:8081',
        // Default publicly available key for the Cosmos DB emulator
        key: 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
        databaseName: 'ConsentDB',
      });
  }
}
```

## Service Usage Examples

### Consent Service

```typescript
import { ConsentService } from '@open-source-consent/core';
import { createDataAdapter } from './config/database';

const dataAdapter = createDataAdapter();
const consentService = new ConsentService(dataAdapter);

// Grant consent
export async function grantConsent(consentData: CreateConsentInput) {
  try {
    const result = await consentService.grantConsent(consentData);
    return { status: 201, data: result };
  } catch (error) {
    return { status: 400, error: error.message };
  }
}

// Revoke consent
export async function revokeConsent(consentId: string, expectedVersion: number) {
  try {
    const result = await consentService.revokeConsent(consentId, expectedVersion);
    return { status: 200, data: result };
  } catch (error) {
    return { status: 400, error: error.message };
  }
}

// Get consent by subject
export async function getConsentsBySubject(subjectId: string) {
  try {
    const consents = await consentService.getConsentsBySubject(subjectId);
    return { status: 200, data: consents };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}
```

### Policy Service

```typescript
import { PolicyService } from '@open-source-consent/core';
import { createDataAdapter } from './config/database';

const dataAdapter = createDataAdapter();
const policyService = new PolicyService(dataAdapter);

// Create a new policy
export async function createPolicy(policyData: CreatePolicyInput) {
  try {
    const result = await policyService.createPolicy(policyData);
    return { status: 201, data: result };
  } catch (error) {
    return { status: 400, error: error.message };
  }
}

// Get latest active policy
export async function getLatestPolicy(policyGroupId: string) {
  try {
    const policy = await policyService.getLatestActivePolicyByGroupId(policyGroupId);
    return { status: 200, data: policy };
  } catch (error) {
    return { status: 404, error: 'Policy not found' };
  }
}
```

## Azure Functions Integration

### Function Structure

```typescript
// functions/createConsent.ts
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ConsentService } from '@open-source-consent/core';
import { createDataAdapter } from '../config/database';

const consentService = new ConsentService(createDataAdapter());

export async function createConsentHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const result = await consentService.grantConsent(body);
    
    return {
      status: 201,
      jsonBody: result,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*'
      }
    };
  } catch (error) {
    context.error('Error creating consent:', error);
    return {
      status: 400,
      jsonBody: { error: error.message }
    };
  }
}

app.http('createConsent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'consent',
  handler: createConsentHandler,
});
```

### Adding Middleware

The API package supports a central middleware configuration system. Consumers can register middleware without modifying the library source code:

```typescript
// In your application startup/configuration file
import { middlewareRegistry, type Middleware } from '@open-source-consent/api';

// Define your authentication middleware
const authMiddleware: Middleware = async (request, context, next) => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      status: 401,
      jsonBody: { error: 'Authorization required' }
    };
  }

  const token = authHeader.replace('Bearer ', '');
  if (!await validateToken(token)) {
    return {
      status: 401,
      jsonBody: { error: 'Invalid token' }
    };
  }

  return next();
};

// Apply middleware globally to all endpoints
middlewareRegistry.addGlobalMiddleware(authMiddleware);

// Or apply middleware to specific endpoints only
middlewareRegistry.addEndpointMiddleware('getConsentById', authMiddleware);
middlewareRegistry.addEndpointMiddleware('createConsent', authMiddleware);
```

That's it! The existing API functions will automatically use the registered middleware without any code changes to the library.

### Error Handling

```typescript
// shared/errorHandler.ts
export interface ErrorHandlingOptions {
  defaultStatus?: number;
  defaultMessage?: string;
  customErrorMap?: Array<{
    check: (error: any) => boolean;
    status: number;
    message: string;
    useActualErrorMessage?: boolean;
  }>;
}

export function handleError(
  context: InvocationContext,
  error: any,
  logPrefix: string,
  options: ErrorHandlingOptions = {}
): HttpResponseInit {
  context.error(logPrefix, error);

  // Check for custom error mappings
  if (options.customErrorMap) {
    for (const mapping of options.customErrorMap) {
      if (mapping.check(error)) {
        return {
          status: mapping.status,
          jsonBody: {
            error: mapping.useActualErrorMessage ? error.message : mapping.message
          }
        };
      }
    }
  }

  return {
    status: options.defaultStatus || 500,
    jsonBody: {
      error: options.defaultMessage || 'An unexpected error occurred'
    }
  };
}
```

## Testing

### Unit Testing Services

```typescript
// __tests__/consentService.test.ts
import { ConsentService } from '@open-source-consent/core';
import { IndexedDBAdapter } from '@open-source-consent/data-adapter-indexeddb';

describe('ConsentService', () => {
  let consentService: ConsentService;
  let dataAdapter: IndexedDBAdapter;

  beforeEach(() => {
    dataAdapter = new IndexedDBAdapter('TestDB');
    consentService = new ConsentService(dataAdapter);
  });

  it('should grant consent successfully', async () => {
    const consentData = {
      subjectId: 'test-subject',
      policyId: 'test-policy',
      consenter: {
        type: 'self' as const,
        userId: 'test-user'
      },
      grantedScopes: ['data-scope-1'],
      metadata: {
        consentMethod: 'digital_form' as const,
        ipAddress: '127.0.0.1'
      }
    };

    const result = await consentService.grantConsent(consentData);
    
    expect(result.status).toBe('granted');
    expect(result.subjectId).toBe('test-subject');
    expect(result.version).toBe(1);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/api.test.ts
import { createDataAdapter } from '../../config/database';
import { ConsentService } from '@open-source-consent/core';

describe('API Integration Tests', () => {
  let consentService: ConsentService;

  beforeAll(() => {
    // Use IndexedDB for integration tests
    process.env.NODE_ENV = 'test';
    const dataAdapter = createDataAdapter();
    consentService = new ConsentService(dataAdapter);
  });

  it('should handle the complete consent flow', async () => {
    // Create a policy first
    // Grant consent
    // Verify consent
    // Revoke consent
    // Verify revocation
  });
}); 