import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  makeStyles,
  shorthands,
  tokens,
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHeaderCell,
  Spinner,
  Body1,
  Subtitle2,
} from "@fluentui/react-components";
import type { Policy } from "@open-source-consent/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  table: {
    width: "100%",
  },
  link: {
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: "none",
    "&hover": {
      textDecorationLine: "underline",
    },
  },
});

function PolicyListPage(): JSX.Element {
  const styles = useStyles();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/policies"); // Proxied by Vite to Azure Functions
        if (!response.ok) {
          throw new Error(
            `Failed to fetch policies: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setPolicies(data as Policy[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error(err);
      }
      setIsLoading(false);
    };

    void fetchPolicies();
  }, []);

  if (isLoading) {
    return <Spinner label="Loading policies..." />;
  }

  if (error) {
    return <Body1>Error loading policies: {error}</Body1>;
  }

  return (
    <div className={styles.container}>
      <Subtitle2 as="h3">All Policies</Subtitle2>
      {policies.length === 0 ? (
        <Body1>No policies found.</Body1>
      ) : (
        <Table size="medium" className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Policy Group ID</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Effective Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.policyGroupId}</TableCell>
                <TableCell>{policy.version}</TableCell>
                <TableCell>{policy.status}</TableCell>
                <TableCell>
                  {new Date(policy.effectiveDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/policy/details/${policy.id}`}
                    className={styles.link}
                  >
                    View Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default PolicyListPage;
