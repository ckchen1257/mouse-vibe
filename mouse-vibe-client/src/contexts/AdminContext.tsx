import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { syncMe, type MeResponse } from '../abacApi'
import { useAuth } from './AuthContext'

type AdminContextValue = {
  me: MeResponse | null
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminContextValue>({ me: null, isAdmin: false, loading: true })

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      setMe(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    ;(async () => {
      try {
        const data = await syncMe(controller.signal)
        if (!controller.signal.aborted) setMe(data)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        if (!controller.signal.aborted) setMe(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [user?.uid, authReady])

  return (
    <AdminContext.Provider value={{ me, isAdmin: me?.isAdmin ?? false, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin(): AdminContextValue {
  return useContext(AdminContext)
}
