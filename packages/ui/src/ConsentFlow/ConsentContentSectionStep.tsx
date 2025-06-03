import { useRef, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import type { PolicyContentSection } from '@open-source-consent/types';

interface ConsentContentSectionStepProps {
  section: PolicyContentSection;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  sectionHeader: {
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
  },
  description: {
    display: 'inline-block',
    marginBottom: tokens.spacingVerticalL,
    fontStyle: 'italic',
  },
  content: {
    '& ul, & ol': {
      paddingLeft: '20px',
      margin: '8px 0',
    },
    '& li': {
      marginBottom: '4px',
    },
    '& h4, & h5, & h6': {
      marginTop: '12px',
      marginBottom: '4px',
      fontWeight: tokens.fontWeightSemibold,
    },
  },
});

const ConsentContentSectionStep = ({
  section,
}: ConsentContentSectionStepProps): JSX.Element => {
  const styles = useStyles();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  });

  return (
    <div className={styles.root}>
      <div className={styles.sectionHeader}>
        <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
          {section.title}
        </h2>
      </div>
      {section.description && (
        <div className={styles.description}>{section.description}</div>
      )}
      {section.content && (
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}
    </div>
  );
};

export default ConsentContentSectionStep;
