# Scope

## Within scope

- UI + API that can be customized or embedded. [See usage examples.](./usage_examples.md)
- Core logic that conforms to regulations, ie immutable, versioned records for auditability.
- Example app that demonstrates medical research use-case.
- Support revocation and updates to consent.
- Defaults for typical research data consent needs (e.g., for under-13, proxies, etc.).
- Easily customized content, styles.
- Responsive and accessible.

## Outside scope

- User/subject management
  - The consumer of the framework (developers) will be responsible for providing subject ids. In the example app, a subject id will be randomly generated.
- Authentication
  - The `api` package will provide an interface for consumers of the framework to integrate their own authentication middleware. This will be a simple passthrough layer in the example.
- Fully styled and/or branded example
  - The example will use generic styles.
- Custom base components (eg. checkboxes, buttons, etc.)
  - The `ui` package will consist of small customizable composed components and page-level components. The base UI elements will come from a suitable Microsoft approved or affiliated component library (FluentUI or similar).
