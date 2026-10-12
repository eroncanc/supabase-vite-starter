import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The search box above a pick list.
 *
 * Shared by every pick list because narrowing a list down is one gesture,
 * and only the placeholder differs. Whether it renders at all is the
 * caller's call -- see FILTER_THRESHOLD in lib/filter.ts.
 */
export function PickFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(changed) => onChange(changed.target.value)}
        className="px-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear the filter"
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={() => onChange('')}
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}
