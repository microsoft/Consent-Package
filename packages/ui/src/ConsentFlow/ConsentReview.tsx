import { useRef, useEffect, useState } from 'react';
import { makeStyles, Text, tokens } from '@fluentui/react-components';
import Signature from '../Signature/index.js';
import type { ConsentFlowFormData } from './ConsentFlow.type.js';
import type { Policy, PolicyScope } from '@open-source-consent/types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '4px',
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  signatureSection: {
    marginTop: '24px',
    '& > :last-child': {
      marginTop: '16px',
    },
  },
  list: {
    paddingLeft: '16px',
    margin: '8px 0',
    '& > li': {
      marginBottom: '4px',
    },
  },
  ariaLive: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  },
});

interface ConsentReviewProps {
  policy: Policy;
  formData: ConsentFlowFormData;
  onSignatureSubmit(signature: string, date: Date): void;
}

const formatAge = (age: number | undefined): string => {
  if (age === undefined) return 'N/A';

  if (age < 1) return 'less than 1 year old';
  else return age === 1 ? `${age} year old` : `${age} years old`;
};

const ConsentReview = ({
  policy,
  formData,
  onSignatureSubmit,
}: ConsentReviewProps): JSX.Element => {
  const styles = useStyles();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const handleSignatureSubmit = (signature: string, date: Date): void => {
    onSignatureSubmit(signature, date);
    setLiveMessage(
      'Signature submitted successfully. Your consent has been recorded. You may select Finish when ready.',
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.ariaLive} aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
        Review Your Consent
      </h2>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Personal Information</Text>
        <Text>Name: {formData.name}</Text>
        <Text>Date of Birth: {formData.dob?.toLocaleDateString()}</Text>
        <Text>Age: {formatAge(formData.age)}</Text>
        <Text>
          Role:{' '}
          {formData.isProxy ? 'Proxy (Consenting on behalf of others)' : 'Self'}
        </Text>
      </div>

      {!formData.isProxy && (
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Granted Scopes</Text>
          <ul className={styles.list}>
            {formData.grantedScopes?.map((scopeId) => {
              const scope = policy.availableScopes.find(
                (s: PolicyScope) => s.key === scopeId,
              );
              return (
                <li key={scopeId}>
                  {scope?.name} ({scope?.description})
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {formData.isProxy &&
        formData.managedSubjects &&
        formData.managedSubjects.length > 0 && (
          <div className={styles.section}>
            <Text className={styles.sectionTitle}>Managed Proxies</Text>
            {formData.managedSubjects.map((subject, index) => (
              <div key={`subject-${index}`} className={styles.section}>
                <Text>Name: {subject.name}</Text>
                <Text>Date of Birth: {subject.dob?.toLocaleDateString()}</Text>
                <Text>Age: {formatAge(subject.age)}</Text>
                <br />
                <Text className={styles.sectionTitle}>Granted Scopes</Text>
                <ul className={styles.list}>
                  {subject.grantedScopes?.map((scopeId) => {
                    const scope = policy.availableScopes.find(
                      (s: PolicyScope) => s.key === scopeId,
                    );
                    return (
                      <li key={scopeId}>
                        {scope?.name} ({scope?.description})
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

      <div className={styles.signatureSection}>
        <Text>
          By signing below, you confirm that you have read and understood the
          consent form, and you agree to the terms and conditions outlined in
          this policy.
        </Text>
        <Signature onSignatureSubmit={handleSignatureSubmit} />
      </div>
    </div>
  );
};

export default ConsentReview;
