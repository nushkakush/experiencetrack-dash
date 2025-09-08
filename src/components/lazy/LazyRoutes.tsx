import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load major dashboard components
export const LazyCohortAttendanceDashboard = lazy(
  () => import('@/pages/dashboards/CohortAttendanceDashboard')
);

export const LazyCohortApplicationsDashboard = lazy(
  () => import('@/pages/dashboards/CohortApplicationsDashboard')
);

export const LazyFeePaymentDashboard = lazy(
  () => import('@/pages/FeePaymentDashboard')
);

export const LazyEquipmentInventoryPage = lazy(
  () => import('@/pages/EquipmentInventoryPage')
);

export const LazyUserManagementPage = lazy(
  () => import('@/pages/user-management/UserManagementPage')
);

export const LazyMentorManagementPage = lazy(
  () => import('@/pages/mentor-management/MentorManagementPage')
);

export const LazyExperienceDesignerPage = lazy(
  () => import('@/pages/ExperienceDesignerPage')
);

export const LazyExperienceDesignManagementPage = lazy(
  () => import('@/pages/ExperienceDesignManagementPage')
);

export const LazyEpicsManagementPage = lazy(
  () => import('@/pages/EpicsManagementPage')
);

export const LazyEpicLearningPathsManagementPage = lazy(
  () => import('@/pages/EpicLearningPathsManagementPage')
);

// Lazy load heavy components
export const LazyCohortsPage = lazy(() => import('@/pages/CohortsPage'));

export const LazyCohortDetailsPage = lazy(
  () => import('@/pages/CohortDetailsPage')
);

export const LazyCohortAttendancePage = lazy(
  () => import('@/pages/CohortAttendancePage')
);

export const LazyCohortProgramPage = lazy(
  () => import('@/pages/CohortProgramPage')
);

export const LazyBorrowingHistoryPage = lazy(
  () => import('@/pages/BorrowingHistoryPage')
);

// Loading fallback component
export function DashboardLoadingFallback() {
  return (
    <div className='space-y-6 p-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-1/4' />
        <Skeleton className='h-4 w-1/2' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic loading wrapper
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense
        fallback={fallback ? <fallback /> : <DashboardLoadingFallback />}
      >
        <Component {...props} />
      </Suspense>
    );
  };
}
