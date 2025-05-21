import type { Policy } from "@open-source-consent/types";

export const defaultCorePolicyJson: Policy = {
  title: "Policy A",
  id: "sample-policy-1",
  policyGroupId: "sample-group-1",
  version: 1,
  effectiveDate: new Date("2025-05-20T00:00:00Z"),
  status: "active",
  createdAt: new Date("2025-05-20T00:00:00Z"),
  updatedAt: new Date("2025-05-20T00:00:00Z"),
  contentSections: [
    {
      title: "Data Collection",
      description: "How we collect your information.",
      content: `
        <p>We collect only the information necessary to provide our services and ensure compliance with privacy regulations.</p>
        <h4>Risks:</h4>
        <ul>
          <li>Your personal information may be temporarily stored in our secure systems</li>
          <li>Data collection may require additional verification steps</li>
          <li>Some data points may be mandatory for service provision</li>
        </ul>
        <h4>Data Types:</h4>
        <ul>
          <li>Personal identification information</li>
          <li>Contact details and communication preferences</li>
          <li>Account credentials and security information</li>
        </ul>
        <h4>Compensation/Benefits:</h4>
        <ul>
          <li>Access to personalized service features</li>
          <li>Enhanced account security measures</li>
          <li>Priority customer support access</li>
        </ul>
      `,
    },
    {
      title: "Data Usage",
      description: "How we use your information.",
      content: `
        <p>Your data is used solely for the purposes you consent to, and we never sell or share your information with third parties without your explicit permission.</p>
        <h4>Risks:</h4>
        <ul>
          <li>Data may be used for service improvement and analytics</li>
          <li>Information may be shared with service providers under strict confidentiality</li>
          <li>Data may be retained for legal compliance purposes</li>
        </ul>
        <h4>Data Types:</h4>
        <ul>
          <li>Usage patterns and preferences</li>
          <li>Service interaction logs</li>
          <li>Analytics and performance data</li>
        </ul>
        <h4>Compensation/Benefits:</h4>
        <ul>
          <li>Improved service recommendations</li>
          <li>Customized user experience</li>
          <li>Early access to new features</li>
        </ul>
      `,
    },
    {
      title: "Your Rights",
      description: "Your rights regarding your information.",
      content: `
        <p>You have the right to access, modify, or delete your data at any time. You can also withdraw your consent at any point.</p>
        <h4>Risks:</h4>
        <ul>
          <li>Withdrawing consent may limit access to certain features</li>
          <li>Data deletion requests may take up to 30 days to process</li>
          <li>Some data may be retained for legal or regulatory requirements</li>
        </ul>
        <h4>Data Types:</h4>
        <ul>
          <li>Consent management records</li>
          <li>Data access and modification history</li>
          <li>Privacy preference settings</li>
        </ul>
        <h4>Compensation/Benefits:</h4>
        <ul>
          <li>Full control over data management</li>
          <li>Transparent data usage reporting</li>
          <li>Flexible consent options</li>
        </ul>
      `,
    },
  ],
  availableScopes: [
    {
      key: "basic_profile",
      name: "Basic Profile",
      description:
        "Access to your basic profile information including name and contact details",
      required: true,
    },
    {
      key: "health_records",
      name: "Health Records",
      description:
        "Access to your medical history, conditions, and treatment records",
      required: false,
    },
    {
      key: "medication_history",
      name: "Medication History",
      description:
        "Access to your current and past medications, dosages, and schedules",
      required: false,
    },
    {
      key: "appointment_data",
      name: "Appointment Data",
      description: "Access to your upcoming and past medical appointments",
      required: false,
    },
    {
      key: "insurance_info",
      name: "Insurance Information",
      description:
        "Access to your health insurance details and coverage information",
      required: false,
    },
    {
      key: "payment_history",
      name: "Payment History",
      description: "Access to your medical payment and billing history",
      required: false,
    },
  ],
};
