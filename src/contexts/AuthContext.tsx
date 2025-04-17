
import { createContext, useContext } from 'react'
import { Session } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode
  value: AuthContextType 
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}