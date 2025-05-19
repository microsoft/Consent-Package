import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Input,
  Label,
  Textarea,
  Dropdown,
  Option,
  Checkbox,
  Subtitle2,
  Body1,
  Field,
} from "@fluentui/react-components";
import type {
  InputOnChangeData,
  CheckboxProps,
  SelectionEvents,
  OptionOnSelectData,
} from "@fluentui/react-components";
import type { CreatePolicyInput, Policy } from "@open-source-consent/types";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Define more specific types for content sections and scopes based on CreatePolicyInput
type ContentSectionItem = CreatePolicyInput["contentSections"][0];
type AvailableScopeItem = CreatePolicyInput["availableScopes"][0];

const useStyles = makeStyles({
  formContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
    maxWidth: "700px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  sectionHeader: {
    marginBottom: tokens.spacingVerticalS,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  buttonGroup: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalL,
  },
  removeButton: {
    alignSelf: "flex-start",
  },
  expandingQuillWrapper: {
    "& .ql-toolbar": {
      ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
    },
    "& .ql-container": {
      height: "auto",
      minHeight: "100px",
      ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
      borderTopWidth: "0px",
      ...shorthands.borderRadius(tokens.borderRadiusSmall),
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
    },
    "& .ql-editor": {
      height: "auto",
      minHeight: "100px",
      overflowY: "visible",
      paddingTop: tokens.spacingVerticalS,
      paddingBottom: tokens.spacingVerticalS,
    },
  },
});

const initialContentSection: ContentSectionItem = {
  title: "",
  description: "",
  content: "",
};
const initialScope: AvailableScopeItem = {
  key: "",
  name: "",
  description: "",
  required: false,
};

function CreatePolicyPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const existingPolicy = location.state?.existingPolicy as Policy | undefined;

  const [pageTitle, setPageTitle] = useState("Create New Policy");

  const [policyGroupId, setPolicyGroupId] = useState(
    existingPolicy?.policyGroupId || ""
  );
  const [version, setVersion] = useState<number | undefined>(
    existingPolicy ? existingPolicy.version + 1 : 1
  );
  const [effectiveDate, setEffectiveDate] = useState<string>(
    existingPolicy?.effectiveDate
      ? new Date(existingPolicy.effectiveDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<Policy["status"]>(
    existingPolicy ? "draft" : "draft" // Always draft for new or new version
  );
  const [jurisdiction, setJurisdiction] = useState(
    existingPolicy?.jurisdiction || ""
  );
  const [requiresProxyForMinors, setRequiresProxyForMinors] = useState(
    existingPolicy?.requiresProxyForMinors || false
  );

  const [contentSections, setContentSections] = useState<ContentSectionItem[]>(
    existingPolicy?.contentSections?.map((cs) => ({
      title: cs.title,
      description: cs.description,
      content: cs.content || "",
    })) || [initialContentSection]
  );
  const [availableScopes, setAvailableScopes] = useState<AvailableScopeItem[]>(
    existingPolicy?.availableScopes?.map((as) => ({
      key: as.key,
      name: as.name,
      description: as.description,
      required: as.required,
    })) || [initialScope]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingPolicy) {
      setPageTitle(`Create New Version for ${existingPolicy.policyGroupId}`);
      // Policy Group ID should not be editable when creating a new version
      // Version is pre-filled and incremented
      // Status defaults to 'draft'
    }
  }, [existingPolicy]);

  // --- Content Section Handlers ---
  const addContentSection = () => {
    setContentSections((prevSections) => [
      ...prevSections,
      { ...initialContentSection },
    ]);
  };

  const removeContentSection = (indexToRemove: number) => {
    setContentSections((prevSections) =>
      prevSections.filter((_section, index) => index !== indexToRemove)
    );
  };

  const handleContentSectionChange = (
    index: number,
    field: keyof ContentSectionItem,
    value: string
  ) => {
    setContentSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
  };

  // --- Available Scope Handlers ---
  const addAvailableScope = () => {
    setAvailableScopes((prevScopes) => [...prevScopes, { ...initialScope }]);
  };

  const removeAvailableScope = (indexToRemove: number) => {
    setAvailableScopes((prevScopes) =>
      prevScopes.filter((_scope, index) => index !== indexToRemove)
    );
  };

  const handleAvailableScopeChange = (
    index: number,
    field: keyof AvailableScopeItem,
    value: string | boolean
  ) => {
    setAvailableScopes((prevScopes) =>
      prevScopes.map((scope, i) =>
        i === index ? { ...scope, [field]: value } : scope
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const policyData: CreatePolicyInput = {
      policyGroupId,
      version: version || 1,
      effectiveDate: new Date(effectiveDate),
      status,
      contentSections: contentSections.map((cs) => ({ ...cs })),
      availableScopes: availableScopes.map((as) => ({ ...as })),
      jurisdiction: jurisdiction || undefined,
      requiresProxyForMinors: requiresProxyForMinors || undefined,
    };

    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policyData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to create policy" }));
        throw new Error(
          errorData.message || `Failed to create policy: ${response.status}`
        );
      }

      const newPolicy: Policy = await response.json();
      navigate(`/policy/details/${newPolicy.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while creating the policy."
      );
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className={styles.formContainer}
    >
      <Subtitle2 as="h3">{pageTitle}</Subtitle2>

      <Field label="Policy Group ID" required>
        <Input
          value={policyGroupId}
          onChange={(
            _ev: React.ChangeEvent<HTMLInputElement>,
            data: InputOnChangeData
          ) => setPolicyGroupId(data.value)}
          required
          readOnly={!!existingPolicy} // Make read-only if it's a new version
        />
      </Field>

      <Field
        label={
          existingPolicy
            ? "New Version"
            : "Version (optional, defaults to 1 for new group)"
        }
        required
      >
        <Input
          type="number"
          value={version?.toString() || ""}
          onChange={(
            _ev: React.ChangeEvent<HTMLInputElement>,
            data: InputOnChangeData
          ) => setVersion(data.value ? parseInt(data.value) : undefined)}
          required // Version is always required now
          // Consider making version read-only if backend strictly dictates it,
          // or allow user to suggest, backend validates.
          // For now, keeping it editable but pre-filled and incremented.
        />
      </Field>

      <Field label="Effective Date" required>
        <Input
          type="date"
          value={effectiveDate}
          onChange={(
            _ev: React.ChangeEvent<HTMLInputElement>,
            data: InputOnChangeData
          ) => setEffectiveDate(data.value)}
          required
        />
      </Field>

      <Field label="Status" required>
        <Dropdown
          value={status}
          onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) =>
            setStatus(data.optionValue as Policy["status"])
          }
        >
          <Option value="draft">Draft</Option>
          <Option value="active">Active</Option>
          <Option value="archived">Archived</Option>
        </Dropdown>
      </Field>

      <Field label="Jurisdiction (optional)">
        <Input
          value={jurisdiction}
          onChange={(
            _ev: React.ChangeEvent<HTMLInputElement>,
            data: InputOnChangeData
          ) => setJurisdiction(data.value)}
        />
      </Field>

      <Field>
        <Checkbox
          label="Requires Proxy for Minors"
          checked={requiresProxyForMinors}
          onChange={(
            _ev: React.FormEvent<HTMLInputElement>,
            data: CheckboxProps
          ) => setRequiresProxyForMinors(data.checked as boolean)}
        />
      </Field>

      {/* Content Sections */}
      <div className={styles.section}>
        <Label className={styles.sectionHeader} size="large" weight="semibold">
          Content Sections
        </Label>
        {contentSections.map((section, index) => (
          <div
            key={index}
            className={styles.section}
            style={{ borderWidth: "1px", borderStyle: "dashed" }}
          >
            <Field label={`Section ${index + 1} Title`} required>
              <Input
                value={section.title}
                onChange={(
                  _ev: React.ChangeEvent<HTMLInputElement>,
                  data: InputOnChangeData
                ) => handleContentSectionChange(index, "title", data.value)}
                required
              />
            </Field>
            <Field label="Description" required>
              <Textarea
                value={section.description}
                onChange={(
                  _ev: React.ChangeEvent<HTMLTextAreaElement>,
                  data: { value: string }
                ) =>
                  handleContentSectionChange(index, "description", data.value)
                }
                required
              />
            </Field>
            <Field label="Content (HTML)" required>
              <div className={styles.expandingQuillWrapper}>
                <ReactQuill
                  theme="snow"
                  value={section.content || ""}
                  onChange={(contentValue: string) =>
                    handleContentSectionChange(index, "content", contentValue)
                  }
                  modules={{
                    toolbar: [
                      [{ header: "1" }, { header: "2" }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </Field>
            {contentSections.length > 1 && (
              <Button
                type="button"
                appearance="subtle"
                className={styles.removeButton}
                onClick={() => removeContentSection(index)}
              >
                Remove Section
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          appearance="outline"
          onClick={addContentSection}
          style={{ alignSelf: "flex-start" }}
        >
          Add Content Section
        </Button>
      </div>

      {/* Available Scopes */}
      <div className={styles.section}>
        <Label className={styles.sectionHeader} size="large" weight="semibold">
          Available Scopes
        </Label>
        {availableScopes.map((scope, index) => (
          <div
            key={index}
            className={styles.section}
            style={{ borderWidth: "1px", borderStyle: "dashed" }}
          >
            <Field label={`Scope ${index + 1} Key`} required>
              <Input
                value={scope.key}
                onChange={(
                  _ev: React.ChangeEvent<HTMLInputElement>,
                  data: InputOnChangeData
                ) => handleAvailableScopeChange(index, "key", data.value)}
                required
              />
            </Field>
            <Field label="Name" required>
              <Input
                value={scope.name}
                onChange={(
                  _ev: React.ChangeEvent<HTMLInputElement>,
                  data: InputOnChangeData
                ) => handleAvailableScopeChange(index, "name", data.value)}
                required
              />
            </Field>
            <Field label="Description" required>
              <Textarea
                value={scope.description}
                onChange={(
                  _ev: React.ChangeEvent<HTMLTextAreaElement>,
                  data: { value: string }
                ) =>
                  handleAvailableScopeChange(index, "description", data.value)
                }
                required
              />
            </Field>
            <Field label="Required Scope">
              <Checkbox
                checked={scope.required as boolean}
                onChange={(
                  _ev: React.FormEvent<HTMLInputElement>,
                  data: CheckboxProps
                ) =>
                  handleAvailableScopeChange(
                    index,
                    "required",
                    data.checked as boolean
                  )
                }
              />
            </Field>
            {availableScopes.length > 1 && (
              <Button
                type="button"
                appearance="subtle"
                className={styles.removeButton}
                onClick={() => removeAvailableScope(index)}
              >
                Remove Scope
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          appearance="outline"
          onClick={addAvailableScope}
          style={{ alignSelf: "flex-start" }}
        >
          Add Available Scope
        </Button>
      </div>

      {error && (
        <Body1 style={{ color: tokens.colorPaletteRedForeground1 }}>
          Error: {error}
        </Body1>
      )}

      <div className={styles.buttonGroup}>
        <Button type="submit" appearance="primary" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Policy"}
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/policy/list")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default CreatePolicyPage;
