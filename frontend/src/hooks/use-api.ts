'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/** Generic data fetching hook with loading/error states */
export function useApi<T>(url: string, immediate = true): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(url);
      setData(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [immediate, fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

/** Mutation hook for POST/PATCH/DELETE */
export function useMutation<TData = unknown, TPayload = unknown>(
  method: 'post' | 'patch' | 'put' | 'delete',
  url: string,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (payload?: TPayload, urlOverride?: string): Promise<TData> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api[method]<TData>(urlOverride || url, payload);
        return response.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        const msg = error.response?.data?.message || 'An error occurred';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [method, url],
  );

  return { mutate, isLoading, error };
}
