import type { NextFunction, Request, Response } from "express"
import { HttpError } from "./httpError.js"

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ message: "サーバー内部でエラーが発生しました" })
}
