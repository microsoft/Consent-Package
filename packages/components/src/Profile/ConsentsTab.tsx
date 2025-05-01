import React from 'react';
import {
  Text,
  Badge,
} from '@fluentui/react-components';
import type { ProfileData } from './index.js';

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
          <Badge color={consent.status.id === 'granted' ? 'success' : 'danger'}>
            {consent.status?.label}
          </Badge>
          <ul>
            {consent.scopes.map(scope => (
              <li key={scope.id}>
                <Text>{scope.label}</Text>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ConsentsTab; 
