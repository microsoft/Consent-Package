export interface Policy {
  readonly id: string; // Unique identifier for this specific policy *version*
  readonly policyGroupId: string; // Identifier linking different versions of the same logical policy
  readonly version: number; // Version number of this policy document
  readonly effectiveDate: Date; // Date when this policy version becomes active
  readonly contentSections: ReadonlyArray<{
    // Collection of distinct content sections
    readonly title: string; // Section title
    readonly description: string; // Section description
    readonly content: string; // Rich text or HTML content for this section
  }>;
  // Defines the data scopes/categories covered by this policy
  readonly availableScopes: Readonly<
    Array<{
      readonly key: string; // Unique machine-readable key (e.g., 'nutrition_log', 'genomic_data')
      readonly name: string; // Human-readable name (e.g., 'Nutrition Logs')
      readonly description: string; // Explanation of what this scope entails
      readonly required?: boolean; // Whether consent for this scope is mandatory for the policy
    }>
  >;
  readonly jurisdiction?: string;
  readonly requiresProxyForMinors?: boolean; // Flag indicating if proxy consent is needed for specific age groups
  readonly status: "draft" | "active" | "archived"; // Lifecycle status of the policy version
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * A subset of Policy that is used by the UI.
 */
export interface PolicyDetails
  extends Pick<
    Policy,
    "id" | "version" | "contentSections" | "availableScopes"
  > {}
