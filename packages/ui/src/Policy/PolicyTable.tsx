import React from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  makeStyles,
  tokens,
  Tag,
  Text,
} from '@fluentui/react-components';
import type { Policy } from '@open-source-consent/types';

const useStyles = makeStyles({
  actionsCell: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
});

interface PolicyTableProps {
  policies: Policy[];
  onViewPolicy(policyId: string): void;
  onEditPolicy(policyId: string): void;
}

const PolicyTable: React.FC<PolicyTableProps> = ({
  policies,
  onViewPolicy,
  onEditPolicy,
}) => {
  const styles = useStyles();

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return date instanceof Date
      ? date.toLocaleDateString()
      : new Date(date).toLocaleDateString();
  };

  if (policies.length === 0) {
    return <Text>No policies found.</Text>;
  }

  return (
    <Table aria-label="Policies Table" className={styles.table}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Version</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Effective Date</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id}>
            <TableCell>{policy.title}</TableCell>
            <TableCell>{policy.version}</TableCell>
            <TableCell>
              <Tag
                appearance="brand"
                shape="rounded"
                className={styles.statusTag}
              >
                {policy.status.toUpperCase()}
              </Tag>
            </TableCell>
            <TableCell>{formatDate(policy.effectiveDate)}</TableCell>
            <TableCell className={styles.actionsCell}>
              <Button
                appearance="outline"
                size="small"
                onClick={() => onViewPolicy(policy.id)}
              >
                View
              </Button>
              {policy.status === 'active' && (
                <Button
                  appearance="primary"
                  size="small"
                  onClick={() => onEditPolicy(policy.id)}
                >
                  Edit
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PolicyTable;
