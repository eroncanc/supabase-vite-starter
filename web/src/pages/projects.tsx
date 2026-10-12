import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ActionsMenuTrigger } from '@/components/actions-menu-trigger'
import { PageHeader } from '@/components/page-header'
import { Placeholder } from '@/components/placeholder'
import { ProjectFormDialog } from '@/components/project-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { copy } from '@/lib/copy'
import { useProjects } from '@/lib/use-projects'
import type { Project } from '@/types/db'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

export function ProjectsPage() {
  const { projects, loading, error, create, update, remove, reload } =
    useProjects()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    if (!deleting) return
    setDeletePending(true)
    setDeleteError(null)
    try {
      await remove(deleting.id)
      setDeleting(null)
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : copy.errors.deleteProject
      )
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" />
            New project
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-4 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Placeholder>
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </Placeholder>
      ) : projects.length === 0 ? (
        <Placeholder>
          <p>{copy.projects.empty}</p>
          <Button size="sm" className="mt-3" onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" />
            New project
          </Button>
        </Placeholder>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                {project.description ? (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                ) : null}
                <CardAction>
                  <DropdownMenu>
                    <ActionsMenuTrigger label={`Actions for ${project.name}`} />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(project)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleting(project)
                        }}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                Started {dateFormat.format(new Date(project.created_at))}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={create}
      />

      <ProjectFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        project={editing ?? undefined}
        onSubmit={(input) => update(editing!.id, input)}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? copy.projects.deleteWarning(deleting.name) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={handleDelete}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
