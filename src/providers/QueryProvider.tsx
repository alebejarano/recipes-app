import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProviderComponent({ children }: { children: ReactNode }) {
  // useState ensures the client is created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // Navigation between tabs should be instant. Data-changing flows
            // explicitly invalidate their affected queries, so a longer
            // freshness window avoids repeating the same reads on a return to
            // Home without leaving the library stale.
            staleTime: 5 * 60_000,
            refetchOnWindowFocus: false, // RN-safe default
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default QueryProviderComponent
