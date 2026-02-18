// src/features/notes/api/notesRepo.ts
import { supabase } from '@/lib/supabase'

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Not authenticated')
  return data.session.user
}

export type Note = {
  id: string
  userId: string
  title: string | null
  content: string | null
  pinnedAt: string | null
  createdAt: string
  updatedAt: string
}

type NoteRow = {
  id: string
  user_id: string
  title: string | null
  content: string | null
  pinned_at: string | null
  created_at: string
  updated_at: string
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? null,
    content: row.content ?? null,
    pinnedAt: row.pinned_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CreateNoteInput = {
  title: string
  content: string
  pinnedAt?: string | null
}

export type UpdateNoteInput = {
  title?: string
  content?: string
  pinnedAt?: string | null
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const user = await requireAuth()
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: normalizeText(input.title),
      content: normalizeText(input.content),
      pinned_at: input.pinnedAt ?? null,
    })
    .select(
      `
      id,
      user_id,
      title,
      content,
      pinned_at,
      created_at,
      updated_at
    `
    )
    .single()

  if (error) throw error
  if (!data) throw new Error('Create note failed')

  return mapNote(data as NoteRow)
}

export async function getNoteById(id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select(
      `
      id,
      user_id,
      title,
      content,
      pinned_at,
      created_at,
      updated_at
    `
    )
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Note not found')

  return mapNote(data as NoteRow)
}

export async function listNotes(params?: {
  limit?: number
  search?: string
}): Promise<Note[]> {
  const limit = params?.limit ?? 50
  const search = params?.search?.trim()

  let query = supabase
    .from('notes')
    .select(
      `
      id,
      user_id,
      title,
      content,
      pinned_at,
      created_at,
      updated_at
    `
    )
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => mapNote(row as NoteRow))
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  await requireAuth()
  const payload: Record<string, string | null> = {}
  if (typeof input.title === 'string') payload.title = normalizeText(input.title)
  if (typeof input.content === 'string') payload.content = normalizeText(input.content)
  if (Object.prototype.hasOwnProperty.call(input, 'pinnedAt')) {
    payload.pinned_at = input.pinnedAt ?? null
  }

  if (Object.keys(payload).length === 0) {
    return getNoteById(id)
  }

  const { data, error } = await supabase
    .from('notes')
    .update(payload)
    .eq('id', id)
    .select(
      `
      id,
      user_id,
      title,
      content,
      pinned_at,
      created_at,
      updated_at
    `
    )
    .single()

  if (error) throw error
  if (!data) throw new Error('Update note failed')

  return mapNote(data as NoteRow)
}

export async function deleteNoteById(id: string): Promise<void> {
  await requireAuth()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
