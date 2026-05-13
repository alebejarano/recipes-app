import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'

function sanitizeFileName(name: string) {
  const trimmed = name.trim()
  const safeName = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_')
  return safeName || 'recipe-import'
}

export async function stagePickedImportFile(input: {
  uri: string
  name: string
}): Promise<string> {
  if (Platform.OS === 'web') {
    return input.uri
  }

  const cacheDirectory = FileSystem.cacheDirectory
  if (!cacheDirectory) {
    return input.uri
  }

  const directory = `${cacheDirectory}picked-imports/`
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true })

  const destination = `${directory}${Date.now()}_${sanitizeFileName(input.name)}`
  await FileSystem.copyAsync({
    from: input.uri,
    to: destination,
  })

  return destination
}
