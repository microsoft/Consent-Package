import React, { useState } from 'react';
import {
  Button,
  Text,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import './index.css';

export interface AgeRange {
  id: string;
  label: string;
  description?: string;
  minAge?: number;
  maxAge?: number;
}

export interface AgeSelectProps {
  onSubmit(ageId: string): void;
  ageRanges?: AgeRange[];
  selectedAgeRange?: string;
  submitLabel?: string;
  useDatePicker?: boolean;
}

const defaultAgeRanges: AgeRange[] = [
  {
    id: 'under13',
    label: 'Child',
    description: 'Ages 13 and under',
    minAge: 0,
    maxAge: 12
  },
  {
    id: '13-17',
    label: 'Teen',
    description: 'Ages 13 to 17',
    minAge: 13,
    maxAge: 17
  },
  {
    id: '18+',
    label: 'Adult',
    description: 'Ages 18 and over',
    minAge: 18,
    maxAge: undefined
  }
];

// DatePicker or DateSelect applicable
const AgeSelect: React.FC<AgeSelectProps> = ({
  ageRanges = defaultAgeRanges,
  onSubmit,
  selectedAgeRange,
  submitLabel = 'Continue',
  useDatePicker = false,
}) => {
  const [selected, setSelected] = useState<string | undefined>(selectedAgeRange);

  const handleAgeRangeSelect = (ageRangeId: string): void => {
    setSelected(ageRangeId);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const findAgeRange = (age: number): string | undefined => {
    return ageRanges.find(range => {
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
      setSelected(ageRangeId);
    }
  };

  const handleSubmit = (): void => {
    if (selected) onSubmit(selected);
  };

  return (
    <div className="age-select-container">
      <Text size={500} weight="semibold">
        Select Age Range
      </Text>
      {
        useDatePicker ? <DatePicker
            placeholder="Select date of birth..."
            onSelectDate={handleDateSelect}
            showGoToToday={false}
            maxDate={new Date()}
          /> :
          <div className="age-select-container">
            {ageRanges.map((ageRange) => (
              <Button
                key={ageRange.id}
                appearance="secondary"
                onClick={() => handleAgeRangeSelect(ageRange.id)}
                className={`age-range-button ${selected === ageRange.id ? 'selected' : ''}`}
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
      }
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

export default AgeSelect;
