import WorkspaceForm from '../../components/WorkspaceForm'

/**
 * WorkspacePage component renders the workspace creation form
 * Uses WorkspaceForm component to handle workspace setup
 */
export default function WorkspacePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <WorkspaceForm />
    </main>
  )
} 