/**
 * Leave Usage Calculation Utilities
 * Calculates leave usage and status indicators for students
 */

import type { AttendanceRecord } from '@/types/attendance';

export interface LeaveUsageStats {
  totalLeaves: number; // informed + uninformed (excluding exempted)
  informedLeaves: number;
  uninformedLeaves: number;
  exemptedLeaves: number;
  maxAllowed: number;
  remainingLeaves: number;
  status: 'safe' | 'critically_low' | 'poor';
}

/**
 * Calculate leave usage statistics for a student
 */
export function calculateLeaveUsage(
  attendanceRecords: AttendanceRecord[],
  maxLeave: number = 6
): LeaveUsageStats {
  // Filter only absent records
  const absentRecords = attendanceRecords.filter(record => record.status === 'absent');
  
  // Count different types of absences
  const informedLeaves = absentRecords.filter(record => record.absence_type === 'informed').length;
  const uninformedLeaves = absentRecords.filter(record => record.absence_type === 'uninformed').length;
  const exemptedLeaves = absentRecords.filter(record => record.absence_type === 'exempted').length;
  
  // Total leaves count (informed + uninformed, excluding exempted)
  const totalLeaves = informedLeaves + uninformedLeaves;
  
  // Calculate remaining leaves
  const remainingLeaves = Math.max(0, maxLeave - totalLeaves);
  
  // Determine status based on leave usage
  let status: 'safe' | 'critically_low' | 'poor';
  if (totalLeaves > maxLeave) {
    status = 'poor';
  } else if (totalLeaves >= maxLeave - 1) {
    status = 'critically_low';
  } else {
    status = 'safe';
  }
  
  return {
    totalLeaves,
    informedLeaves,
    uninformedLeaves,
    exemptedLeaves,
    maxAllowed: maxLeave,
    remainingLeaves,
    status,
  };
}

/**
 * Get status color class for UI styling
 */
export function getLeaveStatusColor(status: LeaveUsageStats['status']): string {
  switch (status) {
    case 'safe':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'critically_low':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'poor':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get status icon for UI display
 */
export function getLeaveStatusIcon(status: LeaveUsageStats['status']): string {
  switch (status) {
    case 'safe':
      return '✅';
    case 'critically_low':
      return '⚠️';
    case 'poor':
      return '🚫';
    default:
      return '❓';
  }
}

/**
 * Get status label for UI display
 */
export function getLeaveStatusLabel(status: LeaveUsageStats['status']): string {
  switch (status) {
    case 'safe':
      return 'Safe';
    case 'critically_low':
      return 'Critically Low';
    case 'poor':
      return 'Poor Attendance';
    default:
      return 'Unknown';
  }
}

/**
 * Get detailed status message for tooltips
 */
export function getLeaveStatusMessage(stats: LeaveUsageStats): string {
  const { totalLeaves, maxAllowed, remainingLeaves, status } = stats;
  
  switch (status) {
    case 'safe':
      return `${totalLeaves}/${maxAllowed} leaves used. ${remainingLeaves} remaining.`;
    case 'critically_low':
      return `${totalLeaves}/${maxAllowed} leaves used. Only ${remainingLeaves} remaining!`;
    case 'poor':
      return `${totalLeaves}/${maxAllowed} leaves used. Exceeded limit by ${totalLeaves - maxAllowed}!`;
    default:
      return `${totalLeaves}/${maxAllowed} leaves used.`;
  }
}
