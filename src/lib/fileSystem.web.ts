import { fetchWithTimeout, FILE_READ_TIMEOUT_MS } from '@/lib/network'

type PathPart = string | { uri: string }

function toPathSegment(part: PathPart) {
  if (typeof part === 'string') {
    return part
  }

  return part.uri
}

function joinParts(parts: PathPart[]) {
  const filtered = parts.map(toPathSegment).filter(Boolean)
  if (filtered.length === 0) return ''
  return filtered.join('/').replace(/(?<!:)\/{2,}/g, '/')
}

async function readRemoteText(uri: string) {
  const response = await fetchWithTimeout(uri, {
    timeoutMs: FILE_READ_TIMEOUT_MS,
    timeoutMessage: 'File read timed out',
  })
  if (!response.ok) {
    throw new Error(`Unable to read file: ${response.status}`)
  }
  return response.text()
}

async function readRemoteInfo(uri: string, options?: { md5?: boolean }) {
  const response = await fetchWithTimeout(uri, {
    timeoutMs: FILE_READ_TIMEOUT_MS,
    timeoutMessage: 'File info request timed out',
  })
  if (!response.ok) {
    return {
      exists: false,
      size: 0,
      md5: null,
    }
  }

  const blob = await response.blob()
  return {
    exists: true,
    size: blob.size,
    md5: options?.md5 ? null : undefined,
  }
}

export class Directory {
  uri: string

  constructor(...parts: PathPart[]) {
    this.uri = joinParts(parts)
  }

  get exists() {
    return false
  }

  create() {
    // Web fallback: no writable local filesystem backing in this app yet.
  }
}

export class File {
  uri: string

  constructor(...parts: PathPart[]) {
    this.uri = joinParts(parts)
  }

  get exists() {
    return false
  }

  async text() {
    return readRemoteText(this.uri)
  }

  async info(options?: { md5?: boolean }) {
    return readRemoteInfo(this.uri, options)
  }

  copy(_target: File) {
    // Web fallback: keep original URL references instead of copying to app storage.
  }

  delete() {
    // No-op on web fallback.
  }
}

export class Paths {
  static get cache() {
    return new Directory('cache://')
  }

  static get bundle() {
    return new Directory('bundle://')
  }

  static get document() {
    return new Directory('document://')
  }
}
