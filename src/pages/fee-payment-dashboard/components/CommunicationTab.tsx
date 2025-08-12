import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';

interface CommunicationTabProps {
  students: StudentPaymentSummary[];
}

export const CommunicationTab: React.FC<CommunicationTabProps> = ({ students }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Communication</h2>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Send Manual Email</CardTitle>
          <CardDescription>
            Compose and send emails to specific students in this cohort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Students</label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {students.map((student) => (
                  <div key={student.student_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={student.student_id}
                      className="rounded"
                    />
                    <label htmlFor={student.student_id} className="text-sm">
                      {student.student?.first_name} {student.student?.last_name} ({student.student?.email})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                type="text"
                placeholder="Enter email subject..."
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                placeholder="Enter your email message..."
                rows={6}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Send Email</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
