import React from 'react';
import { makeStyles, Text, Tag, tokens } from '@fluentui/react-components';
import type { Policy } from '@open-source-consent/types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXXL,
  },
  metadataRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: `${tokens.spacingVerticalSN} ${tokens.spacingHorizontalL}`,
    alignItems: 'center',
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  value: {
    color: tokens.colorNeutralForeground1,
  },
});

interface PolicyMetadataDisplayProps {
  policy: Pick<
    Policy,
    | 'id'
    | 'policyGroupId'
    | 'version'
    | 'status'
    | 'effectiveDate'
    | 'jurisdiction'
    | 'requiresProxyForMinors'
    | 'createdAt'
    | 'updatedAt'
  >;
}

const PolicyMetadataDisplay: React.FC<PolicyMetadataDisplayProps> = ({
  policy,
}) => {
  const styles = useStyles();

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return date instanceof Date
      ? date.toLocaleDateString()
      : new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return date instanceof Date
      ? date.toLocaleString()
      : new Date(date).toLocaleString();
  };

  return (
    <div className={styles.root}>
      <div className={styles.metadataRow}>
        <Text className={styles.label}>Policy ID:</Text>
        <Text className={styles.value}>{policy.id}</Text>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Policy Group ID:</Text>
        <Text className={styles.value}>{policy.policyGroupId}</Text>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Version:</Text>
        <Text className={styles.value}>{policy.version}</Text>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Status:</Text>
        <Tag appearance="outline" shape="rounded">
          {policy.status.toUpperCase()}
        </Tag>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Effective Date:</Text>
        <Text className={styles.value}>{formatDate(policy.effectiveDate)}</Text>
      </div>

      {policy.jurisdiction && (
        <div className={styles.metadataRow}>
          <Text className={styles.label}>Jurisdiction:</Text>
          <Text className={styles.value}>{policy.jurisdiction}</Text>
        </div>
      )}

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Proxy for Minors:</Text>
        <Text className={styles.value}>
          {policy.requiresProxyForMinors ? 'Yes' : 'No'}
        </Text>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Created At:</Text>
        <Text className={styles.value}>{formatDateTime(policy.createdAt)}</Text>
      </div>

      <div className={styles.metadataRow}>
        <Text className={styles.label}>Last Updated:</Text>
        <Text className={styles.value}>{formatDateTime(policy.updatedAt)}</Text>
      </div>
    </div>
  );
};

export default PolicyMetadataDisplay;
