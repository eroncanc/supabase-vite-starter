// Kept out of any component file so it only exports a hook (fast refresh), the
// same reason auth.tsx and auth-context.ts are split.
import { useCallback, useEffect, useState } from 'react'

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  type ProjectInput,
} from '@/lib/projects'
import type { Project } from '@/types/db'
import { copy } from '@/lib/copy'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  // The loading/error reset happens here rather than in the effect body: the
  // initial state already covers the first load, and doing it from the event
  // keeps the effect free of synchronous setState.
  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setReloadToken((n) => n + 1)
  }, [])

  useEffect(() => {
    let ignore = false

    listProjects()
      .then((rows) => {
        if (!ignore) setProjects(rows)
      })
      .catch((cause: unknown) => {
        if (!ignore) {
          setError(
            cause instanceof Error ? cause.message : copy.errors.loadProjects
          )
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [reloadToken])

  // Mutations patch local state from the row the server returns rather than
  // refetching, and rethrow so the calling dialog can surface the failure.
  const create = useCallback(async (input: ProjectInput) => {
    const project = await createProject(input)
    setProjects((current) => [project, ...current])
    return project
  }, [])

  const update = useCallback(async (id: string, input: ProjectInput) => {
    const project = await updateProject(id, input)
    setProjects((current) =>
      current.map((it) => (it.id === id ? project : it))
    )
    return project
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteProject(id)
    setProjects((current) => current.filter((it) => it.id !== id))
  }, [])

  return { projects, loading, error, create, update, remove, reload }
}
