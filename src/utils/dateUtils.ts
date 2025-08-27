/**
 * Global date formatting utilities
 * Replaces duplicate formatDate functions across components
 */

export const formatDate = (
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return 'N/A';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Date(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  });
};

export const formatDateTime = (
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return 'N/A';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Date(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  });
};

export const formatShortDate = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeDate = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return 'N/A';

  const now = new Date();
  const date = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return `${Math.floor(diffDays / 365)} years ago`;
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
