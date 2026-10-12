import { ChevronDown, LayoutGrid, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'
import type { Theme } from '@/lib/theme-context'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/**
 * `wide` is for a page that needs the room. The header keeps its own
 * width either way, so the chrome doesn't jump as you move between them.
 */
export function AppLayout({ wide = false }: { wide?: boolean }) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <LayoutGrid className="size-4 text-muted-foreground" />
            Starter
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" />}
            >
              <span className="max-w-[16ch] truncate">{user?.email}</span>
              <ChevronDown data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Every DropdownMenuLabel needs a Group or RadioGroup around
                  it: base-ui's GroupLabel reads the group context to register
                  its id, and throws outright when there isn't one. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  Theme
                </DropdownMenuLabel>
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full px-4 py-8',
          wide ? 'max-w-7xl' : 'max-w-4xl'
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
