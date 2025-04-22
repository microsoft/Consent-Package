# Open Source Consent Package

A developer-focused Consent Management Platform for medical research using React/TypeScript.

## Project Structure

This is a monorepo managed with pnpm workspaces containing the following packages:

- `@open-source-consent/core`: Core business logic and types
- `@open-source-consent/data-adapter-interface`: Data storage adapter interface
- `@open-source-consent/data-adapter-cosmosdb`: Cosmos DB adapter implementation (with mock for local dev)
- `@open-source-consent/api`: Azure Functions API (coming soon)
- `@open-source-consent/ui`: React component library (coming soon)

## Local Development Setup

1. Prerequisites:
   - Node.js >= 18
   - pnpm >= 8

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Development mode:
   ```bash
   pnpm dev
   ```

## License

MIT

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
