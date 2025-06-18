# Frontend Usage Examples

## Basic Setup

The UI package provides React components for building consent management interfaces. First, configure the API endpoint:

```tsx
import { setApiConfig } from '@open-source-consent/ui';

// Configure the API endpoint
setApiConfig({
  baseUrl: 'http://localhost:7071/api', // Your API endpoint
});
```

## Theme Configuration

The UI components use [Fluent UI React](https://developer.microsoft.com/en-us/fluentui) and support theming through the `ThemeProvider`:

```tsx
import { ThemeProvider } from '@open-source-consent/ui';

function App() {
  return (
    <ThemeProvider
      theme={{
        primary: '#1a73e8',
        primaryHover: '#1557b0',
        bgPrimary: '#ffffff',
        textPrimary: '#000000',
        // ... other theme values
      }}
    >
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

## Consent Flow Components

### Basic Consent Flow

```tsx
import { 
  ConsentWelcome, 
  ConsentContentSectionStep, 
  ConsentScopes, 
  ConsentReview,
  ConsentConfirmation,
  useConsentFlow 
} from '@open-source-consent/ui';

function ConsentProcess({ policyId, subjectId }: { policyId: string; subjectId: string }) {
  const { 
    policy, 
    currentStep, 
    formData, 
    setFormData, 
    nextStep, 
    prevStep, 
    submitConsent,
    isLoading 
  } = useConsentFlow(policyId, subjectId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {currentStep === 'welcome' && (
        <ConsentWelcome 
          policy={policy} 
          onNext={nextStep}
        />
      )}
      
      {currentStep === 'content' && (
        <ConsentContentSectionStep
          sections={policy.contentSections}
          onNext={nextStep}
          onPrevious={prevStep}
        />
      )}
      
      {currentStep === 'scopes' && (
        <ConsentScopes
          availableScopes={policy.availableScopes}
          selectedScopes={formData.grantedScopes}
          onScopesChange={(scopes) => setFormData({ ...formData, grantedScopes: scopes })}
          onNext={nextStep}
          onPrevious={prevStep}
        />
      )}
      
      {currentStep === 'review' && (
        <ConsentReview
          policy={policy}
          formData={formData}
          onNext={nextStep}
          onPrevious={prevStep}
        />
      )}
      
      {currentStep === 'confirmation' && (
        <ConsentConfirmation
          onSubmit={submitConsent}
          onPrevious={prevStep}
        />
      )}
    </div>
  );
}
```

## Individual Components

### Age Selection

```tsx
import { AgeSelect } from '@open-source-consent/ui';

function AgeSelectionStep({ onAgeSelect }: { onAgeSelect: (age: string) => void }) {
  return (
    <AgeSelect
      onAgeSelect={onAgeSelect}
      title="Please select your age group"
      description="This helps us determine the appropriate consent process"
    />
  );
}
```

### Role Selection

```tsx
import { RoleSelect } from '@open-source-consent/ui';

function RoleSelectionStep({ onRoleSelect }: { onRoleSelect: (role: 'self' | 'proxy') => void }) {
  return (
    <RoleSelect
      onRoleSelect={onRoleSelect}
      title="Who is providing consent?"
      selfDescription="I am providing consent for myself"
      proxyDescription="I am providing consent on behalf of someone else"
    />
  );
}
```

### Profile Management

```tsx
import { Profile } from '@open-source-consent/ui';

function ProfileManagement({ subjectId }: { subjectId: string }) {
  return (
    <Profile
      subjectId={subjectId}
      showConsentHistory={true}
      showProxyManagement={true}
    />
  );
}
```

### Digital Signature

```tsx
import { Signature } from '@open-source-consent/ui';

function SignatureStep({ onSignature }: { onSignature: (signature: string) => void }) {
  return (
    <Signature
      onSignature={onSignature}
      title="Please provide your digital signature"
      description="By signing, you confirm your consent to the above terms"
    />
  );
}
```

## Policy Management Components

### Policy Display

```tsx
import { PolicySectionDisplay, PolicyMetadataDisplay, PolicyScopeDisplay } from '@open-source-consent/ui';

function PolicyViewer({ policy }: { policy: Policy }) {
  return (
    <div>
      <PolicyMetadataDisplay policy={policy} />
      
      {policy.contentSections.map((section, index) => (
        <PolicySectionDisplay 
          key={index} 
          section={section} 
        />
      ))}
      
      <PolicyScopeDisplay scopes={policy.availableScopes} />
    </div>
  );
}
```

### Policy Editing

```tsx
import { 
  PolicyMetadataForm, 
  PolicyContentSectionEditor, 
  PolicyScopeEditor,
  usePolicyEditor 
} from '@open-source-consent/ui';

function PolicyEditor({ policyId }: { policyId?: string }) {
  const { 
    formData, 
    setFormData, 
    savePolicy, 
    isLoading 
  } = usePolicyEditor(policyId);

  return (
    <form onSubmit={savePolicy}>
      <PolicyMetadataForm 
        data={formData}
        onChange={setFormData}
      />
      
      <PolicyContentSectionEditor
        sections={formData.contentSections}
        onChange={(sections) => setFormData({ ...formData, contentSections: sections })}
      />
      
      <PolicyScopeEditor
        scopes={formData.availableScopes}
        onChange={(scopes) => setFormData({ ...formData, availableScopes: scopes })}
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Policy'}
      </button>
    </form>
  );
}
```

## Hooks

### useConsentFlow

Manages the entire consent flow state:

```tsx
const { 
  policy, 
  currentStep, 
  formData, 
  setFormData, 
  nextStep, 
  prevStep, 
  submitConsent,
  isLoading,
  error 
} = useConsentFlow(policyId, subjectId);
```

### usePolicyEditor

Manages policy creation and editing:

```tsx
const { 
  formData, 
  setFormData, 
  savePolicy, 
  isLoading,
  error 
} = usePolicyEditor(policyId);
```

### useFetchPolicies

Fetches and manages policy lists:

```tsx
const { 
  policies, 
  isLoading, 
  error, 
  refetch 
} = useFetchPolicies();
```

## Complete Example

Here's a complete example combining multiple components:

```tsx
import React from 'react';
import { 
  ThemeProvider, 
  ConsentWelcome, 
  ConsentScopes, 
  ConsentReview,
  useConsentFlow,
  setApiConfig 
} from '@open-source-consent/ui';

// Configure API
setApiConfig({
  baseUrl: 'http://localhost:7071/api',
});

function ConsentApp() {
  const policyId = 'policy-123';
  const subjectId = 'subject-456';
  
  const { 
    policy, 
    currentStep, 
    formData, 
    setFormData, 
    nextStep, 
    prevStep, 
    submitConsent,
    isLoading 
  } = useConsentFlow(policyId, subjectId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ThemeProvider theme={{ primary: '#1a73e8' }}>
      <div className="consent-app">
        {currentStep === 'welcome' && (
          <ConsentWelcome 
            policy={policy} 
            onNext={nextStep}
          />
        )}
        
        {currentStep === 'scopes' && (
          <ConsentScopes
            availableScopes={policy.availableScopes}
            selectedScopes={formData.grantedScopes}
            onScopesChange={(scopes) => 
              setFormData({ ...formData, grantedScopes: scopes })
            }
            onNext={nextStep}
            onPrevious={prevStep}
          />
        )}
        
        {currentStep === 'review' && (
          <ConsentReview
            policy={policy}
            formData={formData}
            onNext={submitConsent}
            onPrevious={prevStep}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default ConsentApp;
```

## Integration Tips

### Custom Styling

You can override the default styles using CSS custom properties:

```css
:root {
  --osc-primary: #your-brand-color;
  --osc-primary-hover: #your-brand-hover-color;
  --osc-bg-primary: #your-background-color;
}
```

### Error Handling

All hooks provide error states for proper error handling:

```tsx
const { policy, isLoading, error } = useConsentFlow(policyId, subjectId);

if (error) {
  return <div>Error loading consent flow: {error.message}</div>;
}
```

### Accessibility

The components are built with accessibility in mind and support:
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Focus management

### Responsive Design

All components are responsive and work across different screen sizes. You can customize breakpoints through CSS custom properties if needed. 