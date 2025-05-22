import { useState, useMemo } from 'react';
import {
  makeStyles,
  Button,
  tokens,
  Text,
  Spinner,
} from '@fluentui/react-components';
import {
  ConsentWelcome,
  ConsentScopes,
  ConsentReview,
  useConsentFlow,
  ConsentContentSectionStep,
} from '@open-source-consent/ui';
import type { ConsentFlowFormData } from '@open-source-consent/ui';
import type { PolicyContentSection } from '@open-source-consent/types';
import { useAuth } from '../utils/useAuth.js';

const useStyles = makeStyles({
  root: {
    padding: '24px 64px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      padding: '24px',
    },
  },
  stepper: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '48px',
    position: 'relative',
    padding: '0 16px',
    paddingTop: '4px',
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
      gap: '12px',
      paddingBottom: '8px',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '20px',
      left: '40px',
      right: '40px',
      height: '3px',
      backgroundColor: tokens.colorNeutralStroke1,
      zIndex: 0,
      transition: 'background-color 0.3s ease',
      '@media (max-width: 768px)': {
        left: '20px',
        right: '20px',
      },
    },
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    transition: 'transform 0.2s ease',
    minWidth: '80px',
    textAlign: 'center',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
    '@media (max-width: 768px)': {
      minWidth: '60px',
      flexShrink: 0,
    },
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid',
    background: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    boxShadow: tokens.shadow2,
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      width: '32px',
      height: '32px',
      fontSize: '14px',
      marginBottom: '8px',
    },
  },
  stepNumberActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
    transform: 'scale(1.1)',
  },
  stepLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
    transition: 'color 0.3s ease',
    '@media (max-width: 768px)': {
      fontSize: '10px',
      maxWidth: '60px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  slide: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  navigation: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '24px',
    '& button:first-child': {
      marginRight: '8px',
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
});

const baseSteps = [
  { id: 'welcome' as const, label: 'Welcome' },
  { id: 'scopes' as const, label: 'Scopes' },
  { id: 'review' as const, label: 'Review & Sign' },
] as const;

type StepId = (typeof baseSteps)[number]['id'] | `contentSection_${number}`;

interface Step {
  id: StepId;
  label: string;
}

export function GetStarted(): JSX.Element {
  const styles = useStyles();
  const {
    policy,
    formData,
    isFormValid,
    isLoading,
    error,
    setFormData,
    updateScopes,
    saveConsent,
  } = useConsentFlow('sample-group-1');
  const { isLoading: isAuthLoading, login } = useAuth();

  const isPageLoading = isLoading || isAuthLoading;

  const dynamicSteps = useMemo<Step[]>(() => {
    if (!policy) return baseSteps.filter((step) => step.id === 'welcome');

    const contentSectionSteps: Step[] = policy.contentSections.map(
      (section: PolicyContentSection, index) => ({
        id: `contentSection_${index}` as StepId,
        label:
          section.title.length > 15
            ? `${section.title.substring(0, 12)}...`
            : section.title,
      }),
    );

    return [
      baseSteps.find((s) => s.id === 'welcome')!,
      ...contentSectionSteps,
      ...baseSteps.filter((s) => s.id !== 'welcome'),
    ];
  }, [policy]);

  const [currentStepId, setCurrentStepId] = useState<StepId>('welcome');

  const currentStepIndex = useMemo(
    () => dynamicSteps.findIndex((step) => step.id === currentStepId),
    [dynamicSteps, currentStepId],
  );

  const isStepValid = useMemo(() => {
    const isReviewStep = currentStepId === 'review';
    const isContentSectionStep = currentStepId.startsWith('contentSection_');
    const isScopesStep = currentStepId === 'scopes';

    if (isContentSectionStep) {
      return true;
    } else if (isReviewStep) {
      return !!formData.signature && formData.signature.length > 0;
    } else if (isScopesStep) {
      // For scopes, we always need to check that required scopes exist
      let hasRequiredScopes = true;
      if (policy && !formData.isProxy) {
        // Only for self-consenter for now
        const requiredScopeKeys = policy.availableScopes
          .filter((s) => s.required)
          .map((s) => s.key);
        if (requiredScopeKeys.length > 0) {
          hasRequiredScopes = requiredScopeKeys.every((key) =>
            formData.grantedScopes?.includes(key),
          );
        }
      } else if (policy && formData.isProxy) {
        // If proxy, check required scopes for each subject
        const requiredScopeKeys = policy.availableScopes
          .filter((s) => s.required)
          .map((s) => s.key);
        if (requiredScopeKeys.length > 0) {
          hasRequiredScopes = formData.managedSubjects.every((subject) =>
            requiredScopeKeys.every((key) =>
              subject.grantedScopes?.includes(key),
            ),
          );
        }
      }
      return isFormValid && hasRequiredScopes;
    } else {
      return isFormValid;
    }
  }, [currentStepId, isFormValid, formData, policy]);

  const handleNext = async (): Promise<void> => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < dynamicSteps.length) {
      setCurrentStepId(dynamicSteps[nextIndex].id);
    } else {
      if (saveConsent) {
        await saveConsent();
        if (!error) {
          try {
            const subjectId = formData.name.trim();
            // Will push to '/' because of routing rules
            await login(subjectId);
          } catch (err) {
            console.error('Login failed:', err);
            alert('Unable to login. Please contact support.');
          }
        }
      } else {
        console.error('saveConsent function is not available.');
        alert('Unable to save consent. Please contact support.');
      }
    }
  };

  const handlePrevious = (): void => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepId(dynamicSteps[prevIndex].id);
    }
  };

  const handleStepClick = (stepId: StepId): void => {
    const targetStepIndex = dynamicSteps.findIndex(
      (step) => step.id === stepId,
    );

    if (!isStepValid) return;

    if (stepId === 'welcome') {
      setCurrentStepId(stepId);
      return;
    }

    if (targetStepIndex <= currentStepIndex + 1) {
      if ((stepId === 'scopes' || stepId === 'review') && !isStepValid) {
        console.warn('Cannot proceed, form is not valid.');
        return;
      }
      setCurrentStepId(stepId);
    }
  };

  const renderSlide = (): JSX.Element | null => {
    if (isPageLoading && !policy) {
      return (
        <div className={styles.loading}>
          <Spinner label="Loading policy..." />
        </div>
      );
    }

    if (!policy) {
      return (
        <div className={styles.loading}>
          <Text size={500} weight="semibold">
            Policy Not Found
          </Text>
        </div>
      );
    }

    if (currentStepId === 'welcome') {
      return (
        <ConsentWelcome
          formData={formData}
          policy={policy}
          onFormDataChange={(data: ConsentFlowFormData): void => {
            setFormData(data);
          }}
          /**
           * This function is for demo purposes only.
           * In real-world applications, the consumer of this component
           * would likely want to connect this to their own
           * user management and authentication system.
           */
          getSubjectId={(name: string): string => {
            return name;
          }}
          /**
           * For the demo, the subject ID is the same as the display name.
           * In real-world applications, you would provide a function that
           * converts the subject ID to an appropriate display name.
           */
          subjectIdToDisplayName={(subjectId: string): string => {
            return subjectId;
          }}
        />
      );
    } else if (currentStepId.startsWith('contentSection_')) {
      const sectionIndex = parseInt(currentStepId.split('_')[1], 10);
      const section = policy.contentSections[sectionIndex];
      if (section) {
        return <ConsentContentSectionStep section={section} />;
      }
      return <Text>Content section not found.</Text>;
    } else if (currentStepId === 'scopes') {
      return (
        <ConsentScopes
          formData={formData}
          availableScopes={policy.availableScopes}
          onChange={(
            scopeId: string,
            isChecked: boolean,
            subjectIndex?: number,
          ) => {
            updateScopes(scopeId, isChecked, subjectIndex);
          }}
        />
      );
    } else if (currentStepId === 'review') {
      return (
        <ConsentReview
          policy={policy}
          formData={formData}
          onSignatureSubmit={(signature: string, date: Date) => {
            setFormData({
              ...formData,
              signature,
              grantedAt: date,
            });
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className={styles.root}>
      <div className={styles.stepper}>
        {dynamicSteps.map((step, index) => (
          <div
            key={step.id}
            className={styles.step}
            onClick={() => handleStepClick(step.id)}
          >
            <div
              className={`${styles.stepNumber} ${
                currentStepIndex === index ? styles.stepNumberActive : ''
              }`}
            >
              {index + 1}
            </div>
            <Text className={styles.stepLabel}>{step.label}</Text>
          </div>
        ))}
      </div>

      <div className={styles.slide}>{renderSlide()}</div>

      <div className={styles.navigation}>
        {currentStepIndex > 0 && (
          <Button appearance="secondary" onClick={handlePrevious}>
            Previous
          </Button>
        )}
        <Button
          appearance="primary"
          onClick={handleNext}
          disabled={
            isPageLoading ||
            ((currentStepId === 'welcome' || currentStepId === 'review') &&
              !isStepValid) ||
            (!currentStepId.startsWith('contentSection_') && !isStepValid)
          }
        >
          {isPageLoading && currentStepIndex === dynamicSteps.length - 1 ? (
            <Spinner size="tiny" />
          ) : currentStepIndex === dynamicSteps.length - 1 ? (
            'Finish'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}
