// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  usePolicyEditor,
  PolicyMetadataForm,
  PolicyContentSectionEditor,
  PolicyScopeEditor,
} from '@open-source-consent/ui';
import {
  Button,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  Title3,
  Subtitle2,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    padding: '24px',
    margin: '0 auto',
    display: 'flex',
    maxWidth: '1200px',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
    '@media (max-width: 768px)': {
      padding: '0px',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  card: {
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: 'none',
  },
  cardHeader: {
    marginBottom: tokens.spacingVerticalM,
  },
  cardHeaderContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  addSectionButton: {
    marginTop: tokens.spacingVerticalS,
    maxWidth: '200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: tokens.colorPaletteBlueBackground1,
    color: tokens.colorPaletteBlueForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteBlueBackground2,
      color: tokens.colorPaletteBlueForeground2,
    },
  },
});

const PolicyEditorPage: React.FC = () => {
  const { policyId } = useParams<{ policyId?: string }>();
  const {
    policy,
    formData,
    isLoading,
    error,
    setFormData,
    savePolicy,
    addContentSection,
    updateContentSection,
    removeContentSection,
    addScope,
    updateScope,
    removeScope,
  } = usePolicyEditor(policyId);

  const styles = useStyles();
  const navigate = useNavigate();

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      effectiveDate: event.target.value,
    });
  };

  const handleCheckboxChange = (
    name: keyof typeof formData,
    checked: boolean,
  ): void => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleStatusChange = (status: typeof formData.status) => {
    setFormData({ ...formData, status });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await savePolicy();
    await navigate(`/policies`);
  };

  if (isLoading) return <p>Loading policy editor...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader
          className={styles.cardHeader}
          header={
            <div className={styles.cardHeaderContent}>
              <Title3>
                {policyId
                  ? `Edit Policy (ID: ${policy?.id || policyId})`
                  : 'Create New Policy'}
              </Title3>
              <Subtitle2>
                {policy?.policyGroupId === 'sample-group-1'
                  ? 'Note: Updating this policy will update the content for the Consent Demo.'
                  : 'Note: Creating this new policy is purely for demo purposes and will not be available for the Consent Demo.'}
              </Subtitle2>
            </div>
          }
        />
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className={styles.form}
        >
          <PolicyMetadataForm
            formData={formData}
            onInputChange={handleInputChange}
            onDateChange={handleDateChange}
            onCheckboxChange={handleCheckboxChange}
            onStatusChange={handleStatusChange}
            isNewPolicy={!policyId}
          />

          <Subtitle2>Content Sections</Subtitle2>
          {formData.contentSections.map((section, index) => (
            <PolicyContentSectionEditor
              key={index}
              index={index}
              section={section}
              onUpdateSection={updateContentSection}
              onRemoveSection={removeContentSection}
            />
          ))}
          <Button
            type="button"
            onClick={addContentSection}
            appearance="outline"
            className={styles.addSectionButton}
          >
            Add Content Section
          </Button>

          <Subtitle2>Available Scopes</Subtitle2>
          {formData.availableScopes.map((scope, index) => (
            <PolicyScopeEditor
              key={index}
              index={index}
              scope={scope}
              onUpdateScope={updateScope}
              onRemoveScope={removeScope}
            />
          ))}
          <Button
            type="button"
            onClick={addScope}
            appearance="outline"
            className={styles.addSectionButton}
          >
            Add Scope
          </Button>

          <div className={styles.buttonContainer}>
            <Button type="submit" appearance="primary">
              {policyId ? 'Save Changes' : 'Create Policy'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PolicyEditorPage;
