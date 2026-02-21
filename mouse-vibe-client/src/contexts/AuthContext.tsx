import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { subscribeAuth, isAuthReady } from '../lib/authState'

type AuthContextValue = {
  user: User | null
  authReady: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(isAuthReady)

  useEffect(() => {
    return subscribeAuth((firebaseUser) => {
      setUser(firebaseUser)
      setReady(true)
    })
  }, [])

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, authReady: ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
