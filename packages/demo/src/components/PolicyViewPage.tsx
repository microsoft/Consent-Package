import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  usePolicyDetails,
  PolicyMetadataDisplay,
  PolicySectionDisplay,
  PolicyScopeDisplay,
} from "@open-source-consent/ui";
import {
  makeStyles,
  shorthands,
  tokens,
  Card,
  Button,
  Spinner,
  Text,
} from "@fluentui/react-components";
import type { PolicyContentSection } from "@open-source-consent/types";

const useStyles = makeStyles({
  root: {
    padding: "24px 64px",
    margin: "0 auto",
    maxWidth: "900px",
    "@media (max-width: 768px)": {
      padding: "24px",
    },
  },
  card: {
    ...shorthands.padding("32px"),
    boxShadow: tokens.shadow8,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  title: {
    marginRight: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground1,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
  backButtonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
});

const PolicyViewPage: React.FC = () => {
  const styles = useStyles();
  const { policyId } = useParams<{ policyId: string }>();
  const { policy, isLoading, error } = usePolicyDetails(policyId);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Spinner label={`Loading policy ${policyId}...`} />
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className={styles.root}>
        <Card className={styles.card}>
          <Text size={500} weight="semibold">
            {error || "Policy not found."}
          </Text>
          <br />
          <Link to="/policies">
            <Button
              appearance="primary"
              style={{ marginTop: tokens.spacingVerticalL }}
            >
              Back to Policies List
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.headerContainer}>
          <Text as="h1" size={800} weight="semibold" className={styles.title}>
            {policy.title || "Policy Details"}
          </Text>
          <Link to={`/policy/edit/${policy.id}`}>
            <Button appearance="primary">Edit Policy</Button>
          </Link>
        </div>

        <PolicyMetadataDisplay policy={policy} />

        {policy.contentSections.map(
          (section: PolicyContentSection, index: number) => (
            <PolicySectionDisplay key={index} section={section} />
          )
        )}

        {policy.availableScopes && policy.availableScopes.length > 0 && (
          <PolicyScopeDisplay scopes={policy.availableScopes} />
        )}
        <div className={styles.backButtonContainer}>
          <Link to="/policies">
            <Button appearance="outline">Back to Policies List</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PolicyViewPage;
