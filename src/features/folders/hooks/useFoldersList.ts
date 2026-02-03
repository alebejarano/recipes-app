import { useQuery } from '@tanstack/react-query'

import type { Folder } from '../api/foldersRepo'
import { listFolders } from '../api/foldersRepo'

type FoldersListParams = {
  enabled?: boolean
}

export function useFoldersList(params?: FoldersListParams) {
  return useQuery<Folder[]>({
    queryKey: ['folders', 'list'],
    queryFn: () => listFolders(),
    enabled: params?.enabled ?? true,
  })
}
