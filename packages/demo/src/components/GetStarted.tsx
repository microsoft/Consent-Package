// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Button,
  Text,
  Spinner,
  Title1,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import type {
  DialogOpenChangeData,
  DialogOpenChangeEvent,
} from '@fluentui/react-components';
import {
  ConsentWelcome,
  ConsentScopes,
  ConsentReview,
  useConsentFlow,
  ConsentContentSectionStep,
  ConsentConfirmation,
} from '@open-source-consent/ui';
import type { ConsentFlowFormData } from '@open-source-consent/ui';
import type { PolicyContentSection } from '@open-source-consent/types';
import { useAuth } from '../utils/useAuth.js';
import { useStyles } from './GetStarted.styles.js';
import {
  type StepGroupsConfigType,
  Stepper,
  type AppStep,
  type StepId as StepperStepId,
} from './Stepper.js';
import { Important24Filled, PeopleTeam24Filled } from '@fluentui/react-icons';

export type StepId = StepperStepId;

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

export default function GetStarted(): JSX.Element {
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
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);

  const [guardianConsentConfirmed, setGuardianConsentConfirmed] =
    useState(false);
  const [proxyDiscussionConfirmed, setProxyDiscussionConfirmed] =
    useState(false);

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

      if (
        formData.age !== undefined &&
        formData.age < 18 &&
        !formData.isProxy
      ) {
        steps.push({
          id: 'guardianReminder',
          label: 'Guardian Approval',
          groupId: 'consent',
          groupLabel: consent.label,
          primaryColorToken: consent.primaryColorToken,
        });
      }

      if (formData.isProxy && formData.managedSubjects.length > 0) {
        steps.push({
          id: 'proxyReminder',
          label: 'Proxy Confirmation',
          groupId: 'consent',
          groupLabel: consent.label,
          primaryColorToken: consent.primaryColorToken,
        });
      }
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
  }, [policy, formData]);

  const [currentStepId, setCurrentStepId] = useState<StepId>(
    dynamicSteps[0]?.id ?? ('welcome' as StepId),
  );

  const currentStepIndex = useMemo(
    () => dynamicSteps.findIndex((step) => step.id === currentStepId),
    [dynamicSteps, currentStepId],
  );

  const [maxVisitedStepIndex, setMaxVisitedStepIndex] = useState<number>(-1);

  useEffect(() => {
    if (currentStepIndex > -1 && dynamicSteps.length > 0) {
      setMaxVisitedStepIndex((prevMax) => {
        const newMax = Math.max(prevMax, currentStepIndex);
        return Math.min(newMax, dynamicSteps.length - 1);
      });
    } else if (dynamicSteps.length === 0) {
      setMaxVisitedStepIndex(-1);
    }
  }, [currentStepIndex, dynamicSteps.length]);

  const getStepValidity = useCallback(
    (stepIdToEvaluate: StepId): boolean => {
      const isReviewStepEval = stepIdToEvaluate === 'review';
      const isContentSectionStepEval =
        stepIdToEvaluate.startsWith('contentSection_');
      const isScopesStepEval = stepIdToEvaluate === 'scopes';
      const isGuardianReminderStepEval =
        stepIdToEvaluate === 'guardianReminder';
      const isProxyReminderStepEval = stepIdToEvaluate === 'proxyReminder';

      if (isContentSectionStepEval) {
        return true;
      } else if (isGuardianReminderStepEval) {
        return guardianConsentConfirmed;
      } else if (isProxyReminderStepEval) {
        return proxyDiscussionConfirmed;
      } else if (isReviewStepEval) {
        return !!formData.signature && formData.signature.length > 0;
      } else if (isScopesStepEval) {
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
    },
    [
      isFormValid,
      formData,
      policy,
      guardianConsentConfirmed,
      proxyDiscussionConfirmed,
    ],
  );

  const isStepValid = useMemo(() => {
    if (currentStepId === null || currentStepIndex < 0) return false;
    return getStepValidity(currentStepId);
  }, [currentStepId, currentStepIndex, getStepValidity]);

  const executeFinish = useCallback(async (): Promise<void> => {
    if (saveConsent) {
      await saveConsent();
      if (!error) {
        try {
          const subjectId = formData.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '.');
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
  }, [saveConsent, error, formData, login]);

  const handleNext = async (): Promise<void> => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < dynamicSteps.length) {
      setCurrentStepId(dynamicSteps[nextIndex].id);
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
    } else {
      setIsFinishDialogOpen(true);
    }
  };

  const handlePrevious = (): void => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepId(dynamicSteps[prevIndex].id);
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 0);
    }
  };

  const handleStepClick = (clickedStepId: StepId): void => {
    const clickedStepIndex = dynamicSteps.findIndex(
      (step) => step.id === clickedStepId,
    );

    if (clickedStepIndex === -1) {
      return;
    }

    if (clickedStepIndex <= maxVisitedStepIndex) {
      setCurrentStepId(clickedStepId);
    } else {
      const validationCandidateIndex = maxVisitedStepIndex;

      if (
        validationCandidateIndex < 0 ||
        validationCandidateIndex >= dynamicSteps.length
      ) {
        if (clickedStepIndex === 0 && dynamicSteps.length > 0) {
          setCurrentStepId(dynamicSteps[0].id);
        }
        return;
      }

      const stepToValidateId = dynamicSteps[validationCandidateIndex].id;
      const isStepToValidateComplete = getStepValidity(stepToValidateId);

      if (clickedStepIndex === validationCandidateIndex + 1) {
        if (isStepToValidateComplete) {
          setCurrentStepId(clickedStepId);
        } else {
          setCurrentStepId(stepToValidateId);
        }
      } else {
        if (!isStepToValidateComplete) {
          setCurrentStepId(stepToValidateId);
        }
      }
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
          // uiLabels is an optional prop that allows you to override the default labels as shown below.
          /* uiLabels={{
            nameLabel: 'Please Enter your Full Name',
            dobLabel: 'Please Enter your Date of Birth',
            ageRestrictionEl: undefined,
            ageRestrictionMessage:
              'Research is great. But you must be at least 18 years old to consent on behalf of yourself or someone else to use this service.',
            ageRestrictionLink: '#',
            ageRestrictionLinkText: 'this link',
            roleSelectionLabel: 'Are you consenting on behalf of yourself or someone else?',
            managedSubjectsLabel: 'Consenting on behalf of:',
            addManagedSubjectButtonText: 'Add Managed Proxy',
            removeButtonText: 'Remove',
          }} */
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
          // uiLabels is an optional prop that allows you to override the default labels as shown below.
          /* uiLabels={{
            title: 'Select Data Access Permissions',
            descriptionWithRequired:
              'Select additional data you wish to authorize for use with this service. You can edit data permissions at any time. Mandatory permissions cannot be modified.',
            descriptionWithoutRequired:
              'Select the data you wish to authorize for use with this service. You can edit data permissions at any time. At least one permission must be enabled to proceed.',
            managedProxiesLabel: 'Managed Proxies Permissions',
            previousSubjectButtonText: 'Previous Subject',
            nextSubjectButtonText: 'Next Subject',
            mandatoryScopeSuffix: '(Mandatory)',
          }} */
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
          // uiLabels is an optional prop that allows you to override the default labels as shown below.
          /* uiLabels={{
            title: 'Review Your Consent',
            personalInfoLabel: 'Personal Information',
            nameLabel: 'Name',
            dobLabel: 'Date of Birth',
            ageLabel: 'Age',
            roleLabel: 'Role',
            roleSelfValue: 'Self',
            roleProxyValue: 'Proxy (Consenting on behalf of others)',
            grantedScopesLabel: 'Granted Scopes',
            managedProxiesLabel: 'Managed Proxies',
            signatureMessage:
              'By signing below, you confirm that you have read and understood the consent form, and you agree to the terms and conditions outlined in this policy.',
            signatureSuccessMessage:
              'Signature submitted successfully. Your consent has been recorded. You may select Finish when ready.',
          }} */
        />
      );
    } else if (currentStepId === 'guardianReminder') {
      return (
        <ConsentConfirmation
          title="Important: Guardian Approval Needed"
          icon={<Important24Filled aria-hidden />}
          messageBody={
            <Text>
              Hi {formData.name || 'there'}! Since you are under 18, it's
              important to talk to your parent or guardian about this. Please
              make sure they review this information and give you permission to
              proceed.
            </Text>
          }
          checkboxLabel="I have discussed this with my parent or guardian, and they have approved my participation."
          isChecked={guardianConsentConfirmed}
          onCheckboxChange={setGuardianConsentConfirmed}
        />
      );
    } else if (currentStepId === 'proxyReminder') {
      const subjectName = formData.managedSubjects[0]?.name || 'the individual';
      return (
        <ConsentConfirmation
          title={`Important: Discuss with ${subjectName}`}
          icon={<PeopleTeam24Filled aria-hidden />}
          messageBody={
            <Text>
              Hi {formData.name || 'there'}! As you are consenting on behalf of
              {subjectName !== 'the individual'
                ? ` ${subjectName}`
                : ' someone else'}
              , please ensure you have discussed this information with them to
              the best of their understanding and that they agree to
              participate.
            </Text>
          }
          checkboxLabel={`I have discussed this with ${subjectName} and confirmed their willingness to participate.`}
          isChecked={proxyDiscussionConfirmed}
          onCheckboxChange={setProxyDiscussionConfirmed}
        />
      );
    }
    return null;
  };

  return (
    <div className={styles.root}>
      <Title1
        as="h1"
        weight="semibold"
        align="center"
        block
        style={{ marginBottom: '24px' }}
      >
        Get Started with Consent Package
      </Title1>
      <Text size={400} align="center" block style={{ marginBottom: '32px' }}>
        Follow the steps below to configure and implement consent management for
        your application. You'll review program details, set consent
        preferences, and complete the consent process.
      </Text>
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
            ((currentStepId === 'welcome' ||
              currentStepId === 'review' ||
              currentStepId === 'guardianReminder' ||
              currentStepId === 'proxyReminder') &&
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

      {isFinishDialogOpen && (
        <Dialog
          open={isFinishDialogOpen}
          onOpenChange={(
            _event: DialogOpenChangeEvent,
            data: DialogOpenChangeData,
          ) => {
            if (!data.open) {
              setIsFinishDialogOpen(false);
            }
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Consent Saved</DialogTitle>
              <DialogContent>
                <Text>
                  You can now navigate to the user menu in the top right corner
                  and click "View Profile" to view or edit any consents you have
                  given. You can also click "Restart Demo" to start over.
                </Text>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="primary"
                  onClick={async () => {
                    setIsFinishDialogOpen(false);
                    await executeFinish();
                  }}
                >
                  Confirm
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}
