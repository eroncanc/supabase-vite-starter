import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { copy } from '@/lib/copy'
import type { ProjectInput } from '@/lib/projects'
import type { Project } from '@/types/db'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present = edit that project; absent = create a new one. */
  project?: Project
  onSubmit: (input: ProjectInput) => Promise<unknown>
}

/**
 * Create/edit form for a project. `open` is controlled so the trigger can live
 * anywhere -- the page header for create, a card's menu for edit.
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: Props) {
  const editing = Boolean(project)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {editing
              ? copy.projects.editDescription
              : copy.projects.newDescription}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted per subject, so the fields always start from that project
            and a cancelled edit never leaks into the next one. */}
        <ProjectForm
          key={project?.id ?? 'new'}
          project={project}
          onSubmit={onSubmit}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function ProjectForm({
  project,
  onSubmit,
  onDone,
}: {
  project?: Project
  onSubmit: (input: ProjectInput) => Promise<unknown>
  onDone: () => void
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      })
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.errors.saveProject)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <DialogBody>
        <div className="space-y-2">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.projects.namePlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {project ? 'Save changes' : 'Create project'}
        </Button>
      </DialogFooter>
    </form>
  )
}
