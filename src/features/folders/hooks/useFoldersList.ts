import { useQuery } from '@tanstack/react-query'

import type { Folder } from '../api/foldersRepo'
import { listFolders } from '../api/foldersRepo'

export function useFoldersList() {
  return useQuery<Folder[]>({
    queryKey: ['folders', 'list'],
    queryFn: () => listFolders(),
  })
}
