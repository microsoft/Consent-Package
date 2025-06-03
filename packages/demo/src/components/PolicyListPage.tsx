import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Button,
  Card,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  Text,
} from '@fluentui/react-components';
import { usePolicyList, PolicyTable } from '@open-source-consent/ui';

const useStyles = makeStyles({
  root: {
    padding: '24px 64px',
    margin: '0 auto',
    maxWidth: '1200px',
    '@media (max-width: 768px)': {
      padding: '24px',
    },
  },
  card: {
    ...shorthands.padding('20px'),
    boxShadow: 'none',
    borderRadius: tokens.borderRadiusMedium,
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
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.headerContainer}>
          <Text as="h2" size={600} weight="semibold">
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
    </div>
  );
};

export default PolicyListPage;
