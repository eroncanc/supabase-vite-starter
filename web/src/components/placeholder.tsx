import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'

/** Stand-in for a section that has no data layer yet. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  )
}
