export type HolidayType = 'global' | 'cohort_specific';
export type HolidayStatus = 'draft' | 'published';

export interface Holiday {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string;
  description?: string;
  holiday_type: HolidayType;
  cohort_id?: string;
  status: HolidayStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateHolidayRequest {
  date: string;
  title: string;
  description?: string;
  holiday_type: HolidayType;
  cohort_id?: string;
  status?: HolidayStatus;
}

export interface UpdateHolidayRequest {
  id: string;
  date?: string;
  title?: string;
  description?: string;
  status?: HolidayStatus;
}

export interface HolidayFormData {
  date: string;
  title: string;
  description: string;
}

// For calendar component
export interface SelectedHoliday extends HolidayFormData {
  isNew?: boolean;
  id?: string;
}
