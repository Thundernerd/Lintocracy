// Runs in a worker thread: holds a write lock on a SQLite database for a while, the way a
// backup, the sqlite3 CLI or a second app process would. The app's driver runs statements
// synchronously, so the lock has to be held off the test's thread to be released while a
// request is waiting on it.
import { parentPort, workerData } from 'node:worker_threads'
import { setTimeout as sleep } from 'node:timers/promises'
import { createClient } from '@libsql/client'

const { databaseUrl, holdMs } = workerData
const client = createClient({ url: databaseUrl })
await client.execute('BEGIN IMMEDIATE')
parentPort.postMessage('locked')
await sleep(holdMs)
await client.execute('COMMIT')
client.close()
