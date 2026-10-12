import { Route, Routes } from 'react-router'

import { AppLayout } from '@/components/app-layout'
import { RequireAuth } from '@/components/require-auth'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { ProjectDetailPage } from '@/pages/project-detail'
import { ProjectsPage } from '@/pages/projects'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
