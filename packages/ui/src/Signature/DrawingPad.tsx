import React, { useEffect, useRef, useState } from 'react';
import { tokens, Button } from '@fluentui/react-components';
import './index.css';

interface DrawingPadProps {
  onSignatureSubmit(signature: string /* 'data:image/png;base64,<b64_string>' */, date: Date): void;
  canvasHeight: number;
}

const DrawingPad: React.FC<DrawingPadProps> = ({
  onSignatureSubmit,
  canvasHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [signatureDate, setSignatureDate] = useState<Date | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleSubmit = (): void => {
    const signatureDate = new Date();
    setSignatureDate(signatureDate);

    if (drawnSignature) onSignatureSubmit(drawnSignature, signatureDate);
  }

  const drawToCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): ([canvasContext: CanvasRenderingContext2D, xPosition: number, yPosition: number] | undefined) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = 'touches' in e
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;

    return [ctx, x, y]
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): void => {
    // If user needs to continue signing after submitting
    setSignatureDate(null);

    const canvasPoint = drawToCanvas(e);
    if (canvasPoint) {
      const [ctx, x, y] = canvasPoint;
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): void => {
    if (!isDrawing) return;

    const canvasPoint = drawToCanvas(e);
    if (canvasPoint) {
      const [ctx, x, y] = canvasPoint;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (): void => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsDrawing(false);
    setDrawnSignature('');
    setSignatureDate(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = (): void => {
      const container = canvas.parentElement;
      if (!container) return;

      // Save the current drawing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Update canvas size
      canvas.width = container.clientWidth;
      canvas.height = canvasHeight;

      // Restore the drawing
      ctx.putImageData(imageData, 0, 0);

      // Reapply drawing style
      ctx.strokeStyle = tokens.colorNeutralForeground1;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    // Initial size setup
    updateCanvasSize();

    // Create ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, [canvasHeight]);

  return (
    <div className="signature-drawing-pad">
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        height={canvasHeight}
      />
      {drawnSignature && signatureDate ? <div className="signature-capture-container">
        <span>Date signed: {signatureDate?.toLocaleDateString()}</span>
      </div> : null}
      <div className="signature-controls">
        <Button onClick={clearCanvas}>Clear</Button>
        <Button
          appearance="primary"
          disabled={!drawnSignature}
          onClick={handleSubmit}
        >
          Sign
        </Button>
      </div>
    </div>
  );
};

export default DrawingPad;
