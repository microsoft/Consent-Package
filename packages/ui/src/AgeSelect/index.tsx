// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import React, { useState } from 'react';
import { Button, Text } from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import type { AgeRange, AgeSelectProps } from './AgeSelect.type.js';
import './index.css';

const defaultAgeRanges: AgeRange[] = [
  {
    id: 'under13',
    label: 'Child',
    description: 'Ages 13 and under',
    minAge: 0,
    maxAge: 12,
  },
  {
    id: '13-17',
    label: 'Teen',
    description: 'Ages 13 to 17',
    minAge: 13,
    maxAge: 17,
  },
  {
    id: '18+',
    label: 'Adult',
    description: 'Ages 18 and over',
    minAge: 18,
    maxAge: undefined,
  },
];

// DatePicker or DateSelect applicable
const AgeSelect: React.FC<AgeSelectProps> = ({
  initialDateValue,
  initialAgeRangeIdValue,
  ageRanges = defaultAgeRanges,
  onSubmit,
  onChange,
  submitLabel = 'Continue',
  useDatePicker = false,
  showTitle = false,
}) => {
  const [selectedAgeRangeId, setSelectedAgeRangeId] = useState<
    string | undefined
  >(initialAgeRangeIdValue ?? ageRanges[0]?.id);
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [age, setAge] = useState<number | undefined>(undefined);

  const handleAgeRangeSelect = (ageRangeId: string): void => {
    setSelectedAgeRangeId(ageRangeId);
    onChange?.(ageRangeId, dob, age);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const findAgeRange = (age: number): string | undefined => {
    return ageRanges.find((range: AgeRange) => {
      const meetsMinAge = range.minAge === undefined || age >= range.minAge;
      const meetsMaxAge = range.maxAge === undefined || age <= range.maxAge;
      return meetsMinAge && meetsMaxAge;
    })?.id;
  };

  const handleDateSelect = (date: Date | null): void => {
    if (!date) return;

    const birthDate = new Date(date);
    const age = calculateAge(birthDate);
    const ageRangeId = findAgeRange(age);

    if (ageRangeId) {
      setSelectedAgeRangeId(ageRangeId);
      setDob(birthDate);
      setAge(age);
      onChange?.(ageRangeId, birthDate, age);
    }
  };

  const handleSubmit = (): void => {
    if (selectedAgeRangeId) onSubmit?.(selectedAgeRangeId, dob, age);
  };

  return (
    <div className="age-select-container">
      {showTitle && (
        <Text size={500} weight="semibold">
          Select Age Range
        </Text>
      )}
      {useDatePicker ? (
        <DatePicker
          placeholder="Select date of birth..."
          value={initialDateValue === undefined ? null : initialDateValue}
          onSelectDate={handleDateSelect}
          showGoToToday={false}
          maxDate={new Date()}
          allowTextInput
        />
      ) : (
        <div className="age-select-container">
          {ageRanges.map((ageRange: AgeRange) => (
            <Button
              key={ageRange.id}
              appearance="secondary"
              onClick={() => handleAgeRangeSelect(ageRange.id)}
              className={`age-range-button ${selectedAgeRangeId === ageRange.id ? 'selected' : ''}`}
            >
              <div className="age-range-content">
                <Text size={400} weight="semibold">
                  {ageRange.label}
                </Text>
                {ageRange.description && (
                  <Text size={300} className="age-range-description">
                    {ageRange.description}
                  </Text>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
      {onSubmit && (
        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={!selectedAgeRangeId}
          className="submit-button"
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
};

export default AgeSelect;
