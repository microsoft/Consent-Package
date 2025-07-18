// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../utils/useAuth.js';

interface ProtectedRouteProps {
  children: ReactNode;
  requireNoUser?: boolean;
}

export default function ProtectedRoute({
  children,
  requireNoUser = false,
}: ProtectedRouteProps): JSX.Element {
  const { currentUser } = useAuth();

  if (requireNoUser && currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
