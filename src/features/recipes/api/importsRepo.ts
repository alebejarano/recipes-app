import { supabase } from '@/lib/supabase'

export type UploadPremiumImportInput = {
  uri: string
  fileName: string
  mimeType: string
}

export type UploadPremiumImportResult = {
  bucket: string
  path: string
  mimeType: string
  size: number
}

const RECIPE_IMPORTS_BUCKET = 'recipe-imports'

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('You need to be signed in to upload files.')
  return data.session.user
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadPremiumImport(
  input: UploadPremiumImportInput
): Promise<UploadPremiumImportResult> {
  const user = await requireAuth()
  const safeName = sanitizeName(input.fileName.trim() || 'import')
  const objectPath = `${user.id}/${Date.now()}_${safeName}`

  const fileResponse = await fetch(input.uri)
  if (!fileResponse.ok) {
    throw new Error(`Unable to read selected file (${fileResponse.status}).`)
  }
  const arrayBuffer = await fileResponse.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const { error } = await supabase.storage
    .from(RECIPE_IMPORTS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: input.mimeType,
      upsert: false,
    })

  if (error) throw error

  return {
    bucket: RECIPE_IMPORTS_BUCKET,
    path: objectPath,
    mimeType: input.mimeType,
    size: bytes.byteLength,
  }
}
