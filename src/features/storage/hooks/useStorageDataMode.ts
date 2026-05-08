import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

export type StorageScreenMode = 'auth' | 'public' | 'dev'

export function useStorageDataMode(mode: StorageScreenMode = 'auth') {
  const { isAuthenticated, isLoaded, localFirst } = useStorageStrategy()
  const shouldUseLocalData =
    mode === 'public' ||
    mode === 'dev' ||
    (mode === 'auth' && localFirst)
  const isStorageModeReady = mode !== 'auth' || !isAuthenticated || isLoaded
  return {
    shouldUseLocalData,
    isStorageModeReady,
    isPublicMode: mode === 'public',
    isAuthMode: mode === 'auth',
  }
}
