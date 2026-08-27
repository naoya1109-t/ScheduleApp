import type { NextFunction, Request, Response } from "express"

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session.role !== "admin") {
    res.status(403).json({ message: "管理者権限が必要です" })
    return
  }
  next()
}
