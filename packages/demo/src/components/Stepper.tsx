// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useMemo } from 'react';
import { Text, tokens } from '@fluentui/react-components';
import { useStyles } from './GetStarted.styles.js';

export type StepId =
  | 'welcome'
  | 'guardianReminder'
  | 'proxyReminder'
  | 'scopes'
  | 'review'
  | `contentSection_${string}`;

export interface AppStep {
  id: StepId;
  label: string;
  groupId: string;
  groupLabel: string;
  primaryColorToken: string;
}

export interface StepGroupsConfigType {
  [key: string]: {
    label: string;
    primaryColorToken: string;
  };
}

interface StepperComponentProps {
  steps: AppStep[];
  currentStepId: StepId;
  onStepClick(stepId: StepId): void;
  stepGroupsConfig: StepGroupsConfigType;
}

export function Stepper({
  steps,
  currentStepId,
  onStepClick,
  stepGroupsConfig,
}: StepperComponentProps): JSX.Element {
  const styles = useStyles();

  const groupedSteps = useMemo(() => {
    if (!steps.length) return [];
    const orderedGroupIds = Object.keys(stepGroupsConfig);

    const acc: Record<
      string,
      {
        groupId: string;
        groupLabel: string;
        primaryColorToken: string;
        steps: AppStep[];
        stepCount: number;
      }
    > = {};

    orderedGroupIds.forEach((groupId) => {
      const stepsInGroup = steps.filter((step) => step.groupId === groupId);
      if (stepsInGroup.length > 0) {
        const groupConfig = stepGroupsConfig[groupId];
        acc[groupId] = {
          groupId,
          groupLabel: groupConfig.label,
          primaryColorToken: groupConfig.primaryColorToken,
          steps: stepsInGroup,
          stepCount: stepsInGroup.length,
        };
      }
    });
    return Object.values(acc);
  }, [steps, stepGroupsConfig]);

  return (
    <div className={styles.stepperWrapper}>
      {groupedSteps.length > 0 && (
        <div className={styles.groupLabelsContainer}>
          {groupedSteps.map((group) => (
            <div
              key={group.groupId}
              className={styles.groupLabelItem}
              style={{
                flexGrow: group.stepCount,
              }}
              aria-label={`Steps Group ${group.groupLabel} with ${group.stepCount} ${group.stepCount === 1 ? 'step' : 'steps'}`}
            >
              <Text
                className={styles.groupLabelText}
                style={{
                  color: group.primaryColorToken,
                }}
                aria-hidden="true"
              >
                {group.groupLabel}
              </Text>
            </div>
          ))}
        </div>
      )}
      <div className={styles.stepper}>
        {steps.map((step, index) => {
          const isActive = currentStepId === step.id;
          const stepPrimaryColor = step.primaryColorToken;

          return (
            <div
              key={step.id}
              className={styles.step}
              onClick={() => onStepClick(step.id)}
              style={{ flexGrow: 1, flexBasis: '0' }}
              aria-label={`Step ${index + 1}: ${step.label} from Steps Group ${step.groupLabel}`}
            >
              <div
                className={`${styles.stepNumber} ${
                  isActive ? styles.stepNumberActive : ''
                }`}
                style={{
                  backgroundColor: isActive
                    ? stepPrimaryColor
                    : tokens.colorNeutralBackground1,
                  borderColor: stepPrimaryColor,
                  color: isActive
                    ? tokens.colorNeutralForegroundInverted
                    : stepPrimaryColor,
                }}
                aria-hidden="true"
              >
                {index + 1}
              </div>
              <Text
                className={styles.stepLabel}
                style={{
                  color: stepPrimaryColor,
                }}
                aria-hidden="true"
              >
                {step.label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
