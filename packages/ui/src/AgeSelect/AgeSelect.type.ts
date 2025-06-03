export interface AgeRange {
  id: string;
  label: string;
  description?: string;
  minAge?: number;
  maxAge?: number;
}

export interface AgeSelectProps {
  initialDateValue?: Date;
  initialAgeRangeIdValue?: string;
  onSubmit?(ageId: string, dob?: Date, age?: number): void;
  onChange?(ageId: string, dob?: Date, age?: number): void;
  ageRanges?: AgeRange[];
  submitLabel?: string;
  useDatePicker?: boolean;
  showTitle?: boolean;
}
