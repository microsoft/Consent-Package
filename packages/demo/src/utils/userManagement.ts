// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { ProfileData } from '@open-source-consent/ui';

/**
 * This module handles mock user management.
 * This is purely to demonstrate the consent management functionality.
 * This framework does not provide auth or user management.
 */

export type BasicUserInfo = {
  id: string;
  name: string;
};

const USER_ID_STORAGE_KEY = 'currentUserId';
const USER_NAME_STORAGE_KEY = 'currentUserName';

function getCurrentUserName(): string | null {
  return localStorage.getItem(USER_NAME_STORAGE_KEY);
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_ID_STORAGE_KEY);
}

export function login(user: BasicUserInfo): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, user.id);
  localStorage.setItem(USER_NAME_STORAGE_KEY, user.name);
}

export function logout(): void {
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  localStorage.removeItem(USER_NAME_STORAGE_KEY);
}

export async function fetchUserProfile(
  userId: string,
): Promise<ProfileData | null> {
  return {
    id: userId,
    name: getCurrentUserName() || `${userId}`,
    email: `${userId.replace(/[^a-zA-Z0-9]/g, '-')}@example.com`,
    role: { id: 'self', label: 'Myself' },
    consents: [], // These are fetched from the API
    managedSubjects: [], // These are fetched from the API
  };
}
