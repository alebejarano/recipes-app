import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

export type StorageScreenMode = 'auth' | 'public' | 'dev'

export function useStorageDataMode(mode: StorageScreenMode = 'auth') {
  const { localFirst } = useStorageStrategy()
  const shouldUseLocalData =
    mode === 'public' ||
    mode === 'dev' ||
    (mode === 'auth' && localFirst)
  return {
    shouldUseLocalData,
    isPublicMode: mode === 'public',
    isAuthMode: mode === 'auth',
  }
}
