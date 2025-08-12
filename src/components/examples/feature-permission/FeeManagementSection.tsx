import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Eye, XCircle } from 'lucide-react';
import { FeeFeatureGate } from '@/components/common';

export const FeeManagementSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Fee Management
        </CardTitle>
        <CardDescription>
          Examples of fee-related feature gates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <FeeFeatureGate action="view">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Fees
            </Button>
          </FeeFeatureGate>
          
          <FeeFeatureGate action="collect">
            <Button variant="outline" size="sm" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Collect Fees
            </Button>
          </FeeFeatureGate>
          
          <FeeFeatureGate action="waive">
            <Button variant="outline" size="sm" className="gap-2">
              <XCircle className="h-4 w-4" />
              Waive Fees
            </Button>
          </FeeFeatureGate>
          
          <FeeFeatureGate action="reports">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Reports
            </Button>
          </FeeFeatureGate>
        </div>
      </CardContent>
    </Card>
  );
};
