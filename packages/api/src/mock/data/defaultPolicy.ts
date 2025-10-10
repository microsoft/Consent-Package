// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { Policy } from '@open-source-consent/types';

export const defaultCorePolicyJson: Policy = {
  title: 'Policy A',
  id: 'sample-policy-1',
  policyGroupId: 'sample-group-1',
  version: 1,
  effectiveDate: new Date('2025-05-20T00:00:00Z'),
  status: 'active',
  createdAt: new Date('2025-05-20T00:00:00Z'),
  updatedAt: new Date('2025-05-20T00:00:00Z'),
  contentSections: [
    {
      title: 'Consent Intro',
      description: 'What to expect from the consent process.',
      content: `
        <p>The consent process is very important because it helps you understand what taking part in using this app means.</p>
        <h4>Parts of the consent process:</h4>
        <ul>
          <li> We will provide you with information about what you are consenting to: research purposes, expected duration of the study, risks and benefits, confidentiality of records, and contact information.</li>
          <li> After that you will have to decide whether you'd like to opt in or opt out for yourself, or your proxy. We will guide you through that process now.</li>
          <li>This should take less than 5 minutes to complete.</li>
          <li>You can change your mind and revoke consent at any time. To do so go to your profile and revoke consent on any non-required scope.</li>
        </ul>
      `,
    },
    {
      title: 'Purpose',
      description: 'Expalining the purpose of the app/platform/project and how it relates to data collection.',
      content: `
        <p>This is an app that needs to collect data about you so that we can cusomize your experience. Otherwise, we may collect data to analyze to improve the application or experience. You can opt-in or opt-out of the optional data types.</p>
      `,
    },
    {
      title: 'Duration',
      description: 'Expected duration of data storage.',
      content: `
        <p>We store your data for varying lengths of time, keeping some data indefinitely for operational, legal, or safety reasons. When you delete your account, your content is typically scheduled for removal, but this process can take up to 90 days.</p>
      `,
    },
    {
      title: 'Risks and Benefits',
      description: 'Explaination of some of the risks and benefits of sharing your data.',
      content: `
        <p>You have the right to access, modify, or delete your data at any time. You can also withdraw your consent at any point.</p>
        <h4>Risks:</h4>
        <ul>
          <li>There is a risk that an unauthorized person could get access to the stored health data. We believe the chance this will happen is very small and we will do everything we reasonably can to protect your privacy. There may also be other risks that we currently don’t know about. </li>
          <li>Data deletion requests may take up to 90 days to process.</li>
          <li>Some data may be retained for legal or regulatory requirements</li>
        </ul>
        <h4>Benefits:</h4>
        <ul>
          <li>Customization of experience</li>
          <li>Ongoing improvement of the application and its functionality</li>
      `,
    },
    {
      title: 'Confidentiality',
      description: 'How we keep your data confidential.',
      content: `
       <p>We will limit and track who sees your data, only provide collaborators with the data needed to do their work and require them to sign a contract to protect your privacy.</p>
        `,
    },
     {
      title: 'Contact',
      description: 'How you can reach us if you have questions.',
      content: `
       <p>If you have any questions you can contact us at example@example.com</p>
          `,
    },
  ],
  availableScopes: [
    {
      key: 'basic_profile',
      name: 'Basic Profile',
      description:
        'Access to your basic profile information including name and contact details',
      required: true,
    },
    {
      key: 'health_records',
      name: 'Health Records',
      description:
        'Access to your medical history, conditions, and treatment records',
      required: false,
    },
    {
      key: 'medication_history',
      name: 'Medication History',
      description:
        'Access to your current and past medications, dosages, and schedules',
      required: false,
    },
    {
      key: 'appointment_data',
      name: 'Appointment Data',
      description: 'Access to your upcoming and past medical appointments',
      required: false,
    },
    {
      key: 'insurance_info',
      name: 'Insurance Information',
      description:
        'Access to your health insurance details and coverage information',
      required: false,
    },
    {
      key: 'payment_history',
      name: 'Payment History',
      description: 'Access to your medical payment and billing history',
      required: false,
    },
  ],
};
