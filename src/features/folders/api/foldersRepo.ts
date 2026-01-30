import { supabase } from '@/lib/supabase'

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Not authenticated')
  return data.session.user
}

export type Folder = {
  id: string
  name: string
  emoji: string
  createdAt: string
}

type FolderRow = {
  id: string
  name: string
  emoji: string | null
  created_at: string
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? '📁',
    createdAt: row.created_at,
  }
}

export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('id,name,emoji,created_at')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapFolder(row as FolderRow))
}

export async function createFolder(input: { name: string; emoji?: string | null }) {
  const user = await requireAuth()
  const name = input.name.trim()
  if (!name) throw new Error('Folder name is required')

  const emoji = input.emoji?.trim() || '📁'

  const { data, error } = await supabase
    .from('folders')
    .insert({ user_id: user.id, name, emoji })
    .select('id,name,emoji,created_at')
    .single()

  if (error) throw error
  if (!data) throw new Error('Create folder failed')

  return mapFolder(data as FolderRow)
}
