import React from 'react';
import {
  Text,
  Badge,
} from '@fluentui/react-components';
import type { ProfileData } from './Profile.type.js';

interface ConsentsTabProps {
  consents: ProfileData['consents'];
}

const ConsentsTab: React.FC<ConsentsTabProps> = ({ consents }) => {
  if (!consents?.length) {
    return (
      <div className="profile-consent-item">
        <Text>No consents available</Text>
      </div>
    );
  }

  return (
    <div className="profile-consent-list-container">
      {consents.map(consent => (
        <div key={consent.id} className="profile-consent-item">
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
              <li key={scope.id}>
                {scope.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ConsentsTab; 
