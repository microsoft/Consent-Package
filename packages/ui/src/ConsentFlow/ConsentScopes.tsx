import { useState, type ChangeEvent } from "react";
import {
  makeStyles,
  Text,
  Title2,
  Checkbox,
  tokens,
  Button,
} from "@fluentui/react-components";
import type { ConsentFlowFormData } from "./ConsentFlow.type.js";
import type { PolicyScope } from "@open-source-consent/types";

interface ConsentScopesProps {
  formData: ConsentFlowFormData;
  availableScopes: readonly PolicyScope[];
  onChange(scopeId: string, isChecked: boolean, subjectId?: string): void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
  },
  scope: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  subjectSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "24px",
  },
  subjectPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  subjectHeader: {
    paddingBottom: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  navigationButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "16px",
  },
  slideIndicator: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "8px",
  },
  slideDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: tokens.colorNeutralStroke1,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  activeSlideDot: {
    backgroundColor: tokens.colorBrandBackground,
    transform: "scale(1.2)",
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
  },
});

const ConsentScopes = ({
  formData,
  availableScopes,
  onChange,
}: ConsentScopesProps): JSX.Element => {
  const styles = useStyles();
  const [currentSlide, setCurrentSlide] = useState(0);

  const {
    isProxy,
    managedSubjects,
    grantedScopes: selfGrantedScopes,
  } = formData;

  const handleScopeChange = (
    scopeId: string,
    isChecked: boolean,
    subjectId?: string
  ): void => {
    onChange(scopeId, isChecked, subjectId);
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

  return (
    <div className={styles.root}>
      <Title2 align="center">Select Data Access Permissions</Title2>
      <Text align="center">
        Choose which data you want to share with the service
      </Text>

      {!isProxy &&
        availableScopes.map((scope: PolicyScope) => (
          <div key={scope.key} className={styles.scope}>
            <Checkbox
              label={scope.name}
              checked={
                scope.required ||
                (selfGrantedScopes?.includes(scope.key) ?? false)
              }
              disabled={scope.required}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleScopeChange(scope.key, e.target.checked)
              }
            />
            <Text size={200}>{scope.description}</Text>
          </div>
        ))}

      {isProxy && managedSubjects && managedSubjects.length > 0 && (
        <div className={styles.subjectSection}>
          <Text weight="semibold">Managed Subjects Permissions</Text>
          <div className={styles.subjectPanel}>
            <Text weight="semibold" size={400}>
              {managedSubjects[currentSlide].name}
            </Text>
            {availableScopes.map((scope: PolicyScope) => {
              const currentSubjectGrantedScopes =
                managedSubjects[currentSlide].grantedScopes;
              return (
                <div
                  key={`${managedSubjects[currentSlide].id}-${scope.key}`}
                  className={styles.scope}
                >
                  <Checkbox
                    label={scope.name}
                    checked={
                      scope.required ||
                      (currentSubjectGrantedScopes?.includes(scope.key) ??
                        false)
                    }
                    disabled={scope.required}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleScopeChange(
                        scope.key,
                        e.target.checked,
                        managedSubjects[currentSlide].id
                      )
                    }
                  />
                  <Text size={200}>{scope.description}</Text>
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
              Previous Subject
            </Button>
            <Button
              appearance="subtle"
              onClick={handleNextSubject}
              disabled={currentSlide === managedSubjects.length - 1}
            >
              Next Subject
            </Button>
          </div>

          <div className={styles.slideIndicator}>
            {managedSubjects.map((_, index) => (
              <div
                key={index}
                className={`${styles.slideDot} ${index === currentSlide ? styles.activeSlideDot : ""}`}
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
