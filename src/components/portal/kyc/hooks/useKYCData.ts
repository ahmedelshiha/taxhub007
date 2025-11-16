/**
 * useKYCData Hook
 * Custom hook for fetching and managing KYC data
 */

import useSWR from "swr";
import { useMemo } from "react";
import { KYCData, KYCApiResponse } from "../types/kyc";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseKYCDataOptions {
  entityId: string | null;
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}

interface UseKYCDataReturn {
  kycData: KYCData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => void;
}

/**
 * Hook to fetch KYC data for a specific entity
 * 
 * @param options - Configuration options
 * @returns KYC data, loading state, error state, and refresh function
 * 
 * @example
 * ```typescript
 * const { kycData, isLoading, refresh } = useKYCData({ 
 *   entityId: "ent-123" 
 * });
 * ```
 */
export function useKYCData({
  entityId,
  refreshInterval = 0,
  revalidateOnFocus = false,
}: UseKYCDataOptions): UseKYCDataReturn {
  const { data, error, isLoading, mutate } = useSWR<KYCApiResponse>(
    entityId ? `/api/kyc?entityId=${entityId}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus,
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
    }
  );

  return {
    kycData: data?.data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

interface UseMultipleKYCDataReturn {
  data: (KYCData | undefined)[];
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
}

/**
 * Hook to fetch KYC data for multiple entities
 * 
 * @param entityIds - Array of entity IDs
 * @returns Array of KYC data results
 */
export function useMultipleKYCData(entityIds: string[]): UseMultipleKYCDataReturn {
  // Fetch data for all entities
  const dataList = useMemo(() => {
    return entityIds.map((entityId) => ({
      entityId,
      key: entityId ? `/api/kyc?entityId=${entityId}` : null,
    }));
  }, [entityIds]);

  // Use SWR for each entity
  const results = useMemo(() => {
    return dataList.map(({ key }) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSWR<KYCApiResponse>(key, fetcher, {
        dedupingInterval: 5000,
      })
    );
  }, [dataList]);

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => !!r.error);

  return {
    data: results.map((r) => r.data?.data),
    isLoading,
    isError,
    refresh: () => results.forEach((r) => r.mutate()),
  };
}
