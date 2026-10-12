// Data access for the `projects` table. RLS scopes every statement to the
// signed-in owner, so none of these filter on user_id -- except the insert,
// which has to supply it (the column is NOT NULL with no default, and the
// policy's WITH CHECK compares it to auth.uid()).
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/db'
import { copy } from '@/lib/copy'

export type ProjectInput = {
  name: string
  description: string | null
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error(copy.errors.signedOut)

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...input, user_id: auth.user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
