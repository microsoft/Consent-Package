// @ts-nocheck
import type { ChangeEvent, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from "@mui/material";
import type {
  GrantConsentInput,
  ConsentRecord,
} from "@open-source-consent/core";

export default function App(): JSX.Element {
  const [formData, setFormData] = useState<Partial<GrantConsentInput>>({
    subjectId: "",
    policyId: "default-policy",
    consenter: {
      type: "self",
      userId: "test-user",
    },
    grantedScopes: ["basic_info", "medical_history"],
    metadata: {
      consentMethod: "digital_form",
    },
  });

  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fetchedConsents, setFetchedConsents] = useState<
    ConsentRecord[] | null
  >(null);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create consent");
      }

      const result = await response.json();
      setStatus({
        type: "success",
        message: `Consent created with ID: ${result.id}`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleFetchConsents = async (): Promise<void> => {
    setLoadingConsents(true);
    setFetchError(null);
    setFetchedConsents(null);
    setStatus(null);
    try {
      const response = await fetch("/api/consents");
      if (!response.ok) {
        let errorMsg = `Failed to fetch consents. Status: ${response.status}`;
        try {
          const errBody = await response.json();
          errorMsg += `: ${errBody.error || "Unknown error"}`;
        } catch {}
        throw new Error(errorMsg);
      }
      const consents = await response.json();
      setFetchedConsents(consents);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoadingConsents(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Consent Management Debug UI
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Subject ID"
              value={formData.subjectId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
              }
              required
            />

            <TextField
              label="Policy ID"
              value={formData.policyId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, policyId: e.target.value }))
              }
              required
            />

            <Button type="submit" variant="contained" size="large">
              Create Consent
            </Button>
          </Stack>
        </Box>

        {status && (
          <Alert severity={status.type} sx={{ mt: 3 }}>
            {status.message}
          </Alert>
        )}

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          Existing Consents
        </Typography>
        <Button
          variant="outlined"
          onClick={handleFetchConsents}
          disabled={loadingConsents}
          sx={{ mb: 2 }}
        >
          {loadingConsents ? <CircularProgress size={24} /> : "Fetch Consents"}
        </Button>

        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        )}

        {fetchedConsents && (
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
            <List dense>
              {fetchedConsents.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No consents found in the database." />
                </ListItem>
              ) : (
                fetchedConsents.map((consent) => (
                  <ListItem key={consent.id}>
                    <ListItemText
                      primary={`ID: ${consent.id} - Subject: ${consent.subjectId}`}
                      secondary={`Status: ${consent.status}, Policy: ${consent.policyId}, Scopes: ${Object.keys(consent.grantedScopes).join(", ")}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}
