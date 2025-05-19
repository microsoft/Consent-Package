import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Body1,
  Input,
  Label,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  Table,
  Subtitle2,
} from "@fluentui/react-components";
import type { ConsentRecord } from "@open-source-consent/types";
import type { InputOnChangeData } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  fetchSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalM),
    maxWidth: "400px",
  },
  table: {
    marginTop: tokens.spacingVerticalL,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  actions: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalM,
  },
});

function ConsentListPage() {
  const styles = useStyles();
  const [subjectId, setSubjectId] = useState("");
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchConsents = async () => {
    if (!subjectId) {
      setError("Subject ID is required to fetch consents.");
      setConsentRecords([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setConsentRecords([]);
    try {
      const response = await fetch(
        `/api/consents/subject/${subjectId}/latest-versions`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch consents: ${response.status} ${response.statusText}`
        );
      }
      const data: ConsentRecord[] = await response.json();
      setConsentRecords(data);
      if (data.length === 0) {
        setError("No consent records found for this subject ID.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.fetchSection}>
        <Label htmlFor="subjectId-input">
          Enter Subject ID to List Consents:
        </Label>
        <Input
          id="subjectId-input"
          value={subjectId}
          onChange={(
            _ev: React.ChangeEvent<HTMLInputElement>,
            data: InputOnChangeData
          ) => setSubjectId(data.value)}
          placeholder="e.g., user-123"
        />
        <Button
          appearance="primary"
          onClick={() => {
            void handleFetchConsents();
          }}
          disabled={isLoading || !subjectId}
          style={{ marginTop: tokens.spacingVerticalS }}
        >
          {isLoading ? (
            <Spinner size="tiny" />
          ) : (
            "Fetch Latest Consents by Subject"
          )}
        </Button>
      </div>

      <div className={styles.actions}>
        <Link to="/consent/record">
          <Button appearance="outline">Record New Consent</Button>
        </Link>
      </div>

      {error && <Body1 className={styles.errorText}>{error}</Body1>}

      {consentRecords.length > 0 && (
        <>
          <Subtitle2 as="h4">
            Latest Consent Versions for Subject: {subjectId}
          </Subtitle2>
          <Table aria-label="Consent records table" className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Consent ID</TableHeaderCell>
                <TableHeaderCell>Policy ID</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Consented At</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>
                    <Link to={`/policy/details/${record.policyId}`}>
                      {record.policyId}
                    </Link>
                  </TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell>{record.version}</TableCell>
                  <TableCell>
                    {new Date(record.consentedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link to={`/consent/details/${record.id}`}>
                      <Button appearance="subtle">View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

export default ConsentListPage;
