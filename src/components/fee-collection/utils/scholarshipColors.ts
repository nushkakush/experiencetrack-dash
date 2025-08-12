// Color scheme for scholarships (same as Step2Scholarships)
export const scholarshipColors = [
  {
    name: 'blue',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    selected: 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500',
    unselected: 'bg-background border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
  },
  {
    name: 'orange',
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-300',
    selected: 'bg-orange-600 dark:bg-orange-500 text-white border-orange-600 dark:border-orange-500',
    unselected: 'bg-background border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20'
  },
  {
    name: 'pink',
    border: 'border-pink-200 dark:border-pink-800',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    text: 'text-pink-700 dark:text-pink-300',
    selected: 'bg-pink-600 dark:bg-pink-500 text-white border-pink-600 dark:border-pink-500',
    unselected: 'bg-background border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/20'
  },
  {
    name: 'green',
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-300',
    selected: 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500',
    unselected: 'bg-background border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20'
  },
  {
    name: 'purple',
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-300',
    selected: 'bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500',
    unselected: 'bg-background border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20'
  }
];

// Get scholarship color scheme by index
export const getScholarshipColorScheme = (index: number) => {
  return scholarshipColors[index % scholarshipColors.length];
};
