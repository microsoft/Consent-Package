import React, { useState } from 'react';
import { Button, Text } from '@fluentui/react-components';
import type { RoleSelectProps, Role } from './RoleSelect.type.js';
import './index.css';

const defaultRoles: Role[] = [
  {
    id: 'self',
    label: 'Self',
    description: 'I am providing consent for myself'
  },
  {
    id: 'proxy',
    label: 'Parent / Guardian / Representative',
    description: 'I am providing consent on behalf of someone else'
  }
];

const RoleSelect: React.FC<RoleSelectProps> = ({
  initialRoleIdValue,
  roles = defaultRoles,
  onSubmit,
  onChange,
  submitLabel = 'Continue',
  showTitle = false,
}) => {
  const [selected, setSelected] = useState<string | undefined>(initialRoleIdValue ?? roles[0]?.id);

  const handleRoleSelect = (roleId: string): void => {
    setSelected(roleId);
    onChange?.(roleId);
  };

  const handleSubmit = (): void => {
    if (selected) onSubmit?.(selected);
  };

  return (
    <div className="role-select-container">
      {showTitle && <Text size={500} weight="semibold">
        Select Role
      </Text>}
      <div className="role-select-container">
        {roles.map((role) => (
          <Button
            key={role.id}
            appearance="secondary"
            onClick={() => handleRoleSelect(role.id)}
            className={`role-button ${selected === role.id ? 'selected' : ''}`}
          >
            <div className="role-content">
              <Text size={400} weight="semibold">
                {role.label}
              </Text>
              {role.description && (
                <Text size={300} className="role-description">
                  {role.description}
                </Text>
              )}
            </div>
          </Button>
        ))}
      </div>
      {onSubmit && <Button
        appearance="primary"
        onClick={handleSubmit}
        disabled={!selected}
        className="submit-button"
      >
        {submitLabel}
      </Button>}
    </div>
  );
};

export default RoleSelect;
