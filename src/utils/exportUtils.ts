import { logger } from '@/lib/logging';
import { StudentPaymentSummary } from '@/types/payments/DatabaseAlignedTypes';
import { UserProfile } from '@/types/userManagement';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeHeaders?: boolean;
  filename?: string;
}

export const exportPaymentData = (
  students: StudentPaymentSummary[],
  options: ExportOptions = { format: 'csv', includeHeaders: true }
) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `payment_data_${timestamp}`;
    const filename = options.filename || defaultFilename;

    switch (options.format) {
      case 'csv':
        return exportToCSV(students, filename);
      case 'json':
        return exportToJSON(students, filename);
      case 'excel':
        return exportToExcel(students, filename);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    logger.error('Export failed', {
      error,
      students: students.length,
    });
    throw error;
  }
};

const exportToCSV = (students: StudentPaymentSummary[], filename: string) => {
  // CSV Headers
  const headers = [
    'Student ID',
    'First Name',
    'Last Name',
    'Email',
    'Payment Plan',
    'Total Amount',
    'Paid Amount',
    'Pending Amount',
    'Progress (%)',
    'Status',
    'Scholarship',
    'Last Payment Date',
    'Next Due Date',
    'Created At',
    'Updated At',
  ];

  // CSV Rows
  const rows = students.map(student => {
    const progress =
      student.total_amount > 0
        ? Math.round((student.paid_amount / student.total_amount) * 100)
        : 0;

    const status = getPaymentStatus(student);
    const lastPaymentDate = getLastPaymentDate(student);
    const nextDueDate = getNextDueDate(student);

    return [
      student.student_id,
      student.student?.first_name || '',
      student.student?.last_name || '',
      student.student?.email || '',
      student.payment_plan || 'not_selected',
      formatCurrency(student.total_amount),
      formatCurrency(student.paid_amount),
      formatCurrency(student.pending_amount),
      progress.toString(),
      status,
      student.scholarship_name || 'None',
      lastPaymentDate,
      nextDueDate,
      formatDate(student.student?.created_at),
      formatDate(student.student?.updated_at),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

const exportToJSON = (students: StudentPaymentSummary[], filename: string) => {
  const exportData = students.map(student => ({
    student_id: student.student_id,
    first_name: student.student?.first_name || '',
    last_name: student.student?.last_name || '',
    email: student.student?.email || '',
    payment_plan: student.payment_plan || 'not_selected',
    total_amount: student.total_amount,
    paid_amount: student.paid_amount,
    pending_amount: student.pending_amount,
    progress_percentage:
      student.total_amount > 0
        ? Math.round((student.paid_amount / student.total_amount) * 100)
        : 0,
    status: getPaymentStatus(student),
    scholarship: student.scholarship_name || 'None',
    last_payment_date: getLastPaymentDate(student),
    next_due_date: getNextDueDate(student),
    created_at: student.student?.created_at,
    updated_at: student.student?.updated_at,
    payments: student.payments || [],
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

const exportToExcel = (students: StudentPaymentSummary[], filename: string) => {
  // For Excel export, we'll create a CSV with Excel-compatible formatting
  // In a real implementation, you might want to use a library like xlsx
  exportToCSV(students, filename.replace('.xlsx', ''));
};

export const exportUserData = (
  users: UserProfile[],
  options: ExportOptions = { format: 'csv', includeHeaders: true }
) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `user_data_${timestamp}`;
    const filename = options.filename || defaultFilename;

    switch (options.format) {
      case 'csv':
        return exportUsersToCSV(users, filename);
      case 'json':
        return exportUsersToJSON(users, filename);
      case 'excel':
        return exportUsersToExcel(users, filename);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    logger.error('User export failed', {
      error,
      users: users.length,
    });
    throw error;
  }
};

const exportUsersToCSV = (users: UserProfile[], filename: string) => {
  // CSV Headers
  const headers = [
    'User ID',
    'First Name',
    'Last Name',
    'Email',
    'Role',
    'Status',
    'Last Login',
    'Login Count',
    'Created At',
    'Updated At',
    'Invitation Token',
    'Invitation Expires At',
    'Invite Status',
    'Invited At',
    'Invited By',
  ];

  // CSV Rows
  const rows = users.map(user => [
    user.id,
    user.first_name || '',
    user.last_name || '',
    user.email || '',
    user.role,
    user.status,
    user.last_login || '',
    user.login_count.toString(),
    formatDate(user.created_at),
    formatDate(user.updated_at),
    user.invitation_token || '',
    user.invitation_expires_at || '',
    user.invite_status || '',
    user.invited_at || '',
    user.invited_by || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

const exportUsersToJSON = (users: UserProfile[], filename: string) => {
  const exportData = users.map(user => ({
    id: user.id,
    user_id: user.user_id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    role: user.role,
    status: user.status,
    last_login: user.last_login,
    login_count: user.login_count,
    created_at: user.created_at,
    updated_at: user.updated_at,
    invitation_token: user.invitation_token,
    invitation_expires_at: user.invitation_expires_at,
    invite_status: user.invite_status,
    invited_at: user.invited_at,
    invited_by: user.invited_by,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

const exportUsersToExcel = (users: UserProfile[], filename: string) => {
  // For Excel export, we'll create a CSV with Excel-compatible formatting
  // In a real implementation, you might want to use a library like xlsx
  exportUsersToCSV(users, filename.replace('.xlsx', ''));
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const getPaymentStatus = (student: StudentPaymentSummary): string => {
  if (!student.payments || student.payments.length === 0) {
    return 'Payment Setup Required';
  }

  const totalPayments = student.payments.length;
  const completedPayments = student.payments.filter(
          p => p.status === 'paid' || p.status === 'waived'
  ).length;
  const pendingPayments = student.payments.filter(
    p => p.status === 'pending'
  ).length;

  if (completedPayments === totalPayments) {
    return 'All Payments Complete';
  } else if (completedPayments > 0) {
    return `${completedPayments}/${totalPayments} Paid`;
  } else {
    return `${pendingPayments} Pending`;
  }
};

const getLastPaymentDate = (student: StudentPaymentSummary): string => {
  if (!student.payments || student.payments.length === 0) {
    return 'N/A';
  }

          const paidPayments = student.payments.filter(p => p.status === 'paid' || p.status === 'waived');
  if (paidPayments.length === 0) {
    return 'N/A';
  }

  const lastPayment = paidPayments.reduce((latest, current) => {
    const latestDate = new Date(latest.payment_date || latest.created_at);
    const currentDate = new Date(current.payment_date || current.created_at);
    return currentDate > latestDate ? current : latest;
  });

  return new Date(
    lastPayment.payment_date || lastPayment.created_at
  ).toLocaleDateString('en-IN');
};

const getNextDueDate = (student: StudentPaymentSummary): string => {
  if (!student.payments || student.payments.length === 0) {
    return 'N/A';
  }

  const pendingPayments = student.payments.filter(p => p.status === 'pending');
  if (pendingPayments.length === 0) {
    return 'All Paid';
  }

  const nextPayment = pendingPayments.reduce((earliest, current) => {
    const earliestDate = new Date(earliest.due_date || earliest.created_at);
    const currentDate = new Date(current.due_date || current.created_at);
    return currentDate < earliestDate ? current : earliest;
  });

  return new Date(
    nextPayment.due_date || nextPayment.created_at
  ).toLocaleDateString('en-IN');
};
