import { lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generic lazy loading wrapper with loading state
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFunc);

  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={fallback ? <fallback /> : <DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Default loading fallback
function DefaultLoadingFallback() {
  return (
    <div className='space-y-4 p-6'>
      <Skeleton className='h-8 w-1/3' />
      <Skeleton className='h-4 w-2/3' />
      <Skeleton className='h-4 w-1/2' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    </div>
  );
}

// Import Suspense
import { Suspense } from 'react';
