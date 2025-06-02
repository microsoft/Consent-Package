import { useRef, useEffect, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import {
  makeStyles,
  Text,
  Input,
  Button,
  tokens,
} from '@fluentui/react-components';
import type { Policy } from '@open-source-consent/types';
import AgeSelect from '../AgeSelect/index.js';
import RoleSelect from '../RoleSelect/index.js';
import type {
  ConsentFlowFormData,
  ConsentFlowManagedSubject,
} from './ConsentFlow.type.js';

interface ConsentWelcomeLabels {
  nameLabel?: string;
  dobLabel?: string;
  ageRestrictionEl?: JSX.Element;
  ageRestrictionMessage?: string;
  ageRestrictionLink?: string;
  ageRestrictionLinkText?: string;
  roleSelectionLabel?: string;
  managedSubjectsLabel?: string;
  addManagedSubjectButtonText?: string;
  removeButtonText?: string;
}

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
  uiLabels?: ConsentWelcomeLabels;
}

const defaultLabels: ConsentWelcomeLabels = {
  nameLabel: 'Please Enter your Full Name',
  dobLabel: 'Please Enter your Date of Birth',
  // To provide rich text, if wanted.
  //
  // If not provided, a default templated message will be displayed using
  // ageRestrictionMessage, ageRestrictionLink and ageRestrictionLinkText as shown below:
  // <>
  //   {ageRestrictionMessage} Please share{' '} <a href={ageRestrictionLink}>{ageRestrictionLinkText}</a>
  //   with your parent or guardian to continue.
  // </>
  //
  // Example Usage:
  // <>
  //   Research is great. But you must be at least 18 years old to consent on behalf of yourself
  //   or someone else to use this service. Please share <a href="#">this link</a>
  //   with your parent or guardian to continue.
  // </>
  ageRestrictionEl: undefined,
  ageRestrictionMessage:
    'Research is great. But you must be at least 18 years old to consent on behalf of yourself or someone else to use this service.',
  ageRestrictionLink: '#',
  ageRestrictionLinkText: 'this link',
  roleSelectionLabel:
    'Are you consenting on behalf of yourself or someone else?',
  managedSubjectsLabel: 'Consenting on behalf of:',
  addManagedSubjectButtonText: 'Add Managed Proxy',
  removeButtonText: 'Remove',
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
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

const ConsentWelcome = ({
  formData,
  policy,
  onFormDataChange,
  getSubjectId,
  subjectIdToDisplayName,
  uiLabels = {},
}: ConsentWelcomeProps): JSX.Element => {
  const styles = useStyles();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const conditionalAgeTextRef = useRef<HTMLParagraphElement>(null);

  const [liveMessage, setLiveMessage] = useState<string>('');

  const mergedLabels = { ...defaultLabels, ...uiLabels };

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

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

  const handleAgeChange = (
    ageRangeId: string,
    dob?: Date,
    age?: number,
  ): void => {
    handleFormDataChange({ ageRangeId, dob, age });

    if (age !== undefined) {
      if (age < 18) {
        setLiveMessage(
          'You must be at least 18 years old to consent. Please share this link with your parent or guardian to continue.',
        );
      } else {
        setLiveMessage(
          `Age verified: ${age} years old. You can now proceed with the consent process.`,
        );
      }

      setTimeout(() => {
        conditionalAgeTextRef.current?.focus();
      }, 100);
    }
  };

  const ageRestrictionEl: JSX.Element = mergedLabels.ageRestrictionEl ?? (
    <>
      {mergedLabels.ageRestrictionMessage} Please share{' '}
      <a href={mergedLabels.ageRestrictionLink}>
        {mergedLabels.ageRestrictionLinkText}
      </a>{' '}
      with your parent or guardian to continue.
    </>
  );

  return (
    <div className={styles.root}>
      <div className={styles.ariaLive} aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
        {policy.title}
      </h2>
      <div className={styles.form}>
        <Text weight="semibold">{mergedLabels.nameLabel}</Text>
        <Input
          value={formData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleFormDataChange({ name: e.target.value })
          }
          required
        />
        <Text weight="semibold">{mergedLabels.dobLabel}</Text>
        <AgeSelect
          initialDateValue={formData.dob}
          useDatePicker
          onChange={handleAgeChange}
        />

        {formData.age === undefined ? null : formData.age < 18 &&
          policy.requiresProxyForMinors === true ? (
          <Text ref={conditionalAgeTextRef} tabIndex={-1}>
            {ageRestrictionEl}
          </Text>
        ) : (
          <>
            <Text ref={conditionalAgeTextRef} weight="semibold" tabIndex={-1}>
              {mergedLabels.roleSelectionLabel}
            </Text>
            <RoleSelect
              initialRoleIdValue={formData.roleId}
              onChange={(roleId: string) =>
                handleFormDataChange({ roleId, isProxy: roleId === 'proxy' })
              }
              roles={
                formData.age !== undefined &&
                formData.age < 18 &&
                policy.requiresProxyForMinors === false
                  ? [
                      {
                        id: 'self',
                        label: 'Self',
                        description: 'I am providing consent for myself',
                      },
                    ]
                  : undefined
              }
            />
          </>
        )}

        {formData.isProxy && (
          <div className={styles.managedSubjectsForm}>
            <Text weight="semibold">{mergedLabels.managedSubjectsLabel}</Text>
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
                    {mergedLabels.removeButtonText}
                  </Button>
                  <Text weight="semibold">{mergedLabels.nameLabel}</Text>
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
                <Text weight="semibold">{mergedLabels.dobLabel}</Text>
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
              {mergedLabels.addManagedSubjectButtonText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentWelcome;
