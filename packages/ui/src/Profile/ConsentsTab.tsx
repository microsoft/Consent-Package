// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React, { useState } from 'react';
import { Text, Badge, Button } from '@fluentui/react-components';
import type { ConsentRecord } from '@open-source-consent/types';
import ConfirmationDialog from './ConfirmationDialog.js';

interface ScopeDisplayInfo {
  id: string;
  label: string;
  description?: string;
  className?: string;
  canBeRevoked?: boolean;
  canBeGranted?: boolean;
  isRequired?: boolean;
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

interface DialogState {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm(): void;
  confirmButtonAppearance?: 'primary' | 'outline' | 'subtle' | 'transparent';
}

const ConsentsTab: React.FC<ConsentsTabProps> = ({
  consents,
  onRevokeScope,
  onGrantScope,
}) => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

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

  const handleRevokeClick = (
    consentId: string,
    policyId: string,
    scopeId: string,
    scopeLabel: string,
    currentGrantedScopes: string[],
    isScopeRequired: boolean | undefined,
  ) => {
    let additionalInfo =
      'You can revisit your profile to opt-in or opt-out at any time.';
    const willRevokeAllScopes =
      currentGrantedScopes.length === 1 && currentGrantedScopes[0] === scopeId;

    if (isScopeRequired) {
      additionalInfo = `This action will revoke a required data grant which will revoke all consent for this program.`;
    }

    if (willRevokeAllScopes) {
      additionalInfo = `This action will revoke all scopes.`;
    }

    const message: React.ReactNode = (
      <>
        <Text as="p">
          Are you sure you want to revoke the scope:{' '}
          <span style={{ fontWeight: 'bold' }}>{scopeLabel}</span>?
        </Text>

        <Text as="p" style={{ marginTop: '8px', display: 'block' }}>
          {additionalInfo}
        </Text>
      </>
    );

    setDialogState({
      isOpen: true,
      title: 'Confirm Revocation',
      message,
      onConfirm: () =>
        onRevokeScope(consentId, policyId, scopeId, currentGrantedScopes),
      confirmButtonAppearance: 'primary',
    });
  };

  const handleGrantClick = (
    consentId: string,
    policyId: string,
    scopeId: string,
    scopeLabel: string,
    currentGrantedScopes: string[],
  ) => {
    const message: React.ReactNode = (
      <>
        <Text as="p">
          Are you sure you want to grant the scope:{' '}
          <span style={{ fontWeight: 'bold' }}>{scopeLabel}</span>?
        </Text>
        <Text as="p" style={{ marginTop: '8px', display: 'block' }}>
          You can revisit your profile to opt-in or opt-out at any time.
        </Text>
      </>
    );
    setDialogState({
      isOpen: true,
      title: 'Confirm Grant',
      message,
      onConfirm: () =>
        onGrantScope(consentId, policyId, scopeId, currentGrantedScopes),
      confirmButtonAppearance: 'outline',
    });
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmButtonAppearance={dialogState.confirmButtonAppearance}
      />
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
                  isRequired: scopeWithGrant.required,
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
                  isRequired: scopeWithRevocation.required,
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
              let isRequired = false;

              if (explicitRevocation) {
                label = explicitRevocation.name || scopeId;
                description = explicitRevocation.description || '';
                className = 'scope-explicitly-revoked';
                isRequired = !!explicitRevocation.required;
              } else {
                const grantedScope = consent.grantedScopes[scopeId];
                label = grantedScope?.name || scopeId;
                description = grantedScope?.description || '';
                className = 'scope-implicitly-revoked';
                isRequired = !!grantedScope?.required;
              }
              revokedDisplayScopes.push({
                id: scopeId,
                label: label,
                description: description,
                className: className,
                canBeGranted: true,
                isRequired: isRequired,
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
              <Badge className="profile-consent-badge">{consent.status}</Badge>

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
                          {scope.isRequired && (
                            <Badge
                              color="warning"
                              style={{ marginLeft: '4px', marginRight: '4px' }}
                            >
                              Required
                            </Badge>
                          )}
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
                              handleRevokeClick(
                                consent.id,
                                consent.policyId,
                                scope.id,
                                scope.label,
                                currentGrantedScopesForThisPolicy,
                                scope.isRequired,
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
                          {scope.isRequired && (
                            <Badge
                              color="warning"
                              style={{ marginLeft: '4px', marginRight: '4px' }}
                            >
                              Required
                            </Badge>
                          )}
                          {scope.description && (
                            <Text as="div" size={100}>
                              {scope.description}
                            </Text>
                          )}
                        </div>
                        {scope.canBeGranted && consent.status !== 'revoked' && (
                          <Button
                            size="small"
                            appearance="outline"
                            onClick={() =>
                              handleGrantClick(
                                consent.id,
                                consent.policyId,
                                scope.id,
                                scope.label,
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
                  <Text
                    as="div"
                    style={{ marginLeft: '16px', marginTop: '8px' }}
                  >
                    No specific scopes detailed for this consent event.
                  </Text>
                )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ConsentsTab;
