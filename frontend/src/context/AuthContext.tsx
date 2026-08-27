import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { fetchCurrentUser, login as apiLogin, logout as apiLogout, type CurrentUser } from "../api/auth"

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  login: (loginId: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(loginId: string, password: string) {
    const currentUser = await apiLogin(loginId, password)
    setUser(currentUser)
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthはAuthProviderの内側で使用してください")
  }
  return context
}
