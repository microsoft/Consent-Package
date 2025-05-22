# Usage Examples

## NOTE

As of 2025-05-22, This doc is now stale. Updates coming before 2025-05-28!

Subject to change as planning progresses. This example is presented to guide high-level planning.

```tsx
import { useState } from 'react';
import {
  ConsentProvider,
  useConsent,
  ConsentWelcome,
  ConsentDetails,
  ConsentScopes,
  ConsentReview
} from '@open-source-consent-package/ui';

function App() {
  return (
    <ConsentProvider apiUrl={process.env.CONSENT_API_URL}>
      <ConsentFlow policyId={policyId} userId={userId} />
    </ConsentProvider>
  );
}

function ConsentFlow({ policyId, userId }: { policyId: string; userId: string }) {
  const { policy, consent, submit } = useConsent(policyId, userId);
  const [step, setStep] = useState<'welcome' | 'risks' | 'data-types' | 'compensation' | 'scopes' | 'review'>('welcome');
  const [grantedScopes, setGrantedScopes] = useState<string[]>(consent?.grantedScopes ?? []);

  // ...

  return (
    <>
      {step === 'welcome' && <ConsentWelcome policyTitle={policy.title}>}
      {step === 'risks' && <ConsentDetails details={policy.contentSections.risks} />}
      {step === 'data-types' && <ConsentDetails details={policy.contentSections.dataTypes} />}
      {step === 'compensation' && <ConsentDetails details={policy.contentSections.compensation}/>}
      {step === 'scopes' && (
        <ConsentScopes
          availableScopes={policy.scopes}
          initialGrantedScopes={grantedScopes}
          onChange={setGrantedScopes}
        />
      )}
      {step === 'review' && (
        <ConsentReview
          policyDetails={policy}
          grantedScopes={grantedScopes}
        />
      )}
    </>
  );
}
```
