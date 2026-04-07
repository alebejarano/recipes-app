import * as ImagePicker from 'expo-image-picker'
import { File } from '@/lib/fileSystem'

type ResizeAction = { resize: { width?: number; height?: number } }

type ImageManipulatorModule = {
  SaveFormat: {
    JPEG: string
  }
  manipulateAsync: (
    uri: string,
    actions: ResizeAction[],
    saveOptions: { compress: number; format: string }
  ) => Promise<{ uri: string }>
}

export type OptimizedImageAsset = {
  uri: string
  fileName: string
  mimeType: string
  fileSize: number
}

type OptimizeImageAssetOptions = {
  maxDimensionPx: number
  maxFileBytes: number
  qualities: readonly number[]
  fallbackBaseName: string
  tooLargeMessage: string
}

function getOptimizedFileName(fileName: string | null | undefined, fallbackBaseName: string) {
  const base = (fileName?.trim() || `${fallbackBaseName}-${Date.now()}`).replace(/\.[^/.]+$/, '')
  return `${base}.jpg`
}

function getResizeAction(
  width: number | null | undefined,
  height: number | null | undefined,
  maxDimensionPx: number
): ResizeAction[] {
  const resolvedWidth = width ?? 0
  const resolvedHeight = height ?? 0
  if (!resolvedWidth || !resolvedHeight) return []
  const longestSide = Math.max(resolvedWidth, resolvedHeight)
  if (longestSide <= maxDimensionPx) return []

  if (resolvedWidth >= resolvedHeight) {
    return [{ resize: { width: maxDimensionPx } }]
  }
  return [{ resize: { height: maxDimensionPx } }]
}

async function getFileSizeBytes(uri: string): Promise<number> {
  try {
    const info = await new File(uri).info()
    if (info.exists && 'size' in info && typeof info.size === 'number') return info.size
  } catch {
    // Ignore info lookup errors and return 0 as unknown size.
  }
  return 0
}

function loadImageManipulatorModule(): ImageManipulatorModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require('expo-image-manipulator') as ImageManipulatorModule
  if (!module?.manipulateAsync || !module?.SaveFormat?.JPEG) {
    throw new Error('Image optimizer is not available on this build.')
  }
  return module
}

export async function optimizePickerImageAsset(
  asset: ImagePicker.ImagePickerAsset,
  options: OptimizeImageAssetOptions
): Promise<OptimizedImageAsset> {
  return optimizeImageUri(
    {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName,
    },
    options
  )
}

export async function optimizeImageUri(
  input: {
    uri: string
    width?: number | null
    height?: number | null
    fileName?: string | null
  },
  options: OptimizeImageAssetOptions
): Promise<OptimizedImageAsset> {
  const imageManipulator = loadImageManipulatorModule()
  const actions = getResizeAction(input.width, input.height, options.maxDimensionPx)
  const fileName = getOptimizedFileName(input.fileName, options.fallbackBaseName)

  for (const quality of options.qualities) {
    const result = await imageManipulator.manipulateAsync(input.uri, actions, {
      compress: quality,
      format: imageManipulator.SaveFormat.JPEG,
    })
    const size = await getFileSizeBytes(result.uri)
    if (size > 0 && size <= options.maxFileBytes) {
      return {
        uri: result.uri,
        fileName,
        mimeType: 'image/jpeg',
        fileSize: size,
      }
    }
  }

  throw new Error(options.tooLargeMessage)
}
