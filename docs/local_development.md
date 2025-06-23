# Local Development

## Prerequisites

1. **Node.js >= 20.0.0**
2. **PNPM >= 10.0.0**
3. **Azure Functions Core Tools v4.x**

   ```bash
   # For macOS:
   brew tap azure/functions
   brew install azure-functions-core-tools@4
   ```

   ```bash
   # For Linux:
   curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
   sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
   
   # Ubuntu
   sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-$(lsb_release -cs 2>/dev/null)-prod $(lsb_release -cs 2>/dev/null) main" > /etc/apt/sources.list.d/dotnetdev.list'
   
   # Debian
   sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/debian/$(lsb_release -rs 2>/dev/null | cut -d'.' -f 1)/prod $(lsb_release -cs 2>/dev/null) main" > /etc/apt/sources.list.d/dotnetdev.list'
   
   sudo apt-get update
   sudo apt-get install azure-functions-core-tools-4
   ```

   ```bash
   # For Windows:
   # Option 1 (Recommended):
   # Install using Azure Functions Core Tools installer
   
   # Option 2: Using winget (using PowerShell as Administrator)
   winget install Microsoft.AzureFunctionsCoreTools

   # Option 3: Using npm
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

   More information is available in [Microsoft's "Develop Azure Functions locally using Core Tools" docs](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-typescript).

4. **Docker** (for Cosmos DB Emulator)

## Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/microsoft/open-source-consent-package.git
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
   # For macOS/Linux (using Docker)
   # The vnext-preview version is needed for M2 and newer Macs
   docker run \
    --publish 8081:8081 \
    --publish 1234:1234 \
    --name cosmosdb-emulator \
    --detach \
    mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
   ```

2. The emulator runs at `https://localhost:8081`
3. You can access the dashboard at `https://localhost:1234`
4. Default key is provided in the emulator dashboard

### 2. Start Azure Functions API

1. Navigate to the API package:

   ```bash
   cd packages/api
   ```

2. The API package includes a `local.settings.json` file with default configuration:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "CosmosDB_Endpoint": "https://localhost:8081",
       // Default publicly available key for the Cosmos DB emulator
       "CosmosDB_Key": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
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

### 3. Start Demo Application

1. Navigate to the demo package:

   ```bash
   cd packages/demo
   ```

2. Start the development server:

   ```bash
   pnpm dev:local
   ```

   The demo application will be available at `http://localhost:5173`

## Project Structure

```
packages/
  ├── types/             # Shared TypeScript types and interfaces
  ├── core/              # Core business logic and services
  ├── data-adapter-cosmosdb/   # Cosmos DB implementation
  ├── data-adapter-indexeddb/  # IndexedDB implementation
  ├── api/               # Azure Functions API
  ├── ui/                # React component library
  └── demo/              # Demo application
```

More details on the project structure can be found in the [Architecture](./architecture.md) document.

## Development Workflow

1. Make changes to packages
2. Run `pnpm build` from the root to rebuild all packages
3. Start the local development environment as described above
4. Use the demo application to test your changes

## Available Scripts

From the root directory:

- `pnpm build` - Build all packages
- `pnpm test` - Run tests for core packages with coverage
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm lint:fix` - Fix ESLint and Prettier issues automatically
- `pnpm dev` - Start development servers for all packages in parallel
- `pnpm clean` - Clean all build artifacts

## Common Issues

1. **CORS Issues**: Ensure the `CORS_ORIGINS` in `local.settings.json` matches your demo app origin

2. **Port Conflicts**: Default ports used:
   - Demo app: 5173
   - Azure Functions: 7071
   - Cosmos DB Emulator: 8081
   - Cosmos DB Dashboard: 1234

3. **Azure Functions Core Tools Not Found**: If you see "func command not found" or similar:

   ```bash
   # For macOS:
   brew unlink azure-functions-core-tools@4 && brew link azure-functions-core-tools@4
   ```

4. **Node.js Version**: Ensure you're using Node.js >= 20.0.0. The project uses modern JavaScript features.

5. **PNPM Version**: Ensure you're using PNPM >= 10.0.0 for proper workspace support.

## Testing

Run tests with coverage:

```bash
pnpm test
```

This runs tests for the core packages (api, core, data-adapter-cosmosdb, data-adapter-indexeddb) with coverage reporting.

## Linting and Formatting

The project uses ESLint and Prettier for code quality:

```bash
# Check for issues
pnpm lint

# Fix issues automatically
pnpm lint:fix
```
