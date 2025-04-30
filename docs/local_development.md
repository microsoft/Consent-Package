# Local Development

## Prerequisites

1. Node.js >= 18.0.0
2. PNPM >= 8.0.0
3. Azure Functions Core Tools v4.x

   ```bash
   # For macOS:
   brew tap azure/functions
   brew install azure-functions-core-tools@4
   ```

4. Docker

## Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/open-source-consent-package.git
   cd open-source-consent-package
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm build
   ```

## Running Local Development Environment

### 1. Start Cosmos DB Emulator

1. Start the Cosmos DB Emulator

   ```bash
   # For macOS
   # as of April 2025, the vnext-preview
   # version is needed with M2 and newer macs
   docker run \
    --publish 8081:8081 \
    --publish 1234:1234 \
    --name cosmosdb-emulator \
    --detach \
    mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
   ```

2. The emulator runs at `https://localhost:8081`
3. You should be able to see the dashboard at `https://localhost:1234`
4. Default key is provided in the emulator dashboard

### 2. Start Azure Functions

1. Navigate to the API package:

   ```bash
   cd packages/api
   ```

2. Create a `local.settings.json`:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "CosmosDB_Endpoint": "https://localhost:8081",
       "CosmosDB_DatabaseName": "ConsentDB",
       "CORS_ORIGINS": "http://localhost:5173",
       "NODE_TLS_REJECT_UNAUTHORIZED": "0"
     }
   }
   ```

3. Start the function app:

   ```bash
   pnpm start
   ```

   Functions will be available at `http://localhost:7071`

### 3. Start Debug UI

1. Navigate to the UI package:

   ```bash
   cd packages/ui
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

   The UI will be available at `http://localhost:5173`

## Project Structure

```markdown
packages/
  ├── core/              # Core business logic and types
  ├── types/    # Relevant types and interfaces
  ├── data-adapter-cosmosdb/     # Cosmos DB implementation
  ├── api/               # Azure Functions API
  └── ui/               # Currently just a Debug UI
```

More details on the project structure can be found in the [Architecture](./architecture.md) document.

## Development Workflow

1. Make changes to the core packages
2. Run `pnpm build` to rebuild all packages
3. Start the local development environment as described above
4. Use the debug UI to test your changes

## Common Issues

1. **CORS Issues**: Ensure the CORS_ORIGINS in `local.settings.json` matches your UI origin

2. **Port Conflicts**: Default ports used:
   - UI: 5173
   - Functions: 7071
   - Cosmos DB Emulator: 8081

3. **Azure Functions Core Tools Not Found**: If you see "func command not found" or similar:

   ```bash
   # For macOS:
   brew unlink azure-functions-core-tools@4 && brew link azure-functions-core-tools@4
   ```
