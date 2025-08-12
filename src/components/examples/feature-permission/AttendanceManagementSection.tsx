import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, CheckCircle, Edit } from 'lucide-react';
import { AttendanceFeatureGate } from '@/components/common';

export const AttendanceManagementSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance Management
        </CardTitle>
        <CardDescription>
          Examples of attendance-related feature gates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <AttendanceFeatureGate action="view">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Attendance
            </Button>
          </AttendanceFeatureGate>
          
          <AttendanceFeatureGate action="mark">
            <Button variant="outline" size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Attendance
            </Button>
          </AttendanceFeatureGate>
          
          <AttendanceFeatureGate action="edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Attendance
            </Button>
          </AttendanceFeatureGate>
          
          <AttendanceFeatureGate action="export">
            <Button variant="outline" size="sm" className="gap-2">
              Download
              Export Data
            </Button>
          </AttendanceFeatureGate>
        </div>
      </CardContent>
    </Card>
  );
};
