// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import { makeStyles, Text, tokens } from '@fluentui/react-components';
import type { PolicyContentSection } from '@open-source-consent/types';

const useStyles = makeStyles({
  section: {
    marginBottom: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    '&:last-child': {
      marginBottom: tokens.spacingVerticalXXL,
      paddingBottom: tokens.spacingVerticalXXL,
    },
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
  },
  sectionDescription: {
    display: 'block',
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
  },
  sectionContent: {
    marginTop: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase500,
    fontSize: tokens.fontSizeBase400,
    '& p': {
      marginBottom: tokens.spacingVerticalS,
    },
    '& ul, & ol': {
      marginLeft: tokens.spacingHorizontalXXL,
      marginBottom: tokens.spacingVerticalS,
    },
    '& li': {
      marginBottom: tokens.spacingVerticalXS,
    },
  },
});

interface PolicySectionDisplayProps {
  section: PolicyContentSection;
}

const PolicySectionDisplay: React.FC<PolicySectionDisplayProps> = ({
  section,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.section}>
      <Text as="h3" className={styles.sectionTitle}>
        {section.title}
      </Text>
      {section.description && (
        <Text as="p" className={styles.sectionDescription}>
          {section.description}
        </Text>
      )}
      <div
        className={styles.sectionContent}
        dangerouslySetInnerHTML={{
          __html: section.content,
        }}
      />
    </div>
  );
};

export default PolicySectionDisplay;
