import React, { useState } from 'react';
import {
  Button,
  Body1,
  Caption1,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Avatar,
  Input,
  Label,
} from '@fluentui/react-components';
import { EditRegular, EditOffRegular } from '@fluentui/react-icons';
import type { ProfileData } from './index.js';

interface PersonalProfileTabProps {
  profileData: ProfileData;
  onSave(updates: Partial<ProfileData>): void;
}

const PersonalProfileTab: React.FC<PersonalProfileTabProps> = ({
  profileData,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>(profileData);

  const handleEdit = (): void => {
    setIsEditing(!isEditing);
  };

  const handleCancel = (): void => {
    setEditedProfile(profileData);
    setIsEditing(false);
  };

  const handleSave = (): void => {
    onSave(editedProfile);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof ProfileData, value: string): void => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="profile-card">
      <CardHeader
        header={
          <Body1>
            <Avatar name={profileData.name} />&nbsp;
            <b>Personal Information</b>
          </Body1>
        }
        description={<Caption1>{profileData.role?.label}</Caption1>}
        action={
          <Button
            appearance="transparent"
            aria-label="Edit Profile"
            icon={isEditing ? <EditOffRegular /> : <EditRegular />}
            onClick={handleEdit}
          />
        }
      />
      <CardPreview>
        {isEditing ? (
          <div className="profile-form-group">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedProfile.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
            />
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={editedProfile.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
            />
            <div className="profile-button-group">
              <Button appearance="primary" onClick={handleSave}>
                Save Changes
              </Button>
              <Button appearance="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Text>Name: {profileData.name}</Text>
            <Text>Email: {profileData.email}</Text>
            <Text>Role: {profileData.role?.label}</Text>
          </>
        )}
      </CardPreview>
    </Card>
  );
};

export default PersonalProfileTab; 
