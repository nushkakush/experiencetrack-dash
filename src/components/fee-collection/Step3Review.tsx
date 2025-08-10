import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentPlan, FeeStructure, Scholarship, FeeStructureReview } from '@/types/fee';
import { generateFeeStructureReview, calculateGST, extractGSTFromTotal, extractBaseAmountFromTotal } from '@/utils/feeCalculations';
import { format } from 'date-fns';

interface Step3ReviewProps {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];
  cohortStartDate: string;
}

export default function Step3Review({ feeStructure, scholarships, cohortStartDate }: Step3ReviewProps) {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>('one_shot');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('no_scholarship');
  const [editablePaymentDates, setEditablePaymentDates] = useState<Record<string, string>>({});

  // Generate fee structure review based on current selections
  const feeReview = React.useMemo(() => {
    try {
      return generateFeeStructureReview(
        feeStructure,
        scholarships,
        selectedPaymentPlan,
        85, // Default test score for preview
        cohortStartDate,
        selectedScholarshipId === 'no_scholarship' ? undefined : selectedScholarshipId
      );
    } catch (error) {
      console.error('Error generating fee review:', error);
      // Return a default structure to prevent crashes
      return {
        admissionFee: {
          baseAmount: extractBaseAmountFromTotal(feeStructure.admission_fee),
          scholarshipAmount: 0,
          discountAmount: 0,
          gstAmount: extractGSTFromTotal(feeStructure.admission_fee),
          totalPayable: feeStructure.admission_fee
        },
        semesters: [],
        overallSummary: {
          totalProgramFee: feeStructure.total_program_fee - feeStructure.admission_fee,
          admissionFee: feeStructure.admission_fee,
          totalGST: calculateGST(feeStructure.total_program_fee - feeStructure.admission_fee) + extractGSTFromTotal(feeStructure.admission_fee),
          totalDiscount: 0,
          totalAmountPayable: feeStructure.total_program_fee + calculateGST(feeStructure.total_program_fee - feeStructure.admission_fee) + extractGSTFromTotal(feeStructure.admission_fee)
        }
      };
    }
  }, [feeStructure, scholarships, selectedPaymentPlan, selectedScholarshipId, cohortStartDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderAdmissionFeeSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">Admission Fee</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Base Amount:</span>
            <span>{formatCurrency(feeReview.admissionFee.baseAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (18%):</span>
            <span>{formatCurrency(feeReview.admissionFee.gstAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total Amount Payable:</span>
            <span>{formatCurrency(feeReview.admissionFee.totalPayable)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSemesterSection = (semester: any) => (
    <Card key={semester.semesterNumber}>
      <CardHeader>
        <CardTitle className="text-blue-600">Semester {String(semester.semesterNumber).padStart(2, '0')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{selectedPaymentPlan === 'sem_wise' ? 'Payment Date' : 'Instalment Date'}</TableHead>
              <TableHead>Scholarship Amt. (₹)</TableHead>
              <TableHead>Base Amt. (₹)</TableHead>
              <TableHead>GST (18%)</TableHead>
              <TableHead>Amt. Payable (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semester.instalments.map((instalment: any, index: number) => {
              const dateKey = `semester-${semester.semesterNumber}-instalment-${index}`;
              const currentDate = editablePaymentDates[dateKey] || instalment.paymentDate;
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="date"
                      value={currentDate}
                      onChange={(e) => setEditablePaymentDates(prev => ({
                        ...prev,
                        [dateKey]: e.target.value
                      }))}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(instalment.scholarshipAmount)}</TableCell>
                  <TableCell>{formatCurrency(instalment.baseAmount)}</TableCell>
                  <TableCell>{formatCurrency(instalment.gstAmount)}</TableCell>
                  <TableCell>{formatCurrency(instalment.amountPayable)}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell>{formatCurrency(semester.total.scholarshipAmount)}</TableCell>
              <TableCell>{formatCurrency(semester.total.baseAmount)}</TableCell>
              <TableCell>{formatCurrency(semester.total.gstAmount)}</TableCell>
              <TableCell>{formatCurrency(semester.total.totalPayable)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderOneShotPaymentSection = () => {
    const selectedScholarship = selectedScholarshipId === 'no_scholarship' 
      ? null 
      : scholarships.find(s => s.id === selectedScholarshipId);
    
    const scholarshipAmount = selectedScholarship 
      ? (feeStructure.total_program_fee * selectedScholarship.amount_percentage) / 100
      : 0;
    
    // Calculate according to the correct formula
    // Extract base amount from admission fee (since it already includes GST)
    const admissionFeeBase = extractBaseAmountFromTotal(feeStructure.admission_fee);
    const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);
    
    // Program fee (excluding admission fee)
    const programFeeOnly = feeStructure.total_program_fee - feeStructure.admission_fee;
    
    // Calculate program fee GST
    const programFeeGST = calculateGST(programFeeOnly);
    
    // Total base amount and GST
    const baseAmount = programFeeOnly + admissionFeeBase;
    const gstAmount = programFeeGST + admissionFeeGST;
    const totalWithGST = baseAmount + gstAmount;
    const discountAmount = (totalWithGST * feeStructure.one_shot_discount_percentage) / 100;
    const finalAmount = totalWithGST - discountAmount - scholarshipAmount;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">One Shot Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Base Amt. (₹)</TableHead>
                <TableHead>Scholarship Amt. (₹)</TableHead>
                <TableHead>Discount (₹)</TableHead>
                <TableHead>GST (18%)</TableHead>
                <TableHead>Amt. Payable (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Input
                    type="date"
                    value={editablePaymentDates['one-shot'] || cohortStartDate}
                    onChange={(e) => setEditablePaymentDates(prev => ({
                      ...prev,
                      'one-shot': e.target.value
                    }))}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>{formatCurrency(baseAmount)}</TableCell>
                <TableCell>{formatCurrency(scholarshipAmount)}</TableCell>
                <TableCell>{formatCurrency(discountAmount)}</TableCell>
                <TableCell>{formatCurrency(gstAmount)}</TableCell>
                <TableCell>{formatCurrency(finalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderOverallSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-600">Overall Fee Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Program Fee:</span>
            <span>{formatCurrency(feeReview.overallSummary.totalProgramFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Admission Fee:</span>
            <span>{formatCurrency(feeReview.overallSummary.admissionFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total GST:</span>
            <span>{formatCurrency(feeReview.overallSummary.totalGST)}</span>
          </div>
          {selectedPaymentPlan === 'one_shot' && feeStructure.one_shot_discount_percentage > 0 && (
            <div className="flex justify-between text-red-600">
              <span>One Shot Discount ({feeStructure.one_shot_discount_percentage}%):</span>
              <span>- {formatCurrency(feeReview.overallSummary.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total Amount Payable:</span>
            <span>{formatCurrency(feeReview.overallSummary.totalAmountPayable)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 3: Review Fee Structure</h2>
        <p className="text-muted-foreground">
          Review the fee structure across different payment plans and scholarship options
        </p>
      </div>

      {/* Payment Plan Tabs */}
      <Tabs value={selectedPaymentPlan} onValueChange={(value) => setSelectedPaymentPlan(value as PaymentPlan)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="one_shot">One Shot Payment</TabsTrigger>
          <TabsTrigger value="sem_wise">Sem Wise Payment</TabsTrigger>
          <TabsTrigger value="instalment_wise">Instalment wise Payment</TabsTrigger>
        </TabsList>

        {/* Scholarship Selection */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Select Scholarship:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedScholarshipId === 'no_scholarship' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScholarshipId('no_scholarship')}
              className={selectedScholarshipId === 'no_scholarship' ? 'bg-black text-white hover:bg-black/90' : 'bg-transparent border border-gray-300 hover:bg-gray-50'}
            >
              No Scholarship
            </Button>
            {scholarships.map((scholarship) => (
              <Button
                key={scholarship.id}
                variant={selectedScholarshipId === scholarship.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScholarshipId(scholarship.id)}
                className={selectedScholarshipId === scholarship.id ? 'bg-black text-white hover:bg-black/90' : 'bg-transparent border border-gray-300 hover:bg-gray-50'}
              >
                {scholarship.name} ({scholarship.amount_percentage}%)
              </Button>
            ))}
          </div>
        </div>

        {/* Content based on payment plan */}
        <TabsContent value="one_shot" className="space-y-6">
          {renderAdmissionFeeSection()}
          {renderOneShotPaymentSection()}
          {renderOverallSummary()}
        </TabsContent>

        <TabsContent value="sem_wise" className="space-y-6">
          {renderAdmissionFeeSection()}
          {feeReview.semesters.map((semester) => renderSemesterSection(semester))}
          {renderOverallSummary()}
        </TabsContent>

        <TabsContent value="instalment_wise" className="space-y-6">
          {renderAdmissionFeeSection()}
          {feeReview.semesters.map((semester) => renderSemesterSection(semester))}
          {renderOverallSummary()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
