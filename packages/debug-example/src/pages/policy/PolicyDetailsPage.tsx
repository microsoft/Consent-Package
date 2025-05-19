import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Spinner,
  Body1,
  Subtitle2,
  Label,
  Card,
  CardHeader,
  CardPreview,
  Dropdown,
  Option,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
} from "@fluentui/react-components";
import type { Policy } from "@open-source-consent/types";
import type {
  SelectionEvents,
  OptionOnSelectData,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
    maxWidth: "800px",
  },
  card: {
    width: "100%",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    ...shorthands.gap(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    alignItems: "center",
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  actions: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalL,
  },
  buttonGroup: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalL,
  },
});

// Define types for map callbacks for clarity
type PolicyContentSection = Policy["contentSections"][0];
type PolicyAvailableScope = Policy["availableScopes"][0];

function PolicyDetailsPage(): JSX.Element {
  const styles = useStyles();
  const { policyId } = useParams<{ policyId: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] =
    useState(false);
  const [newStatus, setNewStatus] = useState<Policy["status"] | undefined>(
    undefined
  );

  useEffect(() => {
    if (!policyId) return;
    const fetchPolicyDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/policies/${policyId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Policy not found.");
          }
          throw new Error(
            `Failed to fetch policy details: ${response.status} ${response.statusText}`
          );
        }
        const data: Policy = await response.json();
        setPolicy(data);
        setNewStatus(data.status); // Initialize newStatus with current policy status
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error(err);
      }
      setIsLoading(false);
    };
    void fetchPolicyDetails(); // Explicitly mark promise as intentionally not awaited
  }, [policyId]);

  const handleUpdateStatus = async () => {
    if (!policy || !newStatus || !policyId) return;
    setIsLoading(true);
    setError(null); // Clear previous errors before new attempt
    try {
      const response = await fetch(`/api/policies/${policyId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          expectedVersion: policy.version,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to update policy status",
        }));
        throw new Error(
          errorData.message ||
            `Failed to update policy status: ${response.status}`
        );
      }
      const updatedPolicy: Policy = await response.json();
      setPolicy(updatedPolicy);
      setNewStatus(updatedPolicy.status); // Update newStatus to reflect the actual new status
      setIsStatusUpdateDialogOpen(false);
    } catch (err) {
      // Set error to be displayed in the dialog or page
      setError(err instanceof Error ? err.message : "Failed to update status");
      console.error(err);
      // Do not close dialog on error, user might want to retry or see the error
    }
    setIsLoading(false);
  };

  const handleCreateNewVersion = () => {
    if (!policy) return;
    navigate("/policy/create", { state: { existingPolicy: policy } });
  };

  if (isLoading && !policy) {
    return <Spinner label="Loading policy details..." />;
  }

  if (error && !policy) {
    return (
      <Body1>
        Error: {error} <Link to="/policy/list">Go back to list</Link>
      </Body1>
    );
  }

  if (!policy) {
    return (
      <Body1>
        Policy not found. <Link to="/policy/list">Go back to list</Link>
      </Body1>
    );
  }

  return (
    <div className={styles.container}>
      <Subtitle2 as="h3">
        Policy Details: {policy.policyGroupId} - v{policy.version}
      </Subtitle2>
      {error && !isStatusUpdateDialogOpen && (
        <Body1 style={{ color: tokens.colorPaletteRedForeground1 }}>
          Error: {error}
        </Body1>
      )}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              <b>ID:</b> {policy.id}
            </Body1>
          }
        />
        <CardPreview className={styles.detailsGrid}>
          <Label className={styles.label}>Policy Group ID:</Label>
          <Body1>{policy.policyGroupId}</Body1>

          <Label className={styles.label}>Version:</Label>
          <Body1>{policy.version}</Body1>

          <Label className={styles.label}>Status:</Label>
          <Body1>{policy.status}</Body1>

          <Label className={styles.label}>Effective Date:</Label>
          <Body1>{new Date(policy.effectiveDate).toLocaleDateString()}</Body1>

          <Label className={styles.label}>Jurisdiction:</Label>
          <Body1>{policy.jurisdiction || "N/A"}</Body1>

          <Label className={styles.label}>Requires Proxy for Minors:</Label>
          <Body1>{policy.requiresProxyForMinors ? "Yes" : "No"}</Body1>

          <Label className={styles.label}>Created At:</Label>
          <Body1>{new Date(policy.createdAt).toLocaleString()}</Body1>

          <Label className={styles.label}>Last Updated At:</Label>
          <Body1>{new Date(policy.updatedAt).toLocaleString()}</Body1>
        </CardPreview>
      </Card>

      <div className={styles.section}>
        <Subtitle2 as="h4">Content Sections</Subtitle2>
        {policy.contentSections.map(
          (section: PolicyContentSection, index: number) => (
            <Card key={index} style={{ marginTop: tokens.spacingVerticalS }}>
              <CardHeader
                header={
                  <Body1>
                    <b>{section.title}</b>
                  </Body1>
                }
              />
              <CardPreview style={{ padding: tokens.spacingHorizontalM }}>
                <Body1>{section.description}</Body1>
                {section.content && (
                  <Body1>
                    <b>Content:</b>
                    {/* Content is sanitized on the backend before saving. */}
                    <div
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </Body1>
                )}
              </CardPreview>
            </Card>
          )
        )}
      </div>

      <div className={styles.section}>
        <Subtitle2 as="h4">Available Scopes</Subtitle2>
        {policy.availableScopes.map(
          (scope: PolicyAvailableScope, index: number) => (
            <Card key={index} style={{ marginTop: tokens.spacingVerticalS }}>
              <CardHeader
                header={
                  <Body1>
                    <b>
                      {scope.name} ({scope.key})
                    </b>
                  </Body1>
                }
              />
              <CardPreview style={{ padding: tokens.spacingHorizontalM }}>
                <Body1>{scope.description}</Body1>
                <Body1>
                  <b>Required:</b> {scope.required ? "Yes" : "No"}
                </Body1>
              </CardPreview>
            </Card>
          )
        )}
      </div>

      <div className={styles.actions}>
        <Dialog
          open={isStatusUpdateDialogOpen}
          onOpenChange={(
            _event: React.SyntheticEvent,
            data: { open: boolean }
          ) => {
            setIsStatusUpdateDialogOpen(data.open);
            if (!data.open) setError(null);
          }}
        >
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" disabled={isLoading}>
              Update Status
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Update Policy Status</DialogTitle>
              <DialogContent>
                <Field label="New Status" required>
                  <Dropdown
                    value={newStatus || policy.status}
                    onOptionSelect={(
                      _ev: SelectionEvents,
                      data: OptionOnSelectData
                    ) => setNewStatus(data.optionValue as Policy["status"])}
                  >
                    <Option value="draft" disabled={policy.status === "draft"}>
                      Draft
                    </Option>
                    <Option
                      value="active"
                      disabled={policy.status === "active"}
                    >
                      Active
                    </Option>
                    <Option
                      value="archived"
                      disabled={
                        policy.status === "archived" ||
                        policy.status === "active"
                      }
                    >
                      Archived
                    </Option>
                  </Dropdown>
                </Field>
                {error && (
                  <Body1
                    style={{
                      color: tokens.colorPaletteRedForeground1,
                      marginTop: tokens.spacingVerticalM,
                    }}
                  >
                    Error: {error}
                  </Body1>
                )}
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  onClick={() => {
                    void handleUpdateStatus();
                  }}
                  disabled={
                    isLoading || !newStatus || newStatus === policy.status
                  }
                >
                  {isLoading && policyId === policy.id ? (
                    <Spinner size="tiny" />
                  ) : (
                    "Confirm Update"
                  )}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Button
          appearance="outline"
          onClick={handleCreateNewVersion}
          disabled={isLoading || policy.status === "archived"}
        >
          Create New Version
        </Button>
      </div>

      <div className={styles.buttonGroup}>
        <Button onClick={() => navigate("/policy/list")} disabled={isLoading}>
          Back to List
        </Button>
        {/* Placeholder for navigating to all versions of a policy group */}
        {/* <Button onClick={() => navigate(`/policy/versions/${policy.policyGroupId}`)} disabled={isLoading}>View All Versions for Group</Button> */}
      </div>
    </div>
  );
}

export default PolicyDetailsPage;
