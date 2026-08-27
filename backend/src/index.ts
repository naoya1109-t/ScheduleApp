import cors from "cors"
import express from "express"
import { env } from "./config/env.js"
import { getPool } from "./config/db.js"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.get("/api/health/db", async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.request().query("SELECT 1 AS ok")
    res.json({ status: "ok" })
  } catch (error) {
    res.status(503).json({ status: "error", message: (error as Error).message })
  }
})

app.listen(env.port, () => {
  console.log(`backend listening on port ${env.port}`)
})
