import React from 'react';
import {
  Input,
  Checkbox,
  makeStyles,
  tokens,
  Label,
} from '@fluentui/react-components';
import type { CheckboxProps } from '@fluentui/react-components';
import type { PolicyEditorFormData } from '../hooks/usePolicyEditor.js'; // Adjust path as needed

const useStyles = makeStyles({
  fieldSet: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statusSelect: {
    height: '32px',
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    paddingLeft: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    ':focus': {
      outline: `2px solid ${tokens.colorCompoundBrandStroke}`,
      borderColor: tokens.colorCompoundBrandStroke,
    },
  },
});

interface PolicyMetadataFormProps {
  formData: Pick<
    PolicyEditorFormData,
    | 'title'
    | 'policyGroupId'
    | 'version'
    | 'effectiveDate'
    | 'jurisdiction'
    | 'requiresProxyForMinors'
    | 'status'
  >;
  onInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void;
  onDateChange(event: React.ChangeEvent<HTMLInputElement>): void;
  onCheckboxChange(name: keyof PolicyEditorFormData, checked: boolean): void;
  onStatusChange(status: PolicyEditorFormData['status']): void;
  isNewPolicy: boolean;
}

const PolicyMetadataForm: React.FC<PolicyMetadataFormProps> = ({
  formData,
  onInputChange,
  onDateChange,
  onCheckboxChange,
  onStatusChange,
  isNewPolicy,
}) => {
  const styles = useStyles();

  return (
    <>
      <div className={styles.fieldSet}>
        <Label htmlFor="title" required>
          Policy Title
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={onInputChange}
          required
        />
      </div>

      {isNewPolicy && (
        <div className={styles.fieldSet}>
          <Label htmlFor="policyGroupId">
            Policy Group ID (for new policy, can be new or existing group)
          </Label>
          <Input
            id="policyGroupId"
            name="policyGroupId"
            value={formData.policyGroupId || ''}
            onChange={onInputChange}
          />
        </div>
      )}

      <div className={styles.fieldSet}>
        <Label htmlFor="effectiveDate" required>
          Effective Date
        </Label>
        <Input
          id="effectiveDate"
          name="effectiveDate"
          type="date"
          value={formData.effectiveDate}
          onChange={onDateChange}
          required
        />
      </div>

      <div className={styles.fieldSet}>
        <Label htmlFor="jurisdiction">Jurisdiction</Label>
        <Input
          id="jurisdiction"
          name="jurisdiction"
          value={formData.jurisdiction || ''}
          onChange={onInputChange}
        />
      </div>

      <div className={styles.fieldSet}>
        <Checkbox
          id="requiresProxyForMinors"
          name="requiresProxyForMinors"
          label="Requires Proxy for Minors"
          checked={formData.requiresProxyForMinors || false}
          onChange={(
            _ev: React.FormEvent<HTMLInputElement>,
            data: CheckboxProps,
          ) => onCheckboxChange('requiresProxyForMinors', !!data.checked)}
        />
      </div>

      <div className={styles.fieldSet}>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onStatusChange(e.target.value as PolicyEditorFormData['status'])
          }
          className={styles.statusSelect}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </>
  );
};

export default PolicyMetadataForm;
