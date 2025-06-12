// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import {
  Text,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Avatar,
  Button,
} from '@fluentui/react-components';
import type { ProfileData } from './Profile.type.js';

interface ManagedSubjectsTabProps {
  managedSubjects: ProfileData['managedSubjects'];
  onSubjectSelect(subjectId: string): void;
}

const ManagedSubjectsTab: React.FC<ManagedSubjectsTabProps> = ({
  managedSubjects,
  onSubjectSelect,
}) => {
  if (!managedSubjects?.length) {
    return (
      <Card className="profile-card">
        <CardPreview>
          <Text>No managed proxies available</Text>
        </CardPreview>
      </Card>
    );
  }

  return (
    <div className="profile-managed-subjects-grid">
      {managedSubjects.map((subject) => (
        <Card key={subject.id} className="profile-card">
          <CardHeader
            header={
              <>
                <Avatar name={subject.name} />
                &nbsp;
                <Text size={500} weight="semibold">
                  {subject.name}
                </Text>
              </>
            }
          />
          <CardPreview>
            <Text>Relationship: {subject.relationship}</Text>
            <Text>Age Group: {subject.ageGroup?.label}</Text>
          </CardPreview>
          <CardFooter>
            <div className="profile-button-group">
              <Button
                appearance="primary"
                onClick={() => onSubjectSelect(subject.id)}
              >
                View Details
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ManagedSubjectsTab;
