"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface AdminAuthContextType {
  adminKey: string
  isAuthenticated: boolean
  login: (key: string) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  adminKey: "",
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

const STORAGE_KEY = "admin_auth_key"

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setAdminKey(stored)
      setIsAuthenticated(true)
    }
    setMounted(true)
  }, [])

  const login = useCallback((key: string) => {
    setAdminKey(key)
    setIsAuthenticated(true)
    localStorage.setItem(STORAGE_KEY, key)
  }, [])

  const logout = useCallback(() => {
    setAdminKey("")
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <AdminAuthContext.Provider value={{ adminKey, isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
