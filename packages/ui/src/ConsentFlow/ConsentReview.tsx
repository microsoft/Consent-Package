import { makeStyles, Text, Title2, tokens } from "@fluentui/react-components";
import Signature from "../Signature/index.js";
import type { ConsentFlowFormData, ConsentFlowPolicy } from "./ConsentFlow.type.js";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "4px",
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  signatureSection: {
    marginTop: "24px",
    "& > :last-child": {
      marginTop: "16px",
    },
  },
  list: {
    paddingLeft: "16px",
    margin: "8px 0",
    "& > li": {
      marginBottom: "4px",
    },
  },
});

interface ConsentReviewProps {
  policy: ConsentFlowPolicy;
  formData: ConsentFlowFormData;
  onSignatureSubmit(signature: string, date: Date): void;
}

const formatAge = (age: number | undefined): string => {
  if (age === undefined) return 'N/A';

  if (age < 1) return 'less than 1 year old';
  else return age === 1 ? `${age} year old` : `${age} years old`;
};

const ConsentReview = ({ policy, formData, onSignatureSubmit }: ConsentReviewProps): JSX.Element => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Title2>Review Your Consent</Title2>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Personal Information</Text>
        <Text>Name: {formData.name}</Text>
        <Text>Date of Birth: {formData.dob?.toLocaleDateString()}</Text>
        <Text>Age: {formatAge(formData.age)}</Text>
        <Text>Role: {formData.isProxy ? "Proxy (Consenting on behalf of others)" : "Self"}</Text>
      </div>

      {!formData.isProxy && <div className={styles.section}>
        <Text className={styles.sectionTitle}>Granted Scopes</Text>
        <ul className={styles.list}>
          {formData.grantedScopes?.map(scopeId => {
            const scope = policy.scopes.find(s => s.key === scopeId);
            return (
              <li key={scopeId}>
                {scope?.name} ({scope?.description})
              </li>
            );
          })}
        </ul>
      </div>}

      {formData.isProxy && formData.managedSubjects && formData.managedSubjects.length > 0 && (
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Managed Subjects</Text>
          {formData.managedSubjects.map((subject) => (
            <div key={subject.id} className={styles.section}>
              <Text>Name: {subject.name}</Text>
              <Text>Date of Birth: {subject.dob?.toLocaleDateString()}</Text>
              <Text>Age: {formatAge(subject.age)}</Text>
              <br />
              <Text className={styles.sectionTitle}>Granted Scopes</Text>
              <ul className={styles.list}>
                {subject.grantedScopes?.map(scopeId => {
                  const scope = policy.scopes.find(s => s.key === scopeId);
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
          By signing below, you confirm that you have read and understood the consent form,
          and you agree to the terms and conditions outlined in this policy.
        </Text>
        <Signature onSignatureSubmit={onSignatureSubmit} />
      </div>
    </div>
  );
}

export default ConsentReview;
