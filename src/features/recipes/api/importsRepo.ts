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

export async function uploadPremiumImport(
  input: UploadPremiumImportInput
): Promise<UploadPremiumImportResult> {
  const formData = new FormData()
  formData.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as any)

  const { data, error } = await supabase.functions.invoke('validate-and-upload-import', {
    body: formData,
  })

  if (error) throw error
  if (!data) throw new Error('Import upload failed')

  return {
    bucket: String((data as any).bucket ?? ''),
    path: String((data as any).path ?? ''),
    mimeType: String((data as any).mimeType ?? ''),
    size: Number((data as any).size ?? 0),
  }
}
