import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Text,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Avatar,
  Button,
  Input,
} from '@fluentui/react-components';
import type { ProfileData } from './Profile.type.js';

type ManagedSubject = NonNullable<ProfileData['managedSubjects']>[number];

interface ManagedSubjectsTabProps {
  managedSubjects: ProfileData['managedSubjects'];
  onSubjectSelect(subjectId: string): void;
  onSubjectUpdate?(subjectId: string, updates: Partial<ManagedSubject>): void;
}

const ManagedSubjectsTab: React.FC<ManagedSubjectsTabProps> = ({
  managedSubjects,
  onSubjectSelect,
  onSubjectUpdate,
}) => {
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editedRelationship, setEditedRelationship] = useState<string>('');

  const handleEditClick = (subject: ManagedSubject): void => {
    setEditingSubjectId(subject.id);
    setEditedRelationship(subject.relationship);
  };

  const handleSaveClick = (subjectId: string): void => {
    if (onSubjectUpdate) {
      onSubjectUpdate(subjectId, { relationship: editedRelationship });
    }
    setEditingSubjectId(null);
  };

  const handleCancelClick = (): void => {
    setEditingSubjectId(null);
  };

  if (!managedSubjects?.length) {
    return (
      <Card className="profile-card">
        <CardPreview>
          <Text>No managed subjects available</Text>
        </CardPreview>
      </Card>
    );
  }

  return (
    <div className="profile-managed-subjects-grid">
      {managedSubjects.map((subject) => (
        <Card key={subject.id} className="profile-card">
          <CardHeader header={
            <>
              <Avatar name={subject.name} />&nbsp;
              <Text size={500} weight="semibold">{subject.name}</Text>
            </>
          }/>
          <CardPreview>
            {editingSubjectId === subject.id ? (
              <div className="profile-form-group">
                <Text>Relationship:</Text>
                <Input
                  value={editedRelationship}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedRelationship(e.target.value)}
                />
              </div>
            ) : (
              <Text>Relationship: {subject.relationship}</Text>
            )}
            <Text>Age Group: {subject.ageGroup?.label}</Text>
          </CardPreview>
          <CardFooter>
            {editingSubjectId === subject.id ? (
              <div className="profile-button-group">
                <Button
                  appearance="primary"
                  onClick={() => handleSaveClick(subject.id)}
                >
                  Save
                </Button>
                <Button
                  appearance="secondary"
                  onClick={handleCancelClick}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="profile-button-group">
                <Button
                  appearance="primary"
                  onClick={() => onSubjectSelect(subject.id)}
                >
                  View Details
                </Button>
                <Button
                  appearance="secondary"
                  onClick={() => handleEditClick(subject)}
                >
                  Edit
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ManagedSubjectsTab; 
