import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { 
  PaymentState, 
  PaymentSubmission, 
  PaymentBreakdown, 
  PaymentMethod 
} from '@/types/payments/PaymentStoreTypes';

// Using imported PaymentState interface from PaymentStoreTypes

const initialState = {
  selectedPaymentPlan: 'not_selected' as PaymentPlan,
  paymentSubmissions: new Map(),
  submittingPayments: new Set(),
  paymentBreakdown: null,
  expandedSemesters: new Set(),
  expandedInstallments: new Set(),
  paymentMethods: [],
  isLoading: false,
  error: null,
};

export const usePaymentStore = create<PaymentState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Payment plan actions
        setSelectedPaymentPlan: (plan: PaymentPlan) => {
          set({ selectedPaymentPlan: plan });
        },

        // Payment submission actions
        addPaymentSubmission: (paymentId: string, submission: PaymentSubmission) => {
          set((state) => {
            const newSubmissions = new Map(state.paymentSubmissions);
            newSubmissions.set(paymentId, submission);
            return { paymentSubmissions: newSubmissions };
          });
        },

        updatePaymentSubmission: (paymentId: string, updates: Partial<PaymentSubmission>) => {
          set((state) => {
            const newSubmissions = new Map(state.paymentSubmissions);
            const existing = newSubmissions.get(paymentId) || {};
            newSubmissions.set(paymentId, { ...existing, ...updates });
            return { paymentSubmissions: newSubmissions };
          });
        },

        removePaymentSubmission: (paymentId: string) => {
          set((state) => {
            const newSubmissions = new Map(state.paymentSubmissions);
            newSubmissions.delete(paymentId);
            return { paymentSubmissions: newSubmissions };
          });
        },

        setSubmittingPayment: (paymentId: string, isSubmitting: boolean) => {
          set((state) => {
            const newSubmitting = new Set(state.submittingPayments);
            if (isSubmitting) {
              newSubmitting.add(paymentId);
            } else {
              newSubmitting.delete(paymentId);
            }
            return { submittingPayments: newSubmitting };
          });
        },

        // Payment breakdown actions
        setPaymentBreakdown: (breakdown: PaymentBreakdown) => {
          set({ paymentBreakdown: breakdown });
        },

        // Expanded sections actions
        toggleSemester: (semesterNumber: number) => {
          set((state) => {
            const newExpanded = new Set(state.expandedSemesters);
            if (newExpanded.has(semesterNumber)) {
              newExpanded.delete(semesterNumber);
            } else {
              newExpanded.add(semesterNumber);
            }
            return { expandedSemesters: newExpanded };
          });
        },

        toggleInstallment: (installmentKey: string) => {
          set((state) => {
            const newExpanded = new Set(state.expandedInstallments);
            if (newExpanded.has(installmentKey)) {
              newExpanded.delete(installmentKey);
            } else {
              newExpanded.add(installmentKey);
            }
            return { expandedInstallments: newExpanded };
          });
        },

        // Payment methods actions
        setPaymentMethods: (methods: PaymentMethod[]) => {
          set({ paymentMethods: methods });
        },

        // Loading actions
        setIsLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Error actions
        setError: (error: string | null) => {
          set({ error });
        },

        // Reset actions
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'payment-store',
        partialize: (state) => ({
          selectedPaymentPlan: state.selectedPaymentPlan,
          expandedSemesters: Array.from(state.expandedSemesters),
          expandedInstallments: Array.from(state.expandedInstallments),
        }),
      }
    ),
    {
      name: 'payment-store',
    }
  )
);

// Selector hooks for better performance
export const useSelectedPaymentPlan = () => usePaymentStore((state) => state.selectedPaymentPlan);
export const usePaymentSubmissions = () => usePaymentStore((state) => state.paymentSubmissions);
export const useSubmittingPayments = () => usePaymentStore((state) => state.submittingPayments);
export const usePaymentBreakdown = () => usePaymentStore((state) => state.paymentBreakdown);
export const useExpandedSemesters = () => usePaymentStore((state) => state.expandedSemesters);
export const useExpandedInstallments = () => usePaymentStore((state) => state.expandedInstallments);
export const usePaymentMethods = () => usePaymentStore((state) => state.paymentMethods);
export const usePaymentLoading = () => usePaymentStore((state) => state.isLoading);
export const usePaymentError = () => usePaymentStore((state) => state.error);
