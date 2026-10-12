import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/lib/auth-context'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
