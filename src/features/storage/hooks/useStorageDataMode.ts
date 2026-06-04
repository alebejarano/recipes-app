import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

export type StorageScreenMode = 'auth' | 'public'

export function useStorageDataMode(mode: StorageScreenMode = 'auth') {
  const { isAuthenticated, isLoaded, localFirst } = useStorageStrategy()
  const shouldUseLocalData =
    mode === 'public' ||
    (mode === 'auth' && localFirst)
  const isStorageModeReady = mode !== 'auth' || !isAuthenticated || isLoaded
  return {
    shouldUseLocalData,
    isStorageModeReady,
    isPublicMode: mode === 'public',
    isAuthMode: mode === 'auth',
  }
}
