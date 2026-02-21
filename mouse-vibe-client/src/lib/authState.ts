import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'

type AuthListener = (user: User | null) => void

let currentUser: User | null = null
let authReady = false
const listeners = new Set<AuthListener>()

// Resolves once the first onAuthStateChanged fires
const readyPromise = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user
    if (!authReady) {
      authReady = true
      resolve()
    }
    listeners.forEach((fn) => fn(user))
  })
})

/** Wait for Firebase Auth to initialise, then return the current user (or null). */
export async function getAuthUser(): Promise<User | null> {
  await readyPromise
  return currentUser
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function subscribeAuth(fn: AuthListener): () => void {
  listeners.add(fn)
  // If already ready, notify immediately so late subscribers don't miss
  if (authReady) {
    fn(currentUser)
  }
  return () => listeners.delete(fn)
}

/** Whether onAuthStateChanged has fired at least once. */
export function isAuthReady(): boolean {
  return authReady
}
