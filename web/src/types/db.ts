// Readable aliases over the generated schema types, so app code never has to
// spell out Database['public']['Tables'][...]['Row'].
import type { Database, Json } from './database'

// Re-exported so app code never imports the generated file directly.
export type { Json }

type Tables = Database['public']['Tables']

export type Project = Tables['projects']['Row']
