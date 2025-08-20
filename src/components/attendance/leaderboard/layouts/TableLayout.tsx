import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatisticsCalculator } from '../utils/statisticsCalculator';
import { RankingUtils } from '../utils/rankingUtils';
import type { StudentStats } from '../utils/statisticsCalculator';
import type { AttendanceRecord } from '@/types/attendance';

interface TableLayoutProps {
  studentStats: StudentStats[];
  attendanceRecords: AttendanceRecord[];
  hideFields: ('email' | 'late' | 'absent')[];
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  studentStats,
  attendanceRecords,
  hideFields,
}) => {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-16'>Rank</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className='text-center'>Attendance %</TableHead>
            <TableHead className='text-center'>Attended/Total</TableHead>
            <TableHead className='text-center'>Absent Days</TableHead>
            <TableHead className='text-center'>Current Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentStats.map(stat => {
            const sessionBreakdown = StatisticsCalculator.getSessionBreakdown(
              stat.student.id,
              attendanceRecords
            );

            return (
              <TableRow
                key={stat.student.id}
                className={stat.rank <= 3 ? 'bg-gray-50 dark:bg-gray-700' : ''}
              >
                <TableCell>{RankingUtils.getRankBadge(stat.rank)}</TableCell>
                <TableCell className='font-medium'>
                  <div>
                    <div>
                      {stat.student.first_name} {stat.student.last_name}
                    </div>
                    {!hideFields.includes('email') && (
                      <div className='text-sm text-muted-foreground'>
                        {stat.student.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className='text-center'>
                  <span
                    className={StatisticsCalculator.getAttendanceColor(
                      stat.attendancePercentage
                    )}
                  >
                    {stat.attendancePercentage.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className='text-center'>
                  <div className='font-medium'>
                    {stat.presentSessions}/{stat.totalSessions}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    P:{sessionBreakdown.present} L:{sessionBreakdown.late} A:
                    {sessionBreakdown.absent}
                  </div>
                </TableCell>
                <TableCell className='text-center'>
                  <span
                    className={
                      stat.absentDays > 0
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                    }
                  >
                    {stat.absentDays}
                  </span>
                </TableCell>
                <TableCell className='text-center'>
                  {RankingUtils.getStreakBadge(stat.currentStreak)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
