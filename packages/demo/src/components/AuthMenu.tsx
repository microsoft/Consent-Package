// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { useNavigate } from 'react-router';
import { Persona } from '@fluentui/react-components';
import { useAuth } from '../utils/useAuth.js';
import { UserMenu } from './UserMenu.js';

export function AuthMenu(): JSX.Element | null {
  const navigate = useNavigate();
  const { currentUser, isLoading, logout } = useAuth();

  const handlePerformLogout = () => {
    logout();
    void navigate('/');
  };

  if (isLoading) {
    return <Persona text="Loading..." />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <UserMenu user={currentUser} onLogout={handlePerformLogout} />
    </>
  );
}
