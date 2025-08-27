import { EquipmentConditionStatus } from './equipment.types';

export type DamageStatus =
  | 'reported'
  | 'under_review'
  | 'repair_approved'
  | 'repair_completed'
  | 'replacement_approved'
  | 'resolved';

export interface EquipmentDamageReport {
  id: string;
  equipment_id: string;
  reported_by: string;
  damage_type: 'damage' | 'loss' | 'theft';
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  status: DamageStatus;
  estimated_repair_cost?: number;
  actual_repair_cost?: number;
  repair_date?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: any; // Equipment type
  reported_by_user?: any; // UserProfile type
}

export interface CreateDamageReportData {
  equipment_id: string;
  damage_type: 'damage' | 'loss' | 'theft';
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  estimated_repair_cost?: number;
}
