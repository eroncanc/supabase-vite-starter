import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { copy } from '@/lib/copy'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">{copy.notFound}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link to="/" />}
      >
        Go home
      </Button>
    </div>
  )
}
