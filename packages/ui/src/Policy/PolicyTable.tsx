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
  table: {
    width: '100%',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  tableBody: {
    '@media (max-width: 768px)': {
      display: 'block',
      width: '100%',
    },
  },
  tableHeader: {
    '@media (max-width: 768px)': {
      position: 'absolute',
      top: '-9999px',
      left: '-9999px',
    },
  },
  tableRow: {
    '@media (max-width: 768px)': {
      display: 'block',
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      borderRadius: tokens.borderRadiusMedium,
      marginBottom: tokens.spacingVerticalM,
      padding: tokens.spacingVerticalS,
    },
  },
  tableCell: {
    '@media (max-width: 768px)': {
      display: 'block',
      textAlign: 'right',
      position: 'relative',
      paddingLeft: '50%',
      paddingBottom: tokens.spacingVerticalXS,
      paddingTop: tokens.spacingVerticalXS,
      minHeight: '30px',

      '&::before': {
        content: 'attr(data-label)',
        position: 'absolute',
        left: 0,
        width: '45%',
        paddingRight: tokens.spacingHorizontalS,
        textAlign: 'left',
        fontWeight: 'bold',
        color: tokens.colorNeutralForeground2,
      },
    },
  },
  actionsCell: {
    display: 'flex',
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalS,

    '@media (max-width: 768px)': {
      justifyContent: 'flex-end',
      paddingLeft: '0 !important',

      '&::before': {
        display: 'none !important',
      },
    },
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
      <TableHeader className={styles.tableHeader}>
        <TableRow>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Version</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Effective Date</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody className={styles.tableBody}>
        {policies.map((policy) => (
          <TableRow key={policy.id} className={styles.tableRow}>
            <TableCell data-label="Title" className={styles.tableCell}>
              {policy.title}
            </TableCell>
            <TableCell data-label="Version" className={styles.tableCell}>
              {policy.version}
            </TableCell>
            <TableCell data-label="Status" className={styles.tableCell}>
              <Tag appearance="brand" shape="rounded">
                {policy.status.toUpperCase()}
              </Tag>
            </TableCell>
            <TableCell data-label="Effective Date" className={styles.tableCell}>
              {formatDate(policy.effectiveDate)}
            </TableCell>
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
