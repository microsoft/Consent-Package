// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { AgeGroup } from '@open-source-consent/types';
import type { ProfileData } from '../Profile/Profile.type.js';

export const getAgeGroup = (
  ageInYears: number | string | undefined,
): AgeGroup => {
  if (ageInYears === undefined) return '18+';
  const age =
    typeof ageInYears === 'string' ? parseInt(ageInYears, 10) : ageInYears;
  if (isNaN(age)) return '18+';

  if (age < 13) return 'under13';
  if (age >= 13 && age <= 17) return '13-17';
  return '18+';
};

export const ageGroupToBasicInfo = (
  ageGroupId: AgeGroup,
): ProfileData['role'] => {
  switch (ageGroupId) {
    case 'under13':
      return { id: 'under13', label: 'Under 13' };
    case '13-17':
      return { id: '13-17', label: '13-17' };
    case '18+':
      return { id: '18+', label: '18+' };
    default:
      return { id: ageGroupId, label: ageGroupId };
  }
};
