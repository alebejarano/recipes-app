import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { Folder } from '../api/foldersCloudRepo'
import { listFolders } from '../api/foldersCloudRepo'

type FoldersListParams = {
  enabled?: boolean
}

export function useCloudFoldersList(params?: FoldersListParams) {
  const { user } = useAuth()
  return useQuery<Folder[]>({
    queryKey: ['folders', 'list', user?.id ?? 'guest'],
    queryFn: () => listFolders(),
    enabled: params?.enabled ?? true,
  })
}
