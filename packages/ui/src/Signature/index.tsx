// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import DrawingPadSignature from './DrawingPad.js';
import DigitalSignature from './Digital.js';
import './index.css';

interface SignatureProps {
  onSignatureSubmit(signature: string, date: Date): void;
  canvasHeight?: number;
  isDrawnSignature?: boolean;
  disableInputAfterSubmit?: boolean;
}

const Signature: React.FC<SignatureProps> = ({
  onSignatureSubmit,
  canvasHeight = 200,
  isDrawnSignature = false,
  disableInputAfterSubmit = false,
}) => {
  return (
    <div className="signature-root">
      <div className="signature-tab-content">
        {isDrawnSignature ? (
          <DrawingPadSignature
            onSignatureSubmit={onSignatureSubmit}
            canvasHeight={canvasHeight}
            disableInputAfterSubmit={disableInputAfterSubmit}
          />
        ) : (
          <DigitalSignature
            onSignatureSubmit={onSignatureSubmit}
            disableInputAfterSubmit={disableInputAfterSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Signature;
