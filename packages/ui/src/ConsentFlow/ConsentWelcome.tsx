import AgeSelect from "../AgeSelect/index.js";
import RoleSelect from "../RoleSelect/index.js";
import {
  makeStyles,
  Text,
  Title2,
  Input,
  Button,
  tokens,
} from "@fluentui/react-components";
import type { ChangeEvent } from "react";
import type { Policy } from "@open-source-consent/types";
import type {
  ConsentFlowFormData,
  ConsentFlowManagedSubject,
} from "./ConsentFlow.type.js";

interface ConsentWelcomeProps {
  policy: Policy;
  formData: ConsentFlowFormData;
  onFormDataChange(formData: ConsentFlowFormData): void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  managedSubjectsForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "16px",
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  managedSubject: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  managedSubjectHeader: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
});

const ConsentWelcome = ({
  formData,
  policy,
  onFormDataChange,
}: ConsentWelcomeProps): JSX.Element => {
  const styles = useStyles();

  const handleFormDataChange = (
    updates: Partial<ConsentFlowFormData>
  ): void => {
    const newFormData = { ...formData, ...updates };
    onFormDataChange(newFormData);
  };

  const handleAddSubject = (): void => {
    const newFormData = {
      ...formData,
      managedSubjects: [
        ...formData.managedSubjects,
        {
          id: crypto.randomUUID(),
          name: "",
          ageRangeId: "",
        },
      ],
    };
    onFormDataChange(newFormData);
  };

  const handleRemoveSubject = (id: string): void => {
    const newFormData = {
      ...formData,
      managedSubjects: formData.managedSubjects.filter(
        (subject) => subject.id !== id
      ),
    };
    onFormDataChange(newFormData);
  };

  const handleManagedSubjectChange = (
    id: string,
    updates: Partial<ConsentFlowManagedSubject>
  ): void => {
    const newFormData = {
      ...formData,
      managedSubjects: formData.managedSubjects.map((subject) =>
        subject.id === id ? { ...subject, ...updates } : subject
      ),
    };
    onFormDataChange(newFormData);
  };

  return (
    <div className={styles.root}>
      <Title2 align="center">{policy.title}</Title2>
      <div className={styles.form}>
        <Text weight="semibold">Please Enter your Full Name</Text>
        <Input
          value={formData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleFormDataChange({ name: e.target.value })
          }
          required
        />
        <Text weight="semibold">Please Enter your Date of Birth</Text>
        <AgeSelect
          initialDateValue={formData.dob}
          useDatePicker
          onChange={(ageRangeId: string, dob?: Date, age?: number) =>
            handleFormDataChange({ ageRangeId, dob, age })
          }
        />

        {formData.age === undefined ? null : formData.age < 18 ? (
          <Text>
            Research is great. But you must be at least 18 years old to consent
            on behalf of yourself or someone else to use this service. Please
            share <a href="#">this link</a> with your parent or guardian to
            continue.
          </Text>
        ) : (
          <>
            <Text weight="semibold">
              Are you consenting on behalf of someone else?
            </Text>
            <RoleSelect
              initialRoleIdValue={formData.roleId}
              onChange={(roleId: string) =>
                handleFormDataChange({ roleId, isProxy: roleId === "proxy" })
              }
            />
          </>
        )}

        {formData.isProxy && (
          <div className={styles.managedSubjectsForm}>
            <Text weight="semibold">Consenting on behalf of:</Text>
            {formData.managedSubjects.map((subject) => (
              <div key={subject.id} className={styles.managedSubject}>
                <div className={styles.managedSubjectHeader}>
                  <Button
                    appearance="subtle"
                    onClick={() => handleRemoveSubject(subject.id)}
                  >
                    Remove
                  </Button>
                  <Text weight="semibold">Full Name</Text>
                </div>
                <Input
                  value={subject.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleManagedSubjectChange(subject.id, {
                      name: e.target.value,
                    })
                  }
                  required
                />
                <Text weight="semibold">Date of Birth</Text>
                <AgeSelect
                  initialDateValue={subject.dob}
                  useDatePicker
                  onChange={(ageRangeId: string, dob?: Date, age?: number) =>
                    handleManagedSubjectChange(subject.id, {
                      ageRangeId,
                      dob,
                      age,
                    })
                  }
                />
              </div>
            ))}
            <Button appearance="secondary" onClick={handleAddSubject}>
              Add Subject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentWelcome;
