import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Box,
  Alert,
} from "@mui/material";
import type { GrantConsentInput } from "@open-source-consent/core";

export default function App() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/createConsent", {
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Consent Management Debug UI
        </Typography>

        {status && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Subject ID"
              value={formData.subjectId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
              }
              required
            />

            <TextField
              label="Policy ID"
              value={formData.policyId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, policyId: e.target.value }))
              }
              required
            />

            <Button type="submit" variant="contained" size="large">
              Create Consent
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
