import type { NextFunction, Request, Response } from "express"

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ message: "未ログインです" })
    return
  }
  next()
}
