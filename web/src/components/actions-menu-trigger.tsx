import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * The three-dot menu button, the same everywhere it turns up. Copies of these
 * four lines are how a tap target ends up 28px everywhere at once.
 *
 * `touch-target` gives it a thumb's worth of hit area on a phone without
 * changing what's drawn, and `relative z-10` keeps it above `CardLink`'s
 * whole-card overlay on the cards that have one -- harmless on the rows that
 * don't.
 */
export function ActionsMenuTrigger({
  label,
  className,
}: {
  /** What the menu acts on, read out loud: "Actions for Groceries". */
  label: string
  className?: string
}) {
  return (
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('touch-target relative z-10', className)}
        />
      }
    >
      <MoreHorizontal />
      <span className="sr-only">{label}</span>
    </DropdownMenuTrigger>
  )
}
