import type { ProfileData } from '@open-source-consent/ui';

/**
 * This module handles mock user management.
 * This is purely to demonstrate the consent management functionality.
 * This framework does not provide auth or user management.
 */

const USER_ID_STORAGE_KEY = 'currentUserId';

export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_ID_STORAGE_KEY);
}

export function login(userId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
}

export function logout(): void {
  localStorage.removeItem(USER_ID_STORAGE_KEY);
}

export async function fetchUserProfile(
  userId: string,
): Promise<ProfileData | null> {
  return {
    id: userId,
    name: `${userId}`,
    email: `${userId.replace(/[^a-zA-Z0-9]/g, '-')}@example.com`,
    role: { id: 'self', label: 'Myself' },
    consents: [], // These are fetched from the API
    managedSubjects: [], // These are fetched from the API
  };
}
