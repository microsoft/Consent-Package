import React from 'react';
import {
  Body1,
  Caption1,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Avatar,
} from '@fluentui/react-components';
import type { ProfileData } from './Profile.type.js';

interface PersonalProfileTabProps {
  profileData: ProfileData;
}

const PersonalProfileTab: React.FC<PersonalProfileTabProps> = ({
  profileData,
}) => {
  return (
    <Card className="profile-card">
      <CardHeader
        header={
          <Body1>
            <Avatar name={profileData.name} />
            &nbsp;
            <b>{profileData.name}</b>
          </Body1>
        }
        description={<Caption1>{profileData.role?.label}</Caption1>}
      />
      <CardPreview>
        <Text>Name: {profileData.name}</Text>
        <Text>Role: {profileData.role?.label}</Text>
      </CardPreview>
    </Card>
  );
};

export default PersonalProfileTab;
