export interface Role {
  id: string;
  label: string;
  description?: string;
}

export interface RoleSelectProps {
  initialRoleIdValue?: string;
  roles?: Role[];
  onSubmit?(roleId: string): void;
  onChange?(roleId: string): void;
  submitLabel?: string;
  showTitle?: boolean;
}
