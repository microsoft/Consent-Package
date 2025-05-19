import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Button,
  Body1,
  Subtitle2,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Label,
} from "@fluentui/react-components";
import type { ConsentRecord } from "@open-source-consent/types";

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
    padding: tokens.spacingHorizontalM,
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
  },
  actions: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalL,
  },
  preFormatted: {
    whiteSpace: "pre-wrap",
    fontFamily: "monospace",
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding(tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
});

function ConsentDetailsPage() {
  const styles = useStyles();
  const { consentId } = useParams<{ consentId: string }>();
  const navigate = useNavigate();
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!consentId) {
      setError("Consent ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchConsentDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/consent/${consentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Consent record not found.");
          }
          throw new Error(
            `Failed to fetch consent details: ${response.status} ${response.statusText}`
          );
        }
        const data: ConsentRecord = await response.json();
        setConsentRecord(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error(err);
      }
      setIsLoading(false);
    };

    void fetchConsentDetails();
  }, [consentId]);

  if (isLoading) {
    return <Spinner label="Loading consent details..." />;
  }

  if (error) {
    return (
      <Body1 style={{ color: tokens.colorPaletteRedForeground1 }}>
        Error: {error} <Link to="/consent/list">Go back to list</Link>
      </Body1>
    );
  }

  if (!consentRecord) {
    return (
      <Body1>
        Consent record not found.{" "}
        <Link to="/consent/list">Go back to list</Link>
      </Body1>
    );
  }

  return (
    <div className={styles.container}>
      <Subtitle2 as="h3">
        Consent Details: {consentRecord.id} (v{consentRecord.version})
      </Subtitle2>

      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              <b>Core Information</b>
            </Body1>
          }
        />
        <CardPreview className={styles.detailsGrid}>
          <Label className={styles.label}>ID:</Label>
          <Body1>{consentRecord.id}</Body1>

          <Label className={styles.label}>Version:</Label>
          <Body1>{consentRecord.version}</Body1>

          <Label className={styles.label}>Subject ID:</Label>
          <Body1>{consentRecord.subjectId}</Body1>

          <Label className={styles.label}>Policy ID:</Label>
          <Body1>
            <Link to={`/policy/details/${consentRecord.policyId}`}>
              {consentRecord.policyId}
            </Link>
          </Body1>

          <Label className={styles.label}>Status:</Label>
          <Body1>{consentRecord.status}</Body1>

          <Label className={styles.label}>Consented At:</Label>
          <Body1>{new Date(consentRecord.consentedAt).toLocaleString()}</Body1>

          {consentRecord.revokedAt && (
            <>
              <Label className={styles.label}>Revoked At:</Label>
              <Body1>
                {new Date(consentRecord.revokedAt).toLocaleString()}
              </Body1>
            </>
          )}

          <Label className={styles.label}>Created At:</Label>
          <Body1>{new Date(consentRecord.createdAt).toLocaleString()}</Body1>

          <Label className={styles.label}>Updated At:</Label>
          <Body1>{new Date(consentRecord.updatedAt).toLocaleString()}</Body1>
        </CardPreview>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              <b>Consenter Details</b>
            </Body1>
          }
        />
        <CardPreview className={styles.detailsGrid}>
          <Label className={styles.label}>Type:</Label>
          <Body1>{consentRecord.consenter.type}</Body1>
          <Label className={styles.label}>User ID:</Label>
          <Body1>{consentRecord.consenter.userId}</Body1>
          {consentRecord.consenter.proxyDetails && (
            <>
              <Label className={styles.label}>Proxy Relationship:</Label>
              <Body1>{consentRecord.consenter.proxyDetails.relationship}</Body1>
              <Label className={styles.label}>Subject Age Group:</Label>
              <Body1>
                {consentRecord.consenter.proxyDetails.subjectAgeGroup}
              </Body1>
            </>
          )}
        </CardPreview>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              <b>Granted Scopes</b>
            </Body1>
          }
        />
        <CardPreview>
          <pre className={styles.preFormatted}>
            {JSON.stringify(consentRecord.grantedScopes, null, 2)}
          </pre>
        </CardPreview>
      </Card>

      {consentRecord.revokedScopes &&
        Object.keys(consentRecord.revokedScopes).length > 0 && (
          <Card className={styles.card}>
            <CardHeader
              header={
                <Body1>
                  <b>Revoked Scopes</b>
                </Body1>
              }
            />
            <CardPreview>
              <pre className={styles.preFormatted}>
                {JSON.stringify(consentRecord.revokedScopes, null, 2)}
              </pre>
            </CardPreview>
          </Card>
        )}

      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              <b>Metadata</b>
            </Body1>
          }
        />
        <CardPreview>
          <pre className={styles.preFormatted}>
            {JSON.stringify(consentRecord.metadata, null, 2)}
          </pre>
        </CardPreview>
      </Card>

      <div className={styles.actions}>
        <Link
          to={`/consent/record?consentId=${consentRecord.id}&policyId=${consentRecord.policyId}&subjectId=${consentRecord.subjectId}`}
        >
          <Button appearance="outline" style={{ marginRight: "10px" }}>
            Create New Version / Revoke
          </Button>
        </Link>
        <Button onClick={() => navigate("/consent/list")}>Back to List</Button>
      </div>
    </div>
  );
}

export default ConsentDetailsPage;
