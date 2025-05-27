import React from 'react';
import type {
  DialogOpenChangeData,
  DialogOpenChangeEvent,
} from '@fluentui/react-components';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
} from '@fluentui/react-components';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose(): void;
  onConfirm(): void;
  title: string;
  message: React.ReactNode; // Allow ReactNode for potentially complex messages
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonAppearance?: 'primary' | 'outline' | 'subtle' | 'transparent';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonAppearance = 'primary',
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOpenChange = (
    event: DialogOpenChangeEvent,
    data: DialogOpenChangeData,
  ) => {
    if (!data.open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            {typeof message === 'string' ? <Text>{message}</Text> : message}
          </DialogContent>
          <DialogActions>
            <Button
              appearance={confirmButtonAppearance}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmButtonText}
            </Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="outline" onClick={onClose}>
                {cancelButtonText}
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ConfirmationDialog;
