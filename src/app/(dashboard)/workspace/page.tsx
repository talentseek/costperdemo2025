import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkspacePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
      <p className="text-muted-foreground">Manage your CostPerDemo workspace and team members.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-64 blur-sm opacity-50">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Complete onboarding to access</CardDescription>
          </CardHeader>
        </Card>

        <Card className="h-64 blur-sm opacity-50">
          <CardHeader>
            <CardTitle>Workspace Settings</CardTitle>
            <CardDescription>Complete onboarding to access</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
} 