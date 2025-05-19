import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeStyles, Button, tokens, Text, Spinner } from "@fluentui/react-components";
import { ConsentWelcome, ConsentDetails, ConsentScopes, ConsentReview, useConsentFlow } from "@open-source-consent/ui";
import type { ConsentFlowFormData, ConsentFlowContentSection } from "@open-source-consent/ui";

const useStyles = makeStyles({
  root: {
    padding: "24px 64px",
    margin: "0 auto",
    "@media (max-width: 768px)": {
      padding: "24px",
    },
  },
  stepper: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "48px",
    position: "relative",
    padding: "0 16px",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "20px",
      left: "40px",
      right: "40px",
      height: "3px",
      backgroundColor: tokens.colorNeutralStroke1,
      zIndex: 0,
      transition: "background-color 0.3s ease",
    }
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
    }
  },
  stepNumber: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid",
    background: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
    transition: "all 0.3s ease",
    boxShadow: tokens.shadow2,
  },
  stepNumberActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
    transform: "scale(1.1)",
  },
  stepLabel: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground1,
    transition: "color 0.3s ease",
  },
  slide: {
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
  },
  navigation: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "24px",
    "& button:first-child": { // Previous button
      marginRight: "8px",
    }
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  }
});

const steps = [
  { id: "welcome", label: "Welcome" },
  { id: "risks", label: "Risks" },
  { id: "data-types", label: "Data Types" },
  { id: "compensation", label: "Compensation" },
  { id: "scopes", label: "Scopes" },
  { id: "review", label: "Review" },
] as const;

type Step = typeof steps[number]["id"];

export function GetStarted(/* policyId: string */): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { policy, formData, isFormValid, isLoading, setFormData, updateScopes } = useConsentFlow("sample-policy-1" /* policyId */);
  const [currentStep, setCurrentStep] = useState<Step>("welcome");

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleNext = (): void => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    } else {
      // Finish action -- navigate to profile page with form data
      navigate('/profile', { state: { formData } });
    }
  };

  const handlePrevious = (): void => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const renderSlide = (): JSX.Element | null => {
    if (isLoading) {
      return <div className={styles.loading}>
        <Spinner label="Loading policy..." />
      </div>;
    }

    if (!policy) {
      return <div className={styles.loading}>
        <Text size={500} weight="semibold">Policy Not Found</Text>
      </div>;
    }

    switch (currentStep) {
      case "welcome":
        return <ConsentWelcome
          formData={formData}
          policy={policy}
          onFormDataChange={(formData: ConsentFlowFormData): void => {
            console.info('ConsentWelcome onFormDataChange', { formData });
            setFormData(formData);
          }}
        />;
      case "risks":
        return <ConsentDetails
          title="Understanding the Risks"
          description="Please review these important considerations before proceeding with your consent."
          details={policy.contentSections.map((section: ConsentFlowContentSection) => ({
            title: section.title,
            items: section.risks
          }))}
        />;
      case "data-types":
        return <ConsentDetails
          title="Understanding the Data Types"
          description="Please review these important considerations before proceeding with your consent."
          details={policy.contentSections.map((section: ConsentFlowContentSection) => ({
            title: section.title,
            items: section.dataTypes
          }))}
        />;
      case "compensation":
        return <ConsentDetails
          title="Understanding the Benefits"
          description="Please review these benefits you'll receive for sharing your data."
          details={policy.contentSections.map((section: ConsentFlowContentSection) => ({
            title: section.title,
            items: section.compensation
          }))}
        />;
      case "scopes":
        return <ConsentScopes
          formData={formData}
          availableScopes={policy.scopes}
          onChange={(scopeId: string, isChecked: boolean, subjectId?: string) => {
            console.info('ConsentScopes onChange', { scopeId, isChecked, subjectId });
            updateScopes(scopeId, isChecked, subjectId);
          }}
        />;
      case "review":
        return <ConsentReview
          policy={policy}
          formData={formData}
          onSignatureSubmit={(signature: string, date: Date) => {
            console.info('ConsentReview onSignatureSubmit', { signature, date });
            setFormData({
              ...formData,
              signature,
              grantedAt: date
            });
          }}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.stepper}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.step}>
            <div className={`${styles.stepNumber} ${index <= currentStepIndex ? styles.stepNumberActive : ""}`}>
              {index + 1}
            </div>
            <Text className={styles.stepLabel} weight={index === currentStepIndex ? "semibold" : "regular"}>{step.label}</Text>
          </div>
        ))}
      </div>

      <div className={styles.slide}>
        {renderSlide()}
      </div>

      <div className={styles.navigation}>
        {currentStepIndex > 0 && (
          <Button appearance="secondary" onClick={handlePrevious}>
            Previous
          </Button>
        )}
        <Button appearance="primary" onClick={handleNext} disabled={currentStepIndex === steps.length - 1 && !formData.signature || !isFormValid}>
          {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
} 
