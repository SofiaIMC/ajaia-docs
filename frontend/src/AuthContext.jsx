import React, { createContext, useContext, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ajaia_user')) } catch { return null }
  })

  const login = (userData, token) => {
    localStorage.setItem('ajaia_token', token)
    localStorage.setItem('ajaia_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ajaia_token')
    localStorage.removeItem('ajaia_user')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
