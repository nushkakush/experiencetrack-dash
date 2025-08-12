export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-IN', options || defaultOptions);
};

export const formatLongDate = (date: string | Date) => {
  return formatDate(date, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};
