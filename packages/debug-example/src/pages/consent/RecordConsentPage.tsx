import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Body1,
  Subtitle2,
  Input,
  Label,
  Dropdown,
  Option,
  Checkbox,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
  Field,
} from "@fluentui/react-components";
import type {
  CreateConsentInput,
  ConsentRecord,
  AgeGroup,
  ConsenterType,
  Policy,
} from "@open-source-consent/types";

// Use indexed access type for a single available scope from a Policy
type AvailableScopeItem = Policy["availableScopes"][0];

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
  scopeSection: {
    marginTop: tokens.spacingVerticalL,
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
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
});

const initialConsentData: Partial<CreateConsentInput> = {
  subjectId: "",
  policyId: "",
  consenter: {
    type: "self",
    userId: "",
  },
  grantedScopes: [],
  metadata: {
    consentMethod: "digital_form",
    ipAddress: "127.0.0.1",
    userAgent: "DebugUI/1.0",
  },
};

function RecordConsentPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] =
    useState<Partial<CreateConsentInput>>(initialConsentData);
  const [allPolicies, setAllPolicies] = useState<Policy[]>([]);
  const [selectedPolicyFull, setSelectedPolicyFull] = useState<Policy | null>(
    null
  );
  const [policyFetchError, setPolicyFetchError] = useState<string | null>(null);
  const [isFetchingPolicies, setIsFetchingPolicies] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("Record New Consent");

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsFetchingPolicies(true);
      setPolicyFetchError(null);
      try {
        const response = await fetch("/api/policies");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch policies: ${response.status} ${response.statusText}`
          );
        }
        const data: Policy[] = await response.json();
        setAllPolicies(data);
      } catch (err) {
        setPolicyFetchError(
          err instanceof Error ? err.message : "Error fetching policies"
        );
        console.error(err);
      }
      setIsFetchingPolicies(false);
    };
    void fetchPolicies();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const consentId = queryParams.get("consentId");
    const queryPolicyId = queryParams.get("policyId");
    const subjectId = queryParams.get("subjectId");

    if (consentId) {
      setPageTitle(
        `Create New Version / Revoke Consent (based on ${consentId})`
      );
    }

    let initialPolicy: Policy | null = null;
    if (queryPolicyId && allPolicies.length > 0) {
      initialPolicy = allPolicies.find((p) => p.id === queryPolicyId) || null;
      setSelectedPolicyFull(initialPolicy);
    }

    setFormData((prev) => ({
      ...prev,
      subjectId: subjectId || prev.subjectId || "",
      policyId: queryPolicyId || prev.policyId || "",
      grantedScopes: initialPolicy
        ? initialPolicy.availableScopes
            .filter((s) => s.required)
            .map((s) => s.key)
        : prev.grantedScopes || [],
      consenter: {
        ...(prev.consenter || {}),
        userId: subjectId || prev.consenter?.userId || "",
      } as CreateConsentInput["consenter"],
    }));
  }, [location.search, allPolicies]);

  const handleInputChange = (
    field: keyof CreateConsentInput,
    value: string | Record<string, unknown> | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePolicySelect = (
    _event: React.SyntheticEvent | React.MouseEvent,
    data: { optionValue?: string; optionText?: string }
  ) => {
    if (data.optionValue) {
      const selectedP = allPolicies.find((p) => p.id === data.optionValue);
      setSelectedPolicyFull(selectedP || null);
      setFormData((prev) => ({
        ...prev,
        policyId: selectedP?.id || "",
        grantedScopes: selectedP
          ? selectedP.availableScopes
              .filter((s) => s.required)
              .map((s) => s.key)
          : [],
      }));
    }
  };

  const handleScopeChange = (scopeKey: string, checked: boolean) => {
    setFormData((prev) => {
      const currentScopes = prev.grantedScopes || [];
      let newScopes;
      if (checked) {
        newScopes = [...currentScopes, scopeKey];
      } else {
        newScopes = currentScopes.filter((s) => s !== scopeKey);
      }
      return { ...prev, grantedScopes: newScopes };
    });
  };

  const handleConsenterChange = (
    field: keyof CreateConsentInput["consenter"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      consenter: {
        ...(prev.consenter as CreateConsentInput["consenter"]),
        [field]: value,
      },
    }));
  };

  const handleProxyDetailsChange = (
    field: keyof NonNullable<CreateConsentInput["consenter"]["proxyDetails"]>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      consenter: {
        ...(prev.consenter as CreateConsentInput["consenter"]),
        proxyDetails: {
          ...(prev.consenter?.proxyDetails || {
            relationship: "",
            subjectAgeGroup: "18+",
          }),
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.subjectId || !formData.policyId) {
      setError("Subject ID and Policy ID are required.");
      setIsLoading(false);
      return;
    }

    const finalScopes = formData.grantedScopes || [];

    const payload: CreateConsentInput = {
      subjectId: formData.subjectId!,
      policyId: formData.policyId!,
      consenter: {
        type: formData.consenter?.type || "self",
        userId:
          formData.consenter?.type === "proxy" && formData.consenter?.userId
            ? formData.consenter.userId
            : formData.subjectId!,
        proxyDetails:
          formData.consenter?.type === "proxy"
            ? formData.consenter.proxyDetails
            : undefined,
      },
      grantedScopes: finalScopes,
      metadata: formData.metadata || initialConsentData.metadata!,
    };

    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to record consent" }));
        throw new Error(
          errorData.message ||
            `Failed to record consent: ${response.status} ${response.statusText}`
        );
      }

      const newConsentRecord: ConsentRecord = await response.json();
      navigate(`/consent/details/${newConsentRecord.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while recording the consent."
      );
      console.error(err);
    }
    setIsLoading(false);
  };

  const getPolicyDisplayValue = () => {
    if (!formData.policyId || !allPolicies.length) return "";
    const policy = allPolicies.find((p) => p.id === formData.policyId);
    return policy ? `${policy.policyGroupId} v${policy.version}` : "";
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className={styles.formContainer}
    >
      <Subtitle2 as="h3">{pageTitle}</Subtitle2>

      <Field label="Subject ID" required>
        <Input
          value={formData.subjectId || ""}
          onChange={(_ev: Event, data: unknown) =>
            handleInputChange("subjectId", (data as { value: string }).value)
          }
          required
        />
      </Field>

      <Field label="Policy" required>
        {isFetchingPolicies ? (
          <Spinner size="tiny" label="Loading policies..." />
        ) : policyFetchError ? (
          <Body1 className={styles.errorText}>{policyFetchError}</Body1>
        ) : (
          <Dropdown
            placeholder="Select a policy"
            value={getPolicyDisplayValue()}
            selectedOptions={formData.policyId ? [formData.policyId] : []}
            onOptionSelect={handlePolicySelect}
          >
            {allPolicies.map((policy) => (
              <Option
                key={policy.id}
                value={policy.id}
                text={`${policy.policyGroupId} v${policy.version} (${policy.status}) - ${policy.id}`}
              >
                {`${policy.policyGroupId} v${policy.version} (${policy.status}) - ID: ${policy.id}`}
              </Option>
            ))}
          </Dropdown>
        )}
      </Field>

      {selectedPolicyFull && selectedPolicyFull.availableScopes.length > 0 && (
        <div className={`${styles.section} ${styles.scopeSection}`}>
          <Label size="large" weight="semibold">
            Available Scopes for {selectedPolicyFull.policyGroupId} v
            {selectedPolicyFull.version}
          </Label>
          {selectedPolicyFull.availableScopes.map(
            (scope: AvailableScopeItem) => (
              <Field key={scope.key}>
                <Checkbox
                  label={`${scope.name} (${scope.key})${scope.required ? " (required)" : ""}`}
                  checked={(formData.grantedScopes || []).includes(scope.key)}
                  onChange={(_ev: Event, data: unknown) =>
                    handleScopeChange(
                      scope.key,
                      (data as { checked: boolean }).checked
                    )
                  }
                />
              </Field>
            )
          )}
        </div>
      )}

      <div className={styles.section}>
        <Label className={styles.field} size="large" weight="semibold">
          Consenter Information
        </Label>
        <Field label="Consenter Type" required>
          <Dropdown
            value={formData.consenter?.type || "self"}
            onOptionSelect={(_ev: Event, data: unknown) =>
              handleConsenterChange(
                "type",
                (data as { optionValue: ConsenterType }).optionValue
              )
            }
          >
            <Option value="self">Self</Option>
            <Option value="proxy">Proxy</Option>
          </Dropdown>
        </Field>
        <Field
          label={
            formData.consenter?.type === "proxy"
              ? "Proxy User ID"
              : "Consenter User ID (if different from Subject ID)"
          }
          required={formData.consenter?.type === "proxy"}
        >
          <Input
            value={formData.consenter?.userId || ""}
            onChange={(_ev: Event, data: unknown) =>
              handleConsenterChange("userId", (data as { value: string }).value)
            }
            placeholder={
              formData.consenter?.type === "self"
                ? "Defaults to Subject ID if blank"
                : "Required for proxy"
            }
            required={formData.consenter?.type === "proxy"}
          />
        </Field>
        {formData.consenter?.type === "proxy" && (
          <>
            <Field label="Proxy Relationship" required>
              <Input
                value={formData.consenter?.proxyDetails?.relationship || ""}
                onChange={(_ev: Event, data: unknown) =>
                  handleProxyDetailsChange(
                    "relationship",
                    (data as { value: string }).value
                  )
                }
                required
              />
            </Field>
            <Field label="Subject Age Group" required>
              <Dropdown
                value={
                  formData.consenter?.proxyDetails?.subjectAgeGroup || "18+"
                }
                onOptionSelect={(_ev: Event, data: unknown) =>
                  handleProxyDetailsChange(
                    "subjectAgeGroup",
                    (data as { optionValue: AgeGroup }).optionValue
                  )
                }
              >
                <Option value="under13">Under 13</Option>
                <Option value="13-17">13-17</Option>
                <Option value="18+">18+</Option>
              </Dropdown>
            </Field>
          </>
        )}
      </div>

      <div className={styles.section}>
        <Label className={styles.field} size="large" weight="semibold">
          Metadata (Debug Defaults)
        </Label>
        <Field label="Consent Method">
          <Input
            value={formData.metadata?.consentMethod || "digital_form"}
            readOnly
          />
        </Field>
        <Field label="IP Address (Debug)">
          <Input value={formData.metadata?.ipAddress || "127.0.0.1"} readOnly />
        </Field>
        <Field label="User Agent (Debug)">
          <Input
            value={formData.metadata?.userAgent || "DebugUI/1.0"}
            readOnly
          />
        </Field>
      </div>

      {error && <Body1 className={styles.errorText}>Error: {error}</Body1>}

      <div className={styles.buttonGroup}>
        <Button
          type="submit"
          appearance="primary"
          disabled={isLoading || isFetchingPolicies}
        >
          {isLoading ? <Spinner size="tiny" /> : "Submit Consent"}
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/consent/list")}
          disabled={isLoading || isFetchingPolicies}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default RecordConsentPage;
