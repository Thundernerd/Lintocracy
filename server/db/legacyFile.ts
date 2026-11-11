import { access, rename } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

/** Database file name used before the app was renamed to Lintocracy. */
const LEGACY_FILE_NAME = 'rule-wars.db'

/** Files SQLite keeps next to the database; they must travel with it. */
const SIDECAR_SUFFIXES = ['-wal', '-shm', '-journal']

async function exists(path: string) {
  return access(path).then(
    () => true,
    () => false,
  )
}

/**
 * Renames a pre-Lintocracy `rule-wars.db` in the same directory to `path`, along with its
 * sidecar files, so existing groups and votes survive the rename. Does nothing when `path`
 * already exists (the old file is then left untouched) or there is no old file. Never deletes
 * or overwrites anything.
 */
export async function migrateLegacyDatabaseFile(path: string) {
  const legacyPath = join(dirname(path), LEGACY_FILE_NAME)
  if (basename(path) === LEGACY_FILE_NAME) return
  if (await exists(path)) return
  if (!(await exists(legacyPath))) return

  const sidecars: [from: string, to: string][] = []
  for (const suffix of SIDECAR_SUFFIXES) {
    const from = legacyPath + suffix
    if (!(await exists(from))) continue
    const to = path + suffix
    if (await exists(to)) {
      throw new Error(
        `Cannot migrate ${legacyPath} to ${path}: ${to} already exists. Move it aside and restart.`,
      )
    }
    sidecars.push([from, to])
  }

  // Sidecars first, the database last: if this is interrupted, the next start still finds the
  // old database and finishes the job, and the moved sidecars are already waiting beside `path`.
  for (const [from, to] of sidecars) await rename(from, to)
  await rename(legacyPath, path)

  console.info(`[db] Renamed ${legacyPath} to ${path} (Rule Wars is now Lintocracy).`)
}
