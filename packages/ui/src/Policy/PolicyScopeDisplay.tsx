// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Card,
  Text,
  Tag,
} from '@fluentui/react-components';
import type { PolicyScope } from '@open-source-consent/types';

const useStyles = makeStyles({
  scopesContainer: {
    marginTop: tokens.spacingVerticalXXL,
    paddingTop: tokens.spacingVerticalXXL,
  },
  scopeSectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
  },
  scopeCard: {
    ...shorthands.padding(tokens.spacingVerticalL),
    marginBottom: tokens.spacingVerticalXXL,
    borderRadius: tokens.borderRadiusMedium,
    border: 'none',
    boxShadow: 'none',
  },
  scopeName: {
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground1,
  },
  scopeKey: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalS,
  },
  scopeDescription: {
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
});

interface PolicyScopeDisplayProps {
  scopes: readonly PolicyScope[];
}

const PolicyScopeDisplay: React.FC<PolicyScopeDisplayProps> = ({ scopes }) => {
  const styles = useStyles();

  if (!scopes || scopes.length === 0) {
    return null;
  }

  return (
    <div className={styles.scopesContainer}>
      <Text as="h2" className={styles.scopeSectionTitle}>
        Available Scopes
      </Text>
      {scopes.map((scope: PolicyScope) => (
        <Card key={scope.key} className={styles.scopeCard}>
          <Text
            as="h3"
            size={500}
            weight="semibold"
            className={styles.scopeName}
          >
            {scope.name}
          </Text>
          <Text as="p" className={styles.scopeKey}>
            Key: {scope.key}
          </Text>
          <Text as="p" className={styles.scopeDescription}>
            {scope.description}
          </Text>
          {scope.required && (
            <Tag appearance="outline" shape="rounded">
              Required
            </Tag>
          )}
        </Card>
      ))}
    </div>
  );
};

export default PolicyScopeDisplay;
