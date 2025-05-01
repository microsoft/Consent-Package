import React, { useState } from 'react';
import {
  Button,
  Text,
} from '@fluentui/react-components';
import './index.css';

export interface Role {
  id: string;
  label: string;
  description?: string;
}

export interface RoleSelectProps {
  roles: Role[];
  onSubmit(roleId: string): void;
  selectedRole?: string;
  submitLabel?: string;
}

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
  roles = defaultRoles,
  onSubmit,
  selectedRole,
  submitLabel = 'Continue',
}) => {
  const [selected, setSelected] = useState<string | undefined>(selectedRole);

  const handleRoleSelect = (roleId: string): void => {
    setSelected(roleId);
  };

  const handleSubmit = (): void => {
    if (selected) onSubmit(selected);
  };

  return (
    <div className="role-select-container">
      <Text size={500} weight="semibold">
        Select Role
      </Text>
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
      <Button
        appearance="primary"
        onClick={handleSubmit}
        disabled={!selected}
        className="submit-button"
      >
        {submitLabel}
      </Button>
    </div>
  );
};

export default RoleSelect;
