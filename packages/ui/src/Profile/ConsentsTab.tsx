import React from 'react';
import { Text, Badge, Button } from '@fluentui/react-components';
import type { ConsentRecord } from '@open-source-consent/types';

interface ScopeDisplayInfo {
  id: string;
  label: string;
  description?: string;
  className?: string;
  canBeRevoked?: boolean;
  canBeGranted?: boolean;
}

interface ConsentsTabProps {
  consents: ConsentRecord[];
  onRevokeScope(
    consentId: string,
    policyId: string,
    scopeId: string,
    currentGrantedScopes: string[],
  ): void;
  onGrantScope(
    consentId: string,
    policyId: string,
    scopeId: string,
    currentGrantedScopes: string[],
  ): void;
}

const ConsentsTab: React.FC<ConsentsTabProps> = ({
  consents,
  onRevokeScope,
  onGrantScope,
}) => {
  if (!consents?.length) {
    return (
      <div className="profile-consent-item">
        <Text>No consents available</Text>
      </div>
    );
  }

  const getGrantedScopesForPolicy = (policyId: string): string[] => {
    const activeConsentForPolicy = consents.find(
      (c) => c.policyId === policyId && c.status === 'granted',
    );
    return activeConsentForPolicy
      ? Object.keys(activeConsentForPolicy.grantedScopes || {})
      : [];
  };

  return (
    <div className="profile-consent-list-container">
      {consents.map((consent) => {
        const currentGrantedScopesForThisPolicy = getGrantedScopesForPolicy(
          consent.policyId,
        );
        const grantedDisplayScopes: Array<ScopeDisplayInfo> = [];
        const revokedDisplayScopes: Array<ScopeDisplayInfo> = [];

        if (consent.status === 'granted') {
          Object.entries(consent.grantedScopes || {}).forEach(
            ([scopeId, scopeWithGrant]) => {
              grantedDisplayScopes.push({
                id: scopeId,
                label: scopeWithGrant.name || scopeId,
                description: scopeWithGrant.description,
                className: 'scope-granted',
                canBeRevoked: true,
              });
            },
          );
          Object.entries(consent.revokedScopes || {}).forEach(
            ([scopeId, scopeWithRevocation]) => {
              revokedDisplayScopes.push({
                id: scopeId,
                label: scopeWithRevocation.name || scopeId,
                description: scopeWithRevocation.description,
                className: 'scope-revoked-within-grant',
                canBeGranted: true,
              });
            },
          );
        } else if (consent.status === 'revoked') {
          const allOriginallyAssociatedScopeIds = new Set([
            ...Object.keys(consent.grantedScopes || {}),
            ...Object.keys(consent.revokedScopes || {}),
          ]);

          allOriginallyAssociatedScopeIds.forEach((scopeId) => {
            const explicitRevocation = consent.revokedScopes?.[scopeId];
            let label = '';
            let description = '';
            let className = '';

            if (explicitRevocation) {
              label = explicitRevocation.name || scopeId;
              description = explicitRevocation.description || '';
              className = 'scope-explicitly-revoked';
            } else {
              const grantedScope = consent.grantedScopes[scopeId];
              label = grantedScope?.name || scopeId;
              description = grantedScope?.description || '';
              className = 'scope-implicitly-revoked';
            }
            revokedDisplayScopes.push({
              id: scopeId,
              label: label,
              description: description,
              className: className,
              canBeGranted: true,
            });
          });
        }

        grantedDisplayScopes.sort((a, b) => a.id.localeCompare(b.id));
        revokedDisplayScopes.sort((a, b) => a.id.localeCompare(b.id));
        return (
          <div key={`${consent.id}`} className="profile-consent-item">
            <Text size={400} weight="semibold">
              Policy ID: {consent.policyId}
            </Text>
            <Badge
              className="profile-consent-badge"
              color={
                consent.status === 'granted'
                  ? 'success'
                  : consent.status === 'revoked'
                    ? 'danger'
                    : 'warning'
              }
            >
              {consent.status}
            </Badge>

            {grantedDisplayScopes.length > 0 && (
              <div className="profile-scopes-section-granted">
                <Text weight="medium">Currently Granted Scopes:</Text>
                <ul className="profile-consent-scopes-list">
                  {grantedDisplayScopes.map((scope) => (
                    <li
                      key={scope.id}
                      className={`profile-consent-scope-item ${scope.className || ''}`}
                    >
                      <div>
                        <Text>{scope.label}</Text>
                        {scope.description && (
                          <Text as="div" size={100}>
                            {scope.description}
                          </Text>
                        )}
                      </div>
                      {scope.canBeRevoked && (
                        <Button
                          size="small"
                          appearance="primary"
                          onClick={() =>
                            onRevokeScope(
                              consent.id,
                              consent.policyId,
                              scope.id,
                              currentGrantedScopesForThisPolicy,
                            )
                          }
                        >
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {revokedDisplayScopes.length > 0 && (
              <div className="profile-scopes-section-revoked">
                <Text weight="medium">Revoked Scopes:</Text>
                <ul className="profile-consent-scopes-list">
                  {revokedDisplayScopes.map((scope) => (
                    <li
                      key={scope.id}
                      className={`profile-consent-scope-item ${scope.className || ''}`}
                    >
                      <div>
                        <Text>{scope.label}</Text>
                        {scope.description && (
                          <Text as="div" size={100}>
                            {scope.description}
                          </Text>
                        )}
                      </div>
                      {scope.canBeGranted && (
                        <Button
                          size="small"
                          appearance="outline"
                          onClick={() =>
                            onGrantScope(
                              consent.id,
                              consent.policyId,
                              scope.id,
                              currentGrantedScopesForThisPolicy,
                            )
                          }
                        >
                          Grant
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {grantedDisplayScopes.length === 0 &&
              revokedDisplayScopes.length === 0 &&
              (consent.status === 'granted' ||
                consent.status === 'revoked') && (
                <Text as="div" style={{ marginLeft: '16px', marginTop: '8px' }}>
                  No specific scopes detailed for this consent event.
                </Text>
              )}
          </div>
        );
      })}
    </div>
  );
};

export default ConsentsTab;
