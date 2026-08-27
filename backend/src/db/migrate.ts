import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { getPool } from "../config/db.js"

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations")

async function ensureMigrationsTable(): Promise<void> {
  const pool = await getPool()
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'schema_migrations')
    CREATE TABLE schema_migrations (
      filename    NVARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = await getPool()
  const result = await pool.request().query<{ filename: string }>(
    "SELECT filename FROM schema_migrations",
  )
  return new Set(result.recordset.map((row) => row.filename))
}

async function runMigration(filename: string): Promise<void> {
  const pool = await getPool()
  const sqlText = readFileSync(join(migrationsDir, filename), "utf-8")
  const transaction = pool.transaction()
  await transaction.begin()
  try {
    await transaction.request().query(sqlText)
    await transaction
      .request()
      .input("filename", filename)
      .query("INSERT INTO schema_migrations (filename) VALUES (@filename)")
    await transaction.commit()
    console.log(`applied: ${filename}`)
  } catch (error) {
    await transaction.rollback()
    throw new Error(`migration failed: ${filename}\n${(error as Error).message}`)
  }
}

async function main(): Promise<void> {
  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()

  const pending = files.filter((name) => !applied.has(name))
  if (pending.length === 0) {
    console.log("no pending migrations")
    return
  }

  for (const filename of pending) {
    await runMigration(filename)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
