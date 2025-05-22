import React from "react";
import { Text, Badge, Button } from "@fluentui/react-components";
import type { ConsentRecord } from "@open-source-consent/types";

interface ScopeDisplayInfo {
  id: string;
  label: string;
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
    currentGrantedScopes: string[]
  ): void;
  onGrantScope(
    consentId: string,
    policyId: string,
    scopeId: string,
    currentGrantedScopes: string[]
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
      (c) => c.policyId === policyId && c.status === "granted"
    );
    return activeConsentForPolicy
      ? Object.keys(activeConsentForPolicy.grantedScopes || {})
      : [];
  };

  return (
    <div className="profile-consent-list-container">
      {consents.map((consent) => {
        const currentGrantedScopesForThisPolicy = getGrantedScopesForPolicy(
          consent.policyId
        );
        const scopesToDisplay: Array<ScopeDisplayInfo> = [];

        if (consent.status === "granted") {
          Object.entries(consent.grantedScopes || {}).forEach(
            ([scopeId, scopeGrant]) => {
              scopesToDisplay.push({
                id: scopeId,
                label: scopeId,
                className: "scope-granted",
                canBeRevoked: true,
              });
            }
          );
          Object.entries(consent.revokedScopes || {}).forEach(
            ([scopeId, scopeRevocation]) => {
              scopesToDisplay.push({
                id: scopeId,
                label: `${scopeId} (not granted for this version - revoked ${scopeRevocation.revokedAt.toLocaleDateString()})`,
                className: "scope-revoked-on-granted-record",
                canBeGranted: true,
              });
            }
          );
        } else if (consent.status === "revoked") {
          Object.entries(consent.revokedScopes || {}).forEach(
            ([scopeId, scopeRevocation]) => {
              scopesToDisplay.push({
                id: scopeId,
                label: `${scopeId} (revoked ${scopeRevocation.revokedAt.toLocaleDateString()})`,
                className: "scope-explicitly-revoked",
                canBeGranted: true,
              });
            }
          );
          Object.entries(consent.grantedScopes || {}).forEach(
            ([scopeId, scopeGrant]) => {
              if (!consent.revokedScopes?.[scopeId]) {
                scopesToDisplay.push({
                  id: scopeId,
                  label: `${scopeId} (implicitly revoked as record is revoked)`,
                  className: "scope-implicitly-revoked",
                  canBeGranted: true,
                });
              }
            }
          );
        } else if (consent.status === "superseded") {
          const allSupersededScopeKeys = new Set([
            ...Object.keys(consent.grantedScopes || {}),
            ...Object.keys(consent.revokedScopes || {}),
          ]);

          allSupersededScopeKeys.forEach((scopeId) => {
            let label = scopeId;
            const revokedInfo = consent.revokedScopes?.[scopeId];
            const grantedInfo = consent.grantedScopes?.[scopeId];

            if (revokedInfo) {
              label = `${scopeId} (was revoked on ${revokedInfo.revokedAt.toLocaleDateString()}, record superseded)`;
            } else if (grantedInfo) {
              label = `${scopeId} (was granted, record superseded)`;
            }

            scopesToDisplay.push({
              id: scopeId,
              label: label,
              className: "scope-superseded",
            });
          });
        }

        scopesToDisplay.sort((a, b) => a.id.localeCompare(b.id));

        return (
          <div key={`${consent.id}`} className="profile-consent-item">
            <Text size={400} weight="semibold">
              Policy ID: {consent.policyId}
            </Text>
            <Badge
              className="profile-consent-badge"
              color={
                consent.status === "granted"
                  ? "success"
                  : consent.status === "revoked"
                    ? "danger"
                    : "warning"
              }
            >
              {consent.status}
            </Badge>

            <ul className="profile-consent-scopes-list">
              {scopesToDisplay.map((scope) => (
                <li
                  key={scope.id}
                  className={`profile-consent-scope-item ${scope.className || ""}`}
                >
                  <Text>{scope.label}</Text>
                  {scope.canBeRevoked && (
                    <Button
                      size="small"
                      appearance="subtle"
                      onClick={() =>
                        onRevokeScope(
                          consent.id,
                          consent.policyId,
                          scope.id,
                          currentGrantedScopesForThisPolicy
                        )
                      }
                    >
                      Revoke
                    </Button>
                  )}
                  {scope.canBeGranted && (
                    <Button
                      size="small"
                      appearance="subtle"
                      onClick={() =>
                        onGrantScope(
                          consent.id,
                          consent.policyId,
                          scope.id,
                          currentGrantedScopesForThisPolicy
                        )
                      }
                    >
                      Grant
                    </Button>
                  )}
                </li>
              ))}
              {scopesToDisplay.length === 0 &&
                (consent.status === "granted" ||
                  consent.status === "revoked") && (
                  <Text as="li">
                    No specific scopes detailed for this consent event.
                  </Text>
                )}
              {scopesToDisplay.length === 0 &&
                consent.status === "superseded" && (
                  <Text as="li">
                    No specific scopes detailed for this superseded consent.
                  </Text>
                )}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default ConsentsTab;
