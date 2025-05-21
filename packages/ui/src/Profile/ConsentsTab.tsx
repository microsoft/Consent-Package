import React from 'react';
import {
  Text,
  Badge,
  Button,
} from '@fluentui/react-components';
import type { ProfileData } from './Profile.type.js';

interface ConsentsTabProps {
  consents: ProfileData['consents'];
  onRevokeScope(consentId: string, scopeId: string, updatedConsents: ProfileData['consents']): void;
  onGrantScope(consentId: string, scopeId: string, updatedConsents: ProfileData['consents']): void;
}

const ConsentsTab: React.FC<ConsentsTabProps> = ({
  consents,
  onRevokeScope,
  onGrantScope
}) => {
  if (!consents?.length) {
    return (
      <div className="profile-consent-item">
        <Text>No consents available</Text>
      </div>
    );
  }

  const handleGrantScope = (consentId: string, scopeId: string): void => {
    let updatedConsents: ProfileData['consents'] = [...consents]

    // Find the revoked consent object
    const revokedConsent = updatedConsents.find(c => c.id === consentId && c.status.id === 'revoked');
    if (!revokedConsent) return;

    // Find the scope to grant
    const scopeToGrant = revokedConsent.scopes.find(s => s.id === scopeId);
    if (!scopeToGrant) return;

    // Find or create the granted consent object for the same policy
    let grantedConsent = updatedConsents.find(c =>
      c.status.id === 'granted' &&
      c.policy.id === revokedConsent.policy.id
    );

    // Remove the scope from the revoked consent
    revokedConsent.scopes = revokedConsent.scopes.filter(s => s.id !== scopeId);

    if (!grantedConsent) {
      // Create a new granted consent object if it doesn't exist
      grantedConsent = {
        id: consentId,
        policy: revokedConsent.policy,
        status: {
          id: 'granted',
          label: 'Scopes Allowed'
        },
        scopes: [scopeToGrant]
      };

      updatedConsents = [...updatedConsents, grantedConsent];
    } else {
      grantedConsent.scopes.push(scopeToGrant);
    }

    onGrantScope(consentId, scopeId, updatedConsents);
  };

  const handleRevokeScope = (consentId: string, scopeId: string): void => {
    let updatedConsents: ProfileData['consents'] = [...consents]

    // Find the granted consent object
    const grantedConsent = updatedConsents.find(c => c.id === consentId && c.status.id === 'granted');
    if (!grantedConsent) return;

    // Find the scope to revoke
    const scopeToRevoke = grantedConsent.scopes.find(s => s.id === scopeId);
    if (!scopeToRevoke) return;

    // Find or create the revoked consent object for the same policy
    let revokedConsent = updatedConsents.find(c =>
      c.status.id === 'revoked' &&
      c.policy.id === grantedConsent.policy.id
    );

    // Remove the scope from the granted consent
    grantedConsent.scopes = grantedConsent.scopes.filter(s => s.id !== scopeId);

    if (!revokedConsent) {
      // Create a new revoked consent object if it doesn't exist
      revokedConsent = {
        id: consentId,
        policy: grantedConsent.policy,
        status: {
          id: 'revoked',
          label: 'Scopes Revoked'
        },
        scopes: [scopeToRevoke]
      };

      updatedConsents = [...updatedConsents, revokedConsent];
    } else {
      revokedConsent.scopes.push(scopeToRevoke);
    }

    onRevokeScope(consentId, scopeId, updatedConsents);
  };

  return (
    <div className="profile-consent-list-container">
      {consents.map(consent => (
        <div key={`${consent.id}-${consent.status.id}`} className="profile-consent-item">
          <Text size={400} weight="semibold">
            Policy: {consent.policy?.label}
          </Text>
          <Badge
            className="profile-consent-badge"
            color={consent.status.id === 'granted' ? 'success' : 'danger'}>
            {consent.status?.label}
          </Badge>
          <ul className="profile-consent-scopes-list">
            {consent.scopes.map(scope => (
              <li key={`${scope.id}-${consent.status.id}`} className="profile-consent-scope-item">
                <Text>{scope.label}</Text>
                {consent.status.id === 'granted' ? (
                  <Button
                    size="small"
                    appearance="subtle"
                    disabled={scope.required}
                    onClick={() => handleRevokeScope(consent.id, scope.id)}>
                    Revoke
                  </Button>
                ) : (
                  <Button
                    size="small"
                    appearance="subtle"
                    disabled={scope.required}
                    onClick={() => handleGrantScope(consent.id, scope.id)}>
                    Grant
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ConsentsTab; 
