import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import type { BackLink } from '@/lib/back-link'

/**
 * `back` renders above the title rather than at the foot of the page. A page whose
 * content keeps growing would push a way out at its foot below the fold, and a
 * way out you have to scroll to find isn't one. It sits here rather than in the layout because only the page
 * knows where back goes -- see `lib/back-link.ts`.
 */
export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  back?: BackLink
}) {
  return (
    <div className="mb-6">
      {back ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1 text-muted-foreground"
          nativeButton={false}
          render={<Link to={back.to} />}
        >
          <ArrowLeft data-icon="inline-start" />
          {back.label}
        </Button>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  )
}
