export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | null = null

/** セッション切れ(401)を検知した際に呼び出すハンドラを登録する(AuthContextから配線) */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

function notifyIfUnauthorized(status: number): void {
  if (status === 401) {
    unauthorizedHandler?.()
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  notifyIfUnauthorized(response.status)

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "エラーが発生しました")
  }

  return body as T
}

export async function apiUpload<T>(path: string, formData: FormData, method: "POST" = "POST"): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    body: formData,
  })

  notifyIfUnauthorized(response.status)

  const body = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "エラーが発生しました")
  }

  return body as T
}
