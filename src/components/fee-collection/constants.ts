export const FEE_COLLECTION_CONSTANTS = {
  STEPS: [
    { id: 1, title: 'Fee Structure', description: 'Configure basic fee structure' },
    { id: 2, title: 'Scholarships', description: 'Set up scholarship tiers' },
    { id: 3, title: 'Review', description: 'Review and save configuration' }
  ],
  
  VALIDATION: {
    MIN_SEMESTERS: 1,
    MAX_SEMESTERS: 12,
    MIN_INSTALMENTS: 1,
    MAX_INSTALMENTS: 12,
    MIN_DISCOUNT: 0,
    MAX_DISCOUNT: 100,
    MIN_FEE: 0,
    MIN_PROGRAM_FEE: 1
  },
  
  DEFAULT_VALUES: {
    ADMISSION_FEE: 0,
    TOTAL_PROGRAM_FEE: 0,
    NUMBER_OF_SEMESTERS: 4,
    INSTALMENTS_PER_SEMESTER: 3,
    ONE_SHOT_DISCOUNT_PERCENTAGE: 0
  },
  
  MESSAGES: {
    LOADING: 'Loading existing data...',
    SAVING: 'Saving...',
    SAVE_SUCCESS: 'Fee structure setup completed successfully!',
    SAVE_ERROR: 'Failed to save fee structure. Please try again.',
    LOAD_ERROR: 'Failed to load existing fee structure',
    VALIDATION_ERROR: 'Please complete Step 1 with valid fee structure before proceeding'
  }
} as const;

export const INDIAN_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Central Bank of India'
] as const;

export const SCHOLARSHIP_COLORS = [
  {
    name: 'blue',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    description: 'text-blue-600 dark:text-blue-400',
    summary: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    summaryText: 'text-blue-800 dark:text-blue-200'
  },
  {
    name: 'orange',
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-300',
    description: 'text-orange-600 dark:text-orange-400',
    summary: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    summaryText: 'text-orange-800 dark:text-orange-200'
  },
  {
    name: 'pink',
    border: 'border-pink-200 dark:border-pink-800',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    text: 'text-pink-700 dark:text-pink-300',
    description: 'text-pink-600 dark:text-pink-400',
    summary: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800',
    summaryText: 'text-pink-800 dark:text-pink-200'
  },
  {
    name: 'green',
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-300',
    description: 'text-green-600 dark:text-green-400',
    summary: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    summaryText: 'text-green-800 dark:text-green-200'
  },
  {
    name: 'purple',
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-300',
    description: 'text-purple-600 dark:text-purple-400',
    summary: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    summaryText: 'text-purple-800 dark:text-purple-200'
  }
] as const;
