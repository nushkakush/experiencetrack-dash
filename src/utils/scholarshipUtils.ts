import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

/**
 * Get scholarship percentage by scholarship ID
 */
export async function getScholarshipPercentage(scholarshipId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cohort_scholarships')
      .select('amount_percentage')
      .eq('id', scholarshipId)
      .single();

    if (error) {
      Logger.getInstance().error('Error fetching scholarship percentage', { error, scholarshipId });
      return 0;
    }

    return data?.amount_percentage || 0;
  } catch (error) {
    Logger.getInstance().error('Error in getScholarshipPercentage', { error, scholarshipId });
    return 0;
  }
}

/**
 * Get scholarship details by scholarship ID
 */
export async function getScholarshipDetails(scholarshipId: string) {
  try {
    const { data, error } = await supabase
      .from('cohort_scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();

    if (error) {
      Logger.getInstance().error('Error fetching scholarship details', { error, scholarshipId });
      return null;
    }

    return data;
  } catch (error) {
    Logger.getInstance().error('Error in getScholarshipDetails', { error, scholarshipId });
    return null;
  }
}

/**
 * Get scholarship percentage for display purposes
 * This function can be used in UI components to show scholarship percentage
 */
export async function getScholarshipPercentageForDisplay(scholarshipId: string | null | undefined): Promise<number> {
  if (!scholarshipId) return 0;
  return await getScholarshipPercentage(scholarshipId);
}

/**
 * Get additional discount percentage for a student's scholarship
 */
export async function getAdditionalDiscountPercentage(studentId: string, scholarshipId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('student_scholarships')
      .select('additional_discount_percentage')
      .eq('student_id', studentId)
      .eq('scholarship_id', scholarshipId)
      .single();

    if (error) {
      Logger.getInstance().error('Error fetching additional discount percentage', { error, studentId, scholarshipId });
      return 0;
    }

    return data?.additional_discount_percentage || 0;
  } catch (error) {
    Logger.getInstance().error('Error in getAdditionalDiscountPercentage', { error, studentId, scholarshipId });
    return 0;
  }
}

/**
 * Get total discount percentage (scholarship + additional discount) for a student
 */
export async function getTotalDiscountPercentage(studentId: string, scholarshipId: string): Promise<number> {
  try {
    const scholarshipPercentage = await getScholarshipPercentage(scholarshipId);
    const additionalDiscountPercentage = await getAdditionalDiscountPercentage(studentId, scholarshipId);
    
    return scholarshipPercentage + additionalDiscountPercentage;
  } catch (error) {
    Logger.getInstance().error('Error in getTotalDiscountPercentage', { error, studentId, scholarshipId });
    return 0;
  }
}

/**
 * Get comprehensive scholarship information for a student
 * Returns scholarship name, base percentage, additional discount, and total percentage
 */
export async function getComprehensiveScholarshipInfo(studentId: string): Promise<{
  scholarshipName: string;
  basePercentage: number;
  additionalDiscount: number;
  totalPercentage: number;
  scholarshipId: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('student_scholarships')
      .select(`
        scholarship_id,
        additional_discount_percentage,
        cohort_scholarships (
          name,
          amount_percentage
        )
      `)
      .eq('student_id', studentId)
      .single();

    if (error) {
      Logger.getInstance().error('Error fetching comprehensive scholarship info', { error, studentId });
      return null;
    }

    if (!data) return null;

    const basePercentage = data.cohort_scholarships?.amount_percentage || 0;
    const additionalDiscount = data.additional_discount_percentage || 0;
    const totalPercentage = basePercentage + additionalDiscount;

    return {
      scholarshipName: data.cohort_scholarships?.name || 'Unknown Scholarship',
      basePercentage,
      additionalDiscount,
      totalPercentage,
      scholarshipId: data.scholarship_id
    };
  } catch (error) {
    Logger.getInstance().error('Error in getComprehensiveScholarshipInfo', { error, studentId });
    return null;
  }
}

/**
 * Calculate total scholarship amount for a student
 * Takes into account both base scholarship and additional discount
 */
export async function calculateTotalScholarshipAmount(studentId: string, totalProgramFee: number): Promise<{
  baseScholarshipAmount: number;
  additionalDiscountAmount: number;
  totalScholarshipAmount: number;
  basePercentage: number;
  additionalPercentage: number;
  totalPercentage: number;
}> {
  try {
    const scholarshipInfo = await getComprehensiveScholarshipInfo(studentId);
    
    if (!scholarshipInfo) {
      return {
        baseScholarshipAmount: 0,
        additionalDiscountAmount: 0,
        totalScholarshipAmount: 0,
        basePercentage: 0,
        additionalPercentage: 0,
        totalPercentage: 0
      };
    }

    const baseScholarshipAmount = (totalProgramFee * scholarshipInfo.basePercentage) / 100;
    const additionalDiscountAmount = (totalProgramFee * scholarshipInfo.additionalDiscount) / 100;
    const totalScholarshipAmount = baseScholarshipAmount + additionalDiscountAmount;

    return {
      baseScholarshipAmount,
      additionalDiscountAmount,
      totalScholarshipAmount,
      basePercentage: scholarshipInfo.basePercentage,
      additionalPercentage: scholarshipInfo.additionalDiscount,
      totalPercentage: scholarshipInfo.totalPercentage
    };
  } catch (error) {
    Logger.getInstance().error('Error in calculateTotalScholarshipAmount', { error, studentId, totalProgramFee });
    return {
      baseScholarshipAmount: 0,
      additionalDiscountAmount: 0,
      totalScholarshipAmount: 0,
      basePercentage: 0,
      additionalPercentage: 0,
      totalPercentage: 0
    };
  }
}

/**
 * Test function to verify scholarship calculation
 * This can be used for debugging and testing purposes
 */
export async function testScholarshipCalculation(studentId: string, totalProgramFee: number) {
  try {
    console.log('Testing scholarship calculation for student:', studentId);
    console.log('Total program fee:', totalProgramFee);
    
    const scholarshipInfo = await getComprehensiveScholarshipInfo(studentId);
    console.log('Scholarship info:', scholarshipInfo);
    
    if (!scholarshipInfo) {
      console.log('No scholarship found for student');
      return null;
    }
    
    const calculation = await calculateTotalScholarshipAmount(studentId, totalProgramFee);
    console.log('Scholarship calculation:', calculation);
    
    return calculation;
  } catch (error) {
    console.error('Error in testScholarshipCalculation:', error);
    return null;
  }
}

/**
 * Simple test function to verify scholarship calculation
 * This can be called from the browser console for testing
 */
export async function testCurrentStudentScholarship() {
  try {
    const studentId = '7cb13051-a260-4ac3-987d-7afeda51f00e';
    const totalProgramFee = 1010000;
    
    console.log('🧪 Testing scholarship calculation for current student...');
    console.log('Student ID:', studentId);
    console.log('Total Program Fee:', totalProgramFee);
    
    const scholarshipInfo = await getComprehensiveScholarshipInfo(studentId);
    console.log('📋 Scholarship Info:', scholarshipInfo);
    
    if (!scholarshipInfo) {
      console.log('❌ No scholarship found for student');
      return null;
    }
    
    const calculation = await calculateTotalScholarshipAmount(studentId, totalProgramFee);
    console.log('💰 Scholarship Calculation:', calculation);
    
    // Expected values
    const expected = {
      baseScholarshipAmount: 101000,
      additionalDiscountAmount: 101000,
      totalScholarshipAmount: 202000,
      basePercentage: 10,
      additionalPercentage: 10,
      totalPercentage: 20
    };
    
    console.log('✅ Expected values:', expected);
    console.log('🎯 Test passed:', JSON.stringify(calculation) === JSON.stringify(expected));
    
    return calculation;
  } catch (error) {
    console.error('❌ Error in testCurrentStudentScholarship:', error);
    return null;
  }
}
