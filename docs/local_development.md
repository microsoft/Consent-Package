# Local Development Guide

This guide will help you set up your local development environment for the Open Source Consent Package.

## Prerequisites

1. Node.js >= 18.0.0
2. PNPM >= 8.0.0
3. Azure Functions Core Tools v4.x
   ```bash
   # For macOS:
   brew tap azure/functions
   brew install azure-functions-core-tools@4

   # For Windows:
   npm i -g azure-functions-core-tools@4 --unsafe-perm true

   # For Linux:
   # See https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools
   ```
4. [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)
   ```bash
   # For macOS:
   brew install --cask azure-cosmos-emulator

   # For Windows:
   # Download and install from the Microsoft website
   ```
5. Visual Studio Code (recommended)

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
   # For macOS:
   azure-cosmos-emulator-start

   # For Windows:
   # Start from the Start Menu
   ```
2. The emulator runs at `https://localhost:8081`
3. Default key is provided in the emulator dashboard
4. Import the SSL certificate (first time only):
   ```bash
   # For macOS:
   curl -k https://localhost:8081/_explorer/emulator.pem > emulatorcert.crt
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain emulatorcert.crt
   ```

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
       "CosmosDB_Key": "<your-cosmos-db-emulator-key>",
       "CosmosDB_DatabaseName": "ConsentDB",
       "CORS_ORIGINS": "http://localhost:5173"
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

2. Create a `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:7071/api
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```
   The UI will be available at `http://localhost:5173`

## Project Structure

```
packages/
  ├── core/              # Core business logic and types
  ├── data-adapter-interface/    # Data adapter interface
  ├── data-adapter-cosmosdb/     # Cosmos DB implementation
  ├── api/               # Azure Functions API
  └── ui/               # Debug UI (React + Vite)
```

## Development Workflow

1. Make changes to the core packages
2. Run `pnpm build` to rebuild all packages
3. Start the local development environment as described above
4. Use the debug UI to test your changes

## Testing

Run tests across all packages:
```bash
pnpm test
```

## Debugging

### VS Code

1. Install the "Azure Functions" extension
2. Use the provided launch configurations in `.vscode/launch.json`
3. Set breakpoints in your code
4. Start debugging (F5)

### Browser DevTools

1. Open browser developer tools
2. Network tab shows API requests
3. Console shows client-side logs
4. React DevTools for component debugging

## Common Issues

1. **Cosmos DB Emulator Certificate**: If you see certificate errors, install the emulator's certificate:
   ```bash
   # For macOS:
   curl -k https://localhost:8081/_explorer/emulator.pem > emulatorcert.crt
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain emulatorcert.crt
   ```

2. **CORS Issues**: Ensure the CORS_ORIGINS in `local.settings.json` matches your UI origin

3. **Port Conflicts**: Default ports used:
   - UI: 5173
   - Functions: 7071
   - Cosmos DB Emulator: 8081

4. **Azure Functions Core Tools Not Found**: If you see "func command not found" or similar:
   ```bash
   # For macOS:
   brew unlink azure-functions-core-tools@4 && brew link azure-functions-core-tools@4
   ```

## Environment Variables Reference

### API (local.settings.json)
- `CosmosDB_Endpoint`: Cosmos DB endpoint
- `CosmosDB_Key`: Access key
- `CosmosDB_DatabaseName`: Database name
- `CORS_ORIGINS`: Allowed origins for CORS

### UI (.env.local)
- `VITE_API_BASE_URL`: API base URL 