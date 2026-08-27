import sql from "mssql"
import { env } from "./env.js"

const config: sql.config = {
  server: env.db.server,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  options: {
    encrypt: env.db.encrypt,
    trustServerCertificate: env.db.trustServerCertificate,
  },
}

let pool: sql.ConnectionPool | undefined
let connecting: Promise<sql.ConnectionPool> | undefined

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool
  }
  if (!connecting) {
    connecting = new sql.ConnectionPool(config)
      .connect()
      .then((connectedPool) => {
        // 接続が切れた場合にプロセスがクラッシュしないよう、'error'イベントを必ず受け取る
        connectedPool.on("error", (err) => {
          console.error("SQL Server接続エラー", err)
          pool = undefined
        })
        pool = connectedPool
        return connectedPool
      })
      .finally(() => {
        connecting = undefined
      })
  }
  return connecting
}
