import "dotenv/config"
import { resolve } from "node:path"

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  sessionSecret: required("SESSION_SECRET"),
  // ファイル共有の実体保存先(要件定義書6-1章: DBにはメタデータのみ、実体はローカルディスク)
  storageDir: resolve(process.env.STORAGE_DIR ?? resolve(process.cwd(), "../storage")),
  db: {
    server: required("DB_SERVER"),
    port: Number(process.env.DB_PORT ?? 1433),
    database: required("DB_NAME"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true",
  },
}
