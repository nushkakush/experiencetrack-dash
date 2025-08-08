/**
 * Performance utilities for enterprise applications
 * Includes debouncing, throttling, and memoization helpers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= wait) {
          func(...args);
          lastRan = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastRan), 0));
    }
  }) as T;
}

/**
 * React hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  return useCallback(debounce(callback, delay), deps);
}

/**
 * React hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  return useCallback(throttle(callback, delay), deps);
}

/**
 * React hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * React hook for measuring component performance
 */
export function usePerformanceMonitor(label: string, enabled = process.env.NODE_ENV === 'development') {
  const startTime = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
      }
    };
  }, [label, enabled]);
}

/**
 * Memoization utility with expiration
 */
export class MemoCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: K, value: V, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  has(key: K): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    
    return this.cache.size;
  }
}

/**
 * React hook for expensive computations with caching
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  ttl = 5 * 60 * 1000
): T {
  const cache = useRef(new MemoCache<string, T>(ttl));
  const key = useMemo(() => JSON.stringify(deps), deps);

  return useMemo(() => {
    const cached = cache.current.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = computeFn();
    cache.current.set(key, result);
    return result;
  }, [key, computeFn]);
}