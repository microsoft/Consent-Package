import React from 'react';
import DrawingPadSignature from './DrawingPad.js';
import DigitalSignature from './Digital.js';
import './index.css';

interface SignatureProps {
  onSignatureSubmit(signature: string, date: Date): void;
  canvasHeight?: number;
  isDrawnSignature?: boolean;
}

const Signature: React.FC<SignatureProps> = ({
  onSignatureSubmit,
  canvasHeight = 200,
  isDrawnSignature = false,
}) => {
  return (
    <div className="signature-root">
      <div className="signature-tab-content">
        {isDrawnSignature ? (
          <DrawingPadSignature
            onSignatureSubmit={onSignatureSubmit}
            canvasHeight={canvasHeight}
          />
        ) : (
          <DigitalSignature onSignatureSubmit={onSignatureSubmit} />
        )}
      </div>
    </div>
  );
};

export default Signature;
