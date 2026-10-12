import { Loader2, MailCheck, Swords } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { copy } from '@/lib/copy'

type LocationState = { from?: { pathname: string } }

// lucide-react dropped brand marks, and this has exactly one call site.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.56-5.15 3.56-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3a7.2 7.2 0 0 1-10.72-3.78h-4v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.62h-4a12 12 0 0 0 0 10.77l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.36 6.62l4 3.09A7.2 7.2 0 0 1 12 4.75Z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { session, loading, signInWithOtp, signInWithGoogle } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signInWithOtp(email)
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.errors.sendLink)
    } finally {
      setPending(false)
    }
  }

  async function handleGoogle() {
    setGooglePending(true)
    setError(null)
    try {
      await signInWithGoogle()
      // The tab is on its way to Google; leave the button spinning.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.errors.reachGoogle)
      setGooglePending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Swords className="mb-2 size-5 text-muted-foreground" />
          <CardTitle>Starter</CardTitle>
          <CardDescription>{copy.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <MailCheck className="size-4" />
                Check your email
              </p>
              <p className="text-muted-foreground">{copy.login.sentTo(email)}</p>
              <Button
                variant="link"
                size="sm"
                className="px-0"
                onClick={() => setSent(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={googlePending}
                onClick={handleGoogle}
              >
                {googlePending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GoogleIcon className="size-4" />
                )}
                Continue with Google
              </Button>

              <div className="relative text-center">
                <span className="absolute inset-x-0 top-1/2 border-t" />
                <span className="relative bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.login.emailPlaceholder}
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : null}
                  Send sign-in link
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
