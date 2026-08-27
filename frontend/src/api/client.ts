export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
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

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "エラーが発生しました")
  }

  return body as T
}
