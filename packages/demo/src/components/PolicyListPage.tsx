// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Button,
  Card,
  makeStyles,
  tokens,
  Spinner,
  Text,
} from '@fluentui/react-components';
import { usePolicyList, PolicyTable } from '@open-source-consent/ui';

const useStyles = makeStyles({
  root: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      padding: '24px',
    },
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
  createButton: {
    maxWidth: '200px',
    margin: tokens.spacingHorizontalXXL,
  },
});

const PolicyListPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { policies, isLoading, error } = usePolicyList();

  const handleViewPolicy = async (policyId: string) => {
    await navigate(`/policy/view/${policyId}`);
  };

  const handleEditPolicy = async (policyId: string) => {
    await navigate(`/policy/edit/${policyId}`);
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Spinner label="Loading policies..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.root}>
        <Text size={500} weight="semibold">
          Error fetching policies: {error}
        </Text>
      </div>
    );
  }

  return (
    <Card className={styles.root}>
      <div className={styles.headerContainer}>
        <Text as="h1" size={600} weight="semibold" underline>
          Manage Policies
        </Text>
        <Link to="/policy/new">
          <Button appearance="primary" className={styles.createButton}>
            Create New Policy
          </Button>
        </Link>
      </div>

      <PolicyTable
        policies={policies}
        onViewPolicy={(policyId) => void handleViewPolicy(policyId)}
        onEditPolicy={(policyId) => void handleEditPolicy(policyId)}
      />
    </Card>
  );
};

export default PolicyListPage;
