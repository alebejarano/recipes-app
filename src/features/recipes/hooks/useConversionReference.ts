import { useQuery } from '@tanstack/react-query'

import { fetchConversionReference } from '@/features/recipes/api/conversionReferenceRepo'

const REFERENCE_STALE_TIME = 1000 * 60 * 60 * 24 * 7

export function useConversionReference() {
    return useQuery({
        queryKey: ['recipes', 'conversion-reference'],
        queryFn: fetchConversionReference,
        staleTime: REFERENCE_STALE_TIME,
        gcTime: REFERENCE_STALE_TIME,
        retry: 1,
    })
}
