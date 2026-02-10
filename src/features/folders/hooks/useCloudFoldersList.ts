import { useQuery } from '@tanstack/react-query'

import type { Folder } from '../api/foldersCloudRepo'
import { listFolders } from '../api/foldersCloudRepo'

type FoldersListParams = {
  enabled?: boolean
}

export function useCloudFoldersList(params?: FoldersListParams) {
  return useQuery<Folder[]>({
    queryKey: ['folders', 'list'],
    queryFn: () => listFolders(),
    enabled: params?.enabled ?? true,
  })
}
