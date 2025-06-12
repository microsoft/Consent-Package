// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React from 'react';
import {
  Input,
  Textarea,
  Checkbox,
  Button,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { CheckboxProps } from '@fluentui/react-components';
import type { PolicyScope } from '@open-source-consent/types';

const useStyles = makeStyles({
  sectionCard: {
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  removeButton: {
    marginTop: tokens.spacingVerticalM,
    alignSelf: 'flex-end',
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      color: tokens.colorPaletteRedForeground2,
    },
  },
});

interface PolicyScopeEditorProps {
  scope: PolicyScope;
  index: number;
  onUpdateScope(
    index: number,
    field: keyof PolicyScope,
    value: string | boolean,
  ): void;
  onRemoveScope(index: number): void;
}

const PolicyScopeEditor: React.FC<PolicyScopeEditorProps> = ({
  scope,
  index,
  onUpdateScope,
  onRemoveScope,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.sectionCard}>
      <Input
        placeholder="Scope Key (e.g., nutrition_log)"
        value={scope.key}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onUpdateScope(index, 'key', e.target.value)
        }
        required
      />
      <Input
        placeholder="Scope Name (e.g., Nutrition Logs)"
        value={scope.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onUpdateScope(index, 'name', e.target.value)
        }
        required
      />
      <Textarea
        placeholder="Scope Description"
        value={scope.description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onUpdateScope(index, 'description', e.target.value)
        }
        required
      />
      <Checkbox
        label="Required Scope"
        checked={scope.required || false}
        onChange={(
          _ev: React.FormEvent<HTMLInputElement>,
          data: CheckboxProps,
        ) => onUpdateScope(index, 'required', !!data.checked)}
      />
      <Button
        type="button"
        onClick={() => onRemoveScope(index)}
        appearance="outline"
        className={styles.removeButton}
      >
        Remove Scope
      </Button>
    </Card>
  );
};

export default PolicyScopeEditor;
