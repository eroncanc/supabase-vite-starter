import { useParams } from 'react-router'

import { PageHeader } from '@/components/page-header'
import { Placeholder } from '@/components/placeholder'
import { Skeleton } from '@/components/ui/skeleton'
import { useBackLink, type BackLink } from '@/lib/back-link'
import { publicImageUrl } from '@/lib/images'
import { useProject } from '@/lib/use-projects'

/** Where back goes on a deep link or a reload, which carry no state. */
const DEFAULT_BACK: BackLink = { to: '/', label: 'Back to projects' }

export function ProjectDetailPage() {
  const { id } = useParams()
  // Remounted per id, so moving between projects starts from a clean load.
  return <ProjectDetail key={id} id={id!} />
}

function ProjectDetail({ id }: { id: string }) {
  const { project, loading, error } = useProject(id)
  const back = useBackLink(DEFAULT_BACK)

  // PageHeader renders in every branch, so the way out is there before the
  // data is.
  if (loading) {
    return (
      <>
        <PageHeader title="Project" back={back} />
        <Skeleton className="aspect-video w-full" />
      </>
    )
  }

  if (error || !project) {
    return (
      <>
        <PageHeader title="Project" back={back} />
        <Placeholder>
          <p className="text-destructive">{error}</p>
        </Placeholder>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description}
        back={back}
      />
      {project.image_path ? (
        <img
          src={publicImageUrl(project.image_path)}
          alt=""
          className="aspect-video w-full rounded-xl border border-border object-cover"
        />
      ) : null}
    </>
  )
}
