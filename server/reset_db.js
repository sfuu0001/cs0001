// Quick script to delete all SQLite files
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, "data")
const files = ["app.db", "app.db-wal", "app.db-shm"]

for (const f of files) {
  const fp = path.join(dataDir, f)
  try {
    fs.unlinkSync(fp)
    console.log(`Deleted: ${f}`)
  } catch {
    console.log(`Not found: ${f}`)
  }
}
