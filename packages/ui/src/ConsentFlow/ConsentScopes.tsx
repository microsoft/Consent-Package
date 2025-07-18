// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  makeStyles,
  Text,
  Checkbox,
  tokens,
  Button,
} from '@fluentui/react-components';
import type { ConsentFlowFormData } from './ConsentFlow.type.js';
import type { PolicyScope } from '@open-source-consent/types';

interface ConsentScopesLabels {
  title?: string;
  descriptionWithRequired?: string;
  descriptionWithoutRequired?: string;
  managedProxiesLabel?: string;
  previousSubjectButtonText?: string;
  nextSubjectButtonText?: string;
  mandatoryScopeSuffix?: string;
}

interface ConsentScopesProps {
  formData: ConsentFlowFormData;
  availableScopes: readonly PolicyScope[];
  onChange(scopeId: string, isChecked: boolean, subjectIndex?: number): void;
  uiLabels?: ConsentScopesLabels;
}

const defaultLabels: ConsentScopesLabels = {
  title: 'Select Data Access Permissions',
  descriptionWithRequired:
    'Select additional data you wish to authorize for use with this service. You can edit data permissions at any time. Mandatory permissions cannot be modified.',
  descriptionWithoutRequired:
    'Select the data you wish to authorize for use with this service. You can edit data permissions at any time. At least one permission must be enabled to proceed.',
  managedProxiesLabel: 'Managed Proxies Permissions',
  previousSubjectButtonText: 'Previous Subject',
  nextSubjectButtonText: 'Next Subject',
  mandatoryScopeSuffix: '(Mandatory)',
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
  scope: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  subjectSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '24px',
  },
  subjectPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  subjectHeader: {
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '16px',
  },
  slideIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  slideDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralStroke1,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  activeSlideDot: {
    backgroundColor: tokens.colorBrandBackground,
    transform: 'scale(1.2)',
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
  },
});

const ConsentScopes = ({
  formData,
  availableScopes,
  onChange,
  uiLabels = {},
}: ConsentScopesProps): JSX.Element => {
  const styles = useStyles();
  const [currentSlide, setCurrentSlide] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const mergedLabels = { ...defaultLabels, ...uiLabels };

  const requiredScopes = availableScopes
    .filter((scope) => scope.required)
    .map((scope) => scope.key);

  const {
    isProxy,
    managedSubjects,
    grantedScopes: selfGrantedScopes,
  } = formData;

  useEffect(() => {
    if (!isProxy) {
      for (const requiredScope of requiredScopes) {
        onChange(requiredScope, true);
      }
    } else {
      for (const requiredScope of requiredScopes) {
        for (let i = 0; i < managedSubjects.length; i++) {
          onChange(requiredScope, true, i);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const handleScopeChange = (
    scopeId: string,
    isChecked: boolean,
    subjectIndex?: number,
  ): void => {
    onChange(scopeId, isChecked, subjectIndex);
  };

  const handleNextSubject = (): void => {
    if (managedSubjects && currentSlide < managedSubjects.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePreviousSubject = (): void => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSlideClick = (index: number): void => {
    setCurrentSlide(index);
  };

  const scopeCheckbox = (
    scope: PolicyScope,
    subjectScopes?: string[],
    subjectIndex?: number,
  ): JSX.Element => {
    return (
      <>
        <Checkbox
          label={`${scope.name}${scope.required ? ` ${mergedLabels.mandatoryScopeSuffix}` : ''}`}
          checked={
            scope.required || (subjectScopes?.includes(scope.key) ?? false)
          }
          disabled={scope.required}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleScopeChange(scope.key, e.target.checked, subjectIndex)
          }
        />
        <Text size={200}>{scope.description}</Text>
      </>
    );
  };

  return (
    <div className={styles.root}>
      <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
        {mergedLabels.title}
      </h2>
      <Text align="center">
        {requiredScopes.length > 0
          ? mergedLabels.descriptionWithRequired
          : mergedLabels.descriptionWithoutRequired}
      </Text>

      {!isProxy &&
        availableScopes.map((scope: PolicyScope) => (
          <div key={scope.key} className={styles.scope}>
            {scopeCheckbox(scope, selfGrantedScopes)}
          </div>
        ))}

      {isProxy && managedSubjects && managedSubjects.length > 0 && (
        <div className={styles.subjectSection}>
          <Text weight="semibold">{mergedLabels.managedProxiesLabel}</Text>
          <div className={styles.subjectPanel}>
            <Text weight="semibold" size={400}>
              {managedSubjects[currentSlide].name}
            </Text>
            {availableScopes.map((scope: PolicyScope) => {
              const currentSubjectGrantedScopes =
                managedSubjects[currentSlide].grantedScopes;
              return (
                <div
                  key={`subject-${currentSlide}-scope-${scope.key}`}
                  className={styles.scope}
                >
                  {scopeCheckbox(
                    scope,
                    currentSubjectGrantedScopes,
                    currentSlide,
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.navigationButtons}>
            <Button
              appearance="subtle"
              onClick={handlePreviousSubject}
              disabled={currentSlide === 0}
            >
              {mergedLabels.previousSubjectButtonText}
            </Button>
            <Button
              appearance="subtle"
              onClick={handleNextSubject}
              disabled={currentSlide === managedSubjects.length - 1}
            >
              {mergedLabels.nextSubjectButtonText}
            </Button>
          </div>

          <div className={styles.slideIndicator}>
            {managedSubjects.map((_, index) => (
              <div
                key={index}
                className={`${styles.slideDot} ${index === currentSlide ? styles.activeSlideDot : ''}`}
                onClick={() => handleSlideClick(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentScopes;
