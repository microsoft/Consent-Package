import AgeSelect from '../AgeSelect/index.js';
import RoleSelect from '../RoleSelect/index.js';
import {
  makeStyles,
  Text,
  Title2,
  Input,
  Button,
  tokens,
} from '@fluentui/react-components';
import type { ChangeEvent, FocusEvent } from 'react';
import type { Policy } from '@open-source-consent/types';
import type {
  ConsentFlowFormData,
  ConsentFlowManagedSubject,
} from './ConsentFlow.type.js';

interface ConsentWelcomeProps {
  policy: Policy;
  formData: ConsentFlowFormData;
  onFormDataChange(formData: ConsentFlowFormData): void;
  /**
   * Function to get a subject ID based on the subject's name.
   * The consumer of this component is responsible for determining how subject IDs are generated
   * and provided including any authentication, authentication, or verification
   */
  getSubjectId(name: string): string;
  /**
   * Convert a subject ID to a display name.
   */
  subjectIdToDisplayName(subjectId: string): string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  managedSubjectsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
  },
  managedSubject: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
  },
  managedSubjectHeader: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});

const ConsentWelcome = ({
  formData,
  policy,
  onFormDataChange,
  getSubjectId,
  subjectIdToDisplayName,
}: ConsentWelcomeProps): JSX.Element => {
  const styles = useStyles();

  const handleFormDataChange = (
    updates: Partial<ConsentFlowFormData>,
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
          id: '',
          name: '',
          ageRangeId: '',
        },
      ],
    };
    onFormDataChange(newFormData);
  };

  const handleRemoveSubject = (index: number): void => {
    const newFormData = {
      ...formData,
      managedSubjects: formData.managedSubjects.filter((_, i) => i !== index),
    };
    onFormDataChange(newFormData);
  };

  const handleManagedSubjectChange = (
    index: number,
    updates: Partial<ConsentFlowManagedSubject>,
  ): void => {
    const newFormData = {
      ...formData,
      managedSubjects: formData.managedSubjects.map((subject, i) => {
        if (i === index) {
          return { ...subject, ...updates };
        }
        return subject;
      }),
    };
    onFormDataChange(newFormData);
  };

  const handleManagedSubjectBlur = (
    index: number,
    e: FocusEvent<HTMLInputElement>,
  ): void => {
    const name = e.target.value.trim();
    if (name === '') return;

    const subject = formData.managedSubjects[index];
    const newId = getSubjectId(name);

    // Only update if the ID would change
    if (!subject.id || subject.name !== name) {
      const newFormData = {
        ...formData,
        managedSubjects: formData.managedSubjects.map((subject, i) => {
          if (i === index) {
            return {
              ...subject,
              id: newId,
            };
          }
          return subject;
        }),
      };
      onFormDataChange(newFormData);
    }
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
              Are you consenting on behalf of yourself or someone else?
            </Text>
            <RoleSelect
              initialRoleIdValue={formData.roleId}
              onChange={(roleId: string) =>
                handleFormDataChange({ roleId, isProxy: roleId === 'proxy' })
              }
            />
          </>
        )}

        {formData.isProxy && (
          <div className={styles.managedSubjectsForm}>
            <Text weight="semibold">Consenting on behalf of:</Text>
            {formData.managedSubjects.map((subject, index) => (
              <div
                key={subject.id || `temp-key-${index}`}
                className={styles.managedSubject}
              >
                <div className={styles.managedSubjectHeader}>
                  <Button
                    appearance="outline"
                    onClick={() => handleRemoveSubject(index)}
                  >
                    Remove
                  </Button>
                  <Text weight="semibold">Full Name</Text>
                </div>
                <Input
                  value={subject.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleManagedSubjectChange(index, {
                      name: e.target.value,
                    })
                  }
                  onBlur={(e: FocusEvent<HTMLInputElement>) =>
                    handleManagedSubjectBlur(index, e)
                  }
                  required
                />
                <Text weight="semibold">Date of Birth</Text>
                <AgeSelect
                  initialDateValue={subject.dob}
                  useDatePicker
                  onChange={(ageRangeId: string, dob?: Date, age?: number) =>
                    handleManagedSubjectChange(index, {
                      ageRangeId,
                      dob,
                      age,
                    })
                  }
                />
              </div>
            ))}
            <Button appearance="outline" onClick={handleAddSubject}>
              Add Subject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentWelcome;
