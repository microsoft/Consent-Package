import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Checkbox, Input, Label } from '@fluentui/react-components';
import type { CheckboxOnChangeData } from '@fluentui/react-components';
import './index.css';

interface DigitalProps {
  onSignatureSubmit(signature: string, date: Date): void;
}

const Digital: React.FC<DigitalProps> = ({ onSignatureSubmit }) => {
  const [digitalSignature, setDigitalSignature] = useState<string>('');
  const [signatureDate, setSignatureDate] = useState<Date | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const handleDigitalSignatureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // If user needs to re-sign
    setSignatureDate(null);
    setIsChecked(false);

    const value = e.target.value;
    setDigitalSignature(value.toUpperCase());
  };

  const handleSubmit = (): void => {
    const signatureDate = new Date();
    setSignatureDate(signatureDate);

    if (digitalSignature) onSignatureSubmit(digitalSignature, signatureDate);
  }

  return (
    <div className="digital-signature-container">
      <Label htmlFor="digital-signature">Enter your signature</Label>
      <Input
        id="digital-signature"
        value={digitalSignature}
        onChange={handleDigitalSignatureChange}
        placeholder="Sign here"
      />
      <Checkbox
        checked={isChecked}
        onChange={(_: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => setIsChecked(data.checked)}
        label="I have read and agree to the terms and conditions"
      />
      {digitalSignature && signatureDate ? <div className="signature-capture-container">
        <span>Signed by: {digitalSignature}</span>
        <span>Date signed: {signatureDate?.toLocaleDateString()}</span>
      </div> : null}
      <Button
        appearance="primary"
        onClick={handleSubmit}
        disabled={!digitalSignature || !isChecked}
        className="submit-button"
      >
        Submit
      </Button>
    </div>
  );
};

export default Digital;
