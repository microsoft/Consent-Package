import { useState, useMemo } from 'react';
import { Button, Text, Spinner } from '@fluentui/react-components';
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
import { useStyles } from './GetStarted.styles.js';
import { type StepGroupsConfigType, Stepper } from './Stepper.js';

type StepId = 'welcome' | 'scopes' | 'review' | `contentSection_${number}`;

const stepGroupsConfig: StepGroupsConfigType = {
  basicInfo: {
    label: 'Basic Information',
    primaryColorToken: 'colorBrandForeground1',
  },
  programDetails: {
    label: 'Program Details',
    primaryColorToken: 'colorPaletteGreenForeground2',
  },
  consent: {
    label: 'Consent',
    primaryColorToken: 'colorPaletteDarkOrangeForeground2',
  },
  reviewAndAgree: {
    label: 'Review & Agree',
    primaryColorToken: 'colorPaletteYellowForeground2',
  },
};

interface AppStep {
  id: StepId;
  label: string;
  groupId: string;
  groupLabel: string;
  primaryColorToken: string;
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

  const dynamicSteps = useMemo<AppStep[]>(() => {
    const steps: AppStep[] = [];
    const { basicInfo, programDetails, consent, reviewAndAgree } =
      stepGroupsConfig;

    steps.push({
      id: 'welcome',
      label: basicInfo.label,
      groupId: 'basicInfo',
      groupLabel: basicInfo.label,
      primaryColorToken: basicInfo.primaryColorToken,
    });

    if (policy) {
      policy.contentSections.forEach((section: PolicyContentSection, index) => {
        steps.push({
          id: `contentSection_${index}` as StepId,
          label: section.title,
          groupId: 'programDetails',
          groupLabel: programDetails.label,
          primaryColorToken: programDetails.primaryColorToken,
        });
      });
    }

    steps.push({
      id: 'scopes',
      label: consent.label,
      groupId: 'consent',
      groupLabel: consent.label,
      primaryColorToken: consent.primaryColorToken,
    });

    steps.push({
      id: 'review',
      label: reviewAndAgree.label,
      groupId: 'reviewAndAgree',
      groupLabel: reviewAndAgree.label,
      primaryColorToken: reviewAndAgree.primaryColorToken,
    });

    if (!policy && steps.length > 0) {
      return steps.filter((step) => step.groupId === 'basicInfo');
    }

    return steps;
  }, [policy]);

  const [currentStepId, setCurrentStepId] = useState<StepId>(
    dynamicSteps[0]?.id ?? 'welcome',
  );

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
      let hasRequiredScopes = true;
      if (policy && !formData.isProxy) {
        const requiredScopeKeys = policy.availableScopes
          .filter((s) => s.required)
          .map((s) => s.key);
        if (requiredScopeKeys.length > 0) {
          hasRequiredScopes = requiredScopeKeys.every((key) =>
            formData.grantedScopes?.includes(key),
          );
        }
      } else if (policy && formData.isProxy) {
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
      <Stepper
        steps={dynamicSteps}
        currentStepId={currentStepId}
        onStepClick={handleStepClick}
        stepGroupsConfig={stepGroupsConfig}
      />

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
