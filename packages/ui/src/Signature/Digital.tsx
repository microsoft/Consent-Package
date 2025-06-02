import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Text,
} from '@fluentui/react-components';
import type { CheckboxOnChangeData } from '@fluentui/react-components';
import './index.css';

interface DigitalProps {
  onSignatureSubmit(signature: string, date: Date): void;
  disableInputAfterSubmit?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleanedValue: string;
}

function validateSignature(
  value: string,
  isSubmit: boolean = false,
): ValidationResult {
  const signatureValue = value.toUpperCase().trim();

  if (isSubmit && signatureValue.length < 2) {
    return {
      isValid: false,
      error: 'Signature must be at least 2 characters long',
      cleanedValue: '',
    };
  }

  if (isSubmit && /^\d+$/.test(signatureValue)) {
    return {
      isValid: false,
      error: 'Signature cannot be numbers only',
      cleanedValue: '',
    };
  }

  // Allow letters (including accented), numbers, spaces, and common punctuation
  const allowedPattern = /^[\p{L}\p{N}\s.,'-]+$/u;
  if (!allowedPattern.test(signatureValue)) {
    return {
      isValid: false,
      error:
        "Signature can only contain letters, numbers, spaces, and common punctuation (.,'-)",
      cleanedValue: signatureValue,
    };
  }

  return { isValid: true, cleanedValue: signatureValue };
}

const Digital: React.FC<DigitalProps> = ({
  onSignatureSubmit,
  disableInputAfterSubmit = false,
}) => {
  const [digitalSignature, setDigitalSignature] = useState<string>('');
  const [signatureDate, setSignatureDate] = useState<Date | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleDigitalSignatureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    if (isSubmitted && disableInputAfterSubmit) return;

    // If user needs to re-sign
    setSignatureDate(null);
    setIsChecked(false);
    setIsSubmitted(false);

    const value = e.target.value;
    const { isValid, error, cleanedValue } = validateSignature(value);

    setValidationError(error);
    setDigitalSignature(cleanedValue);

    if (!isValid) {
      setSignatureDate(null);
      setIsChecked(false);
    }
  };

  const handleSubmit = (): void => {
    const { isValid, error } = validateSignature(digitalSignature, true);

    if (!isValid) {
      setValidationError(error);
      return;
    }

    const signatureDate = new Date();
    setSignatureDate(signatureDate);
    setIsSubmitted(true);

    setValidationError(undefined);
    onSignatureSubmit(digitalSignature, signatureDate);
  };

  return (
    <div className="digital-signature-container">
      <Label htmlFor="digital-signature">Enter your signature</Label>
      <Input
        id="digital-signature"
        value={digitalSignature}
        onChange={handleDigitalSignatureChange}
        placeholder="Sign here"
        aria-invalid={!!validationError}
        disabled={isSubmitted && disableInputAfterSubmit}
      />
      {validationError && <Text className="error-text">{validationError}</Text>}
      <Checkbox
        checked={isChecked}
        onChange={(
          _: ChangeEvent<HTMLInputElement>,
          data: CheckboxOnChangeData,
        ) => setIsChecked(data.checked)}
        label="I have read and agree to the terms and conditions"
        disabled={
          !digitalSignature ||
          !!validationError ||
          (isSubmitted && disableInputAfterSubmit)
        }
      />
      {digitalSignature && signatureDate && !validationError ? (
        <div className="signature-capture-container">
          <span>Signed by: {digitalSignature}</span>
          <span>Date signed: {signatureDate.toLocaleDateString()}</span>
        </div>
      ) : null}
      <Button
        appearance="primary"
        onClick={handleSubmit}
        disabled={
          !digitalSignature ||
          !isChecked ||
          !!validationError ||
          (isSubmitted && disableInputAfterSubmit)
        }
        className="submit-button"
      >
        Sign
      </Button>
    </div>
  );
};

export default Digital;
