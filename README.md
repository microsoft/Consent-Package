# Open Source Consent Package

A collection of packages for building consent management systems with audit trails, granular permissions, and flexible storage backends. Designed for transparency, compliance with privacy regulations, and easy integration into existing applications.

## What's Included

This monorepo contains:

- **Core Business Logic**: Platform-agnostic consent and policy management services
- **Data Adapters**: Multiple storage backend implementations (Cosmos DB, IndexedDB)
- **REST API**: Azure Functions-based backend with comprehensive endpoints
- **React Components**: Pre-built UI library for consent flows and policy management
- **TypeScript Types**: Shared interfaces and type definitions
- **Demo Application**: Example implementation showing integration patterns

## Getting Started

For local development setup and running the demo:
**[Local Development Setup](./docs/local_development.md)**

## Using in Your Project

These packages are not yet published to npm or other package repositories. This will change in the future. In the interim, to use them in your project, you'll need to import the source code directly:

1. Clone this repository
2. Copy the relevant package source files into your project
3. Install the required dependencies for each package
4. Build and integrate the TypeScript/JavaScript modules as needed

For a complete working example, see the [demo application](./packages/demo/) which shows how all packages work together.

## Documentation

### Integration Guides

- **[Frontend Usage Examples](./docs/frontend_usage_examples.md)** - React components, hooks, and UI integration
- **[API Usage Examples](./docs/api_usage_examples.md)** - Backend services, data adapters, and Azure Functions

### Reference

- **[Architecture Overview](./docs/architecture.md)** - System design and package structure
- **[API Endpoints](./docs/api.md)** - REST API specification
- **[Data Structures](./docs/data.md)** - Core types and data models
- **[Usage Examples](./docs/usage_examples.md)** - Quick reference for both frontend and backend

## Key Features

- **Immutable Audit Trails**: Complete history of consent decisions with versioning
- **Granular Permissions**: Scope-based consent for different data categories
- **Proxy Consent**: Handle consent on behalf of others with age-based validation
- **Storage Flexibility**: Pluggable adapters for different database backends
- **Compliance Ready**: Built for privacy regulation requirements

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

## Security

Please refer to the [Security Policy](./SECURITY.md) for more information on how to report security vulnerabilities.