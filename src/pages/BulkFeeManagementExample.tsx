import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BulkFeeManagementDialog, 
  BulkScholarshipUploadDialog, 
  BulkPaymentPlanUploadDialog 
} from '@/components/common/bulk-upload';
import { Award, CreditCard, Settings, Download, FileText } from 'lucide-react';

export default function BulkFeeManagementExample() {
  const [exampleCohortId] = useState('example-cohort-123');
  const [lastOperation, setLastOperation] = useState<string>('');

  const handleSuccess = (operation: string) => {
    setLastOperation(operation);
    // In a real app, you would refresh the data here
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Bulk Fee Management</h1>
        <p className="text-xl text-muted-foreground">
          Manage scholarships and payment plans for hundreds of students efficiently
        </p>
      </div>

      {/* Combined Bulk Fee Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Combined Bulk Fee Management
          </CardTitle>
          <CardDescription>
            Use the combined interface to manage both scholarships and payment plans with advanced customization options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BulkFeeManagementDialog
            cohortId={exampleCohortId}
            onSuccess={() => handleSuccess('Combined bulk fee management')}
          >
            <Button size="lg" className="gap-2">
              <Settings className="w-5 h-5" />
              Open Combined Interface
            </Button>
          </BulkFeeManagementDialog>
          
          <div className="text-sm text-muted-foreground">
            <strong>Features:</strong>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Tabbed interface for scholarships and payment plans</li>
              <li>Customization options for advanced features</li>
              <li>Comprehensive validation and error handling</li>
              <li>Duplicate detection and handling</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Individual Scholarship Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              Bulk Scholarship Upload
            </CardTitle>
            <CardDescription>
              Assign scholarships to multiple students using a CSV file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BulkScholarshipUploadDialog
              cohortId={exampleCohortId}
              onSuccess={() => handleSuccess('Bulk scholarship upload')}
            >
              <Button variant="outline" className="w-full gap-2">
                <Award className="w-4 h-4" />
                Upload Scholarship CSV
              </Button>
            </BulkScholarshipUploadDialog>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">CSV Format:</span>
              </div>
              <div className="text-xs bg-muted p-2 rounded">
                student_email,scholarship_name,additional_discount_percentage,description<br/>
                john.doe@example.com,Merit Scholarship,5,High academic performance<br/>
                jane.smith@example.com,Need-based Scholarship,10,Financial need
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Payment Plan Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Bulk Payment Plan Upload
            </CardTitle>
            <CardDescription>
              Assign payment plans to multiple students with optional custom dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BulkPaymentPlanUploadDialog
              cohortId={exampleCohortId}
              onSuccess={() => handleSuccess('Bulk payment plan upload')}
              enableCustomDates={true}
            >
              <Button variant="outline" className="w-full gap-2">
                <CreditCard className="w-4 h-4" />
                Upload Payment Plan CSV
              </Button>
            </BulkPaymentPlanUploadDialog>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">CSV Format:</span>
              </div>
              <div className="text-xs bg-muted p-2 rounded">
                student_email,payment_plan,scholarship_name,additional_discount_percentage,custom_dates<br/>
                john.doe@example.com,one_shot,Merit Scholarship,5,<br/>
                jane.smith@example.com,sem_wise,Need-based Scholarship,10,<br/>
                bob.wilson@example.com,instalment_wise,,0,{`{"semester_1_start":"2024-01-15"}`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            Everything you need to manage fees for large cohorts efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <Download className="w-3 h-3" />
                Template Download
              </Badge>
              <p className="text-sm text-muted-foreground">
                Download pre-filled CSV templates with correct headers and example data.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <FileText className="w-3 h-3" />
                Validation
              </Badge>
              <p className="text-sm text-muted-foreground">
                Comprehensive validation for email formats, scholarship names, and payment plan values.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <Settings className="w-3 h-3" />
                Customization
              </Badge>
              <p className="text-sm text-muted-foreground">
                Support for custom payment dates and need based scholarship percentages.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <Award className="w-3 h-3" />
                Duplicate Handling
              </Badge>
              <p className="text-sm text-muted-foreground">
                Detect and handle duplicate assignments with ignore or overwrite options.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <CreditCard className="w-3 h-3" />
                Error Reporting
              </Badge>
              <p className="text-sm text-muted-foreground">
                Detailed error reporting with row numbers and specific validation messages.
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1">
                <Settings className="w-3 h-3" />
                Batch Processing
              </Badge>
              <p className="text-sm text-muted-foreground">
                Process hundreds of records efficiently with progress tracking and rollback support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Operation Status */}
      {lastOperation && (
        <Card>
          <CardHeader>
            <CardTitle>Last Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                Success
              </Badge>
              <span className="text-sm">{lastOperation} completed successfully</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Prepare Your CSV File</h4>
            <p className="text-sm text-muted-foreground">
              Download the template and fill in your data. Ensure all required columns are present and data is properly formatted.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Upload and Validate</h4>
            <p className="text-sm text-muted-foreground">
              Upload your CSV file. The system will validate each row and show you any errors or duplicates found.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Review and Confirm</h4>
            <p className="text-sm text-muted-foreground">
              Review the validation results, handle any duplicates, and confirm the import when ready.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Monitor Progress</h4>
            <p className="text-sm text-muted-foreground">
              The system will process your data and show you the results, including any errors that occurred.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
