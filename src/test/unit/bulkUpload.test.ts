import { BulkScholarshipUploadService } from '@/services/bulkUpload/bulkScholarshipUpload.service';
import { BulkPaymentPlanUploadService } from '@/services/bulkUpload/bulkPaymentPlanUpload.service';

describe('Bulk Scholarship Upload Service', () => {
  describe('validateScholarshipRow', () => {
    it('should validate a correct scholarship row', () => {
      const validRow = {
        student_email: 'john.doe@example.com',
        scholarship_name: 'Merit Scholarship',
        additional_discount_percentage: '5'
      };

      const errors = BulkScholarshipUploadService.validateScholarshipRow(validRow, 1);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid email', () => {
      const invalidRow = {
        student_email: 'invalid-email',
        scholarship_name: 'Merit Scholarship'
      };

      const errors = BulkScholarshipUploadService.validateScholarshipRow(invalidRow, 1);
      expect(errors).toContain('Invalid email format');
    });

    it('should return errors for missing required fields', () => {
      const invalidRow = {
        student_email: 'john.doe@example.com'
        // missing scholarship_name
      };

      const errors = BulkScholarshipUploadService.validateScholarshipRow(invalidRow, 1);
      expect(errors).toContain('Scholarship name is required and must be a string');
    });

    it('should return errors for invalid discount percentage', () => {
      const invalidRow = {
        student_email: 'john.doe@example.com',
        scholarship_name: 'Merit Scholarship',
        additional_discount_percentage: '150' // > 100
      };

      const errors = BulkScholarshipUploadService.validateScholarshipRow(invalidRow, 1);
      expect(errors).toContain('Additional discount percentage must be between 0 and 100');
    });
  });

  describe('generateTemplateData', () => {
    it('should generate valid CSV template', () => {
      const template = BulkScholarshipUploadService.generateTemplateData();
      
      expect(template).toContain('student_email,scholarship_name,additional_discount_percentage,description');
      expect(template).toContain('john.doe@example.com,Merit Scholarship,5,High academic performance');
      expect(template).toContain('jane.smith@example.com,Need-based Scholarship,10,Financial need');
    });
  });
});

describe('Bulk Payment Plan Upload Service', () => {
  describe('validatePaymentPlanRow', () => {
    it('should validate a correct payment plan row', () => {
      const validRow = {
        student_email: 'john.doe@example.com',
        payment_plan: 'one_shot',
        scholarship_name: 'Merit Scholarship',
        additional_discount_percentage: '5'
      };

      const errors = BulkPaymentPlanUploadService.validatePaymentPlanRow(validRow, 1);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid payment plan', () => {
      const invalidRow = {
        student_email: 'john.doe@example.com',
        payment_plan: 'invalid_plan'
      };

      const errors = BulkPaymentPlanUploadService.validatePaymentPlanRow(invalidRow, 1);
      expect(errors).toContain('Payment plan must be one of: one_shot, sem_wise, instalment_wise, not_selected');
    });

    it('should validate custom dates JSON format', () => {
      const validRow = {
        student_email: 'john.doe@example.com',
        payment_plan: 'sem_wise',
        custom_dates: '{"semester_1_start":"2024-01-15"}'
      };

      const errors = BulkPaymentPlanUploadService.validatePaymentPlanRow(validRow, 1);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid custom dates JSON', () => {
      const invalidRow = {
        student_email: 'john.doe@example.com',
        payment_plan: 'sem_wise',
        custom_dates: 'invalid json'
      };

      const errors = BulkPaymentPlanUploadService.validatePaymentPlanRow(invalidRow, 1);
      expect(errors).toContain('Custom dates must be a valid JSON format');
    });
  });

  describe('generateTemplateData', () => {
    it('should generate valid CSV template', () => {
      const template = BulkPaymentPlanUploadService.generateTemplateData();
      
      expect(template).toContain('student_email,payment_plan,scholarship_name,additional_discount_percentage,custom_dates');
      expect(template).toContain('john.doe@example.com,one_shot,Merit Scholarship,5,');
      expect(template).toContain('jane.smith@example.com,sem_wise,Need-based Scholarship,10,');
    });
  });
});

// Mock data for testing
export const mockScholarshipData = [
  {
    student_email: 'john.doe@example.com',
    scholarship_name: 'Merit Scholarship',
    additional_discount_percentage: '5',
    description: 'High academic performance'
  },
  {
    student_email: 'jane.smith@example.com',
    scholarship_name: 'Need-based Scholarship',
    additional_discount_percentage: '10',
    description: 'Financial need'
  }
];

export const mockPaymentPlanData = [
  {
    student_email: 'john.doe@example.com',
    payment_plan: 'one_shot',
    scholarship_name: 'Merit Scholarship',
    additional_discount_percentage: '5',
    custom_dates: ''
  },
  {
    student_email: 'jane.smith@example.com',
    payment_plan: 'sem_wise',
    scholarship_name: 'Need-based Scholarship',
    additional_discount_percentage: '10',
    custom_dates: '{"semester_1_start":"2024-01-15"}'
  }
];
