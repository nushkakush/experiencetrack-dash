import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const BorrowingHistorySkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowing Records</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Borrowed Date</TableHead>
              <TableHead>Expected Return</TableHead>
              <TableHead>Issue Condition</TableHead>
              <TableHead>Return Condition</TableHead>
              <TableHead>Actual Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-3 w-16' />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-16 rounded-full' />
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Skeleton className='h-8 w-16' />
                    <Skeleton className='h-8 w-8' />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
