import { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  Input,
  Field,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from "@fluentui/react-components";

interface LoginFormProps {
  isOpen: boolean;
  onClose(): void;
  onLoginSubmit(subjectId: string): Promise<void>;
}

const useStyles = makeStyles({
  loginForm: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    width: "300px",
  },
});

export function LoginForm({
  isOpen,
  onClose,
  onLoginSubmit,
}: LoginFormProps): JSX.Element | null {
  const styles = useStyles();
  const [loginSubjectId, setLoginSubjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedSubjectId = loginSubjectId.trim();
    if (!trimmedSubjectId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onLoginSubmit(trimmedSubjectId);
      setLoginSubjectId("");
      onClose();
    } catch (err) {
      console.error("Login submission failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during login."
      );
    }
    setIsSubmitting(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(_event: unknown, data: { open: boolean }) =>
        !data.open && onClose()
      }
    >
      <DialogSurface aria-describedby={undefined}>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogBody>
            <DialogTitle>Login</DialogTitle>
            <DialogContent className={styles.loginForm}>
              <Field label="Subject ID">
                <Input
                  type="text"
                  value={loginSubjectId}
                  onChange={(
                    _event: React.ChangeEvent<HTMLInputElement>,
                    data: { value: string }
                  ) => setLoginSubjectId(data.value)}
                  placeholder="Enter Subject ID to login"
                  required
                  disabled={isSubmitting}
                />
              </Field>
              {error && (
                <div style={{ color: "red", marginTop: "8px" }}>{error}</div>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner size="tiny" /> : "Login"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
