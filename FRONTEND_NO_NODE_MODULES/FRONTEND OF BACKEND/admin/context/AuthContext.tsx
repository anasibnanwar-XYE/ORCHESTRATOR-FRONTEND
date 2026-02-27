import { createContext, useContext, type ReactNode } from 'react';
import type { AuthSession, AuthenticatedUser } from '../types/auth';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthenticatedUser | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ value, children }: { value: AuthContextValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
