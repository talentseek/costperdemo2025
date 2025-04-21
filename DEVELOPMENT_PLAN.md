# CostPerDemo Development Plan
This document outlines the development roadmap for CostPerDemo, a Next.js-based B2B SaaS platform for client authentication, workspace management, onboarding, and administration. It complements README.md and ARCHITECTURE.md, detailing phases, tasks, and testing steps to achieve project goals.
## Table of Contents

- Overview
- Phase 1: Authentication, Workspace, and Admin (Complete)
- Phase 2: Onboarding Flow Reintegration
- Future Phases
- Development Guidelines
- Testing Strategy

## Overview
CostPerDemo uses Next.js 15.3.1 (App Router), React 19.1.0, TypeScript, Supabase (auth and database), ShadCN UI, and Tailwind CSS. The platform prioritizes a server-first, API-driven architecture with mobile-first, accessible design. Phase 1 establishes robust authentication, workspace creation, and admin functionality. Phase 2 reintroduces onboarding flows from the onboarding-progress branch, integrating with the API-first setup. Future phases will add campaign management and analytics.
## Phase 1: Authentication, Workspace, and Admin (Complete)
**Status**: Complete (as of April 19, 2025)

**Objective**: Build a secure, scalable foundation with authentication, workspace management, and admin capabilities using API endpoints.

### Achievements:

#### Authentication:
- Supabase Auth with email/password and verification (src/app/auth/*, src/app/verify/page.tsx).
- API endpoints: /api/auth/login, /api/auth/signup, /api/auth/verify, /api/auth/session, /api/auth/logout.
- Middleware (src/middleware.ts) for route protection.
- Role-based access: client (default), admin (manual).
- Redirects: Admins to /admin, clients to /dashboard or /workspace.


#### Workspace Management:
- Workspace creation (src/app/workspace/page.tsx, src/components/WorkspaceForm.tsx).
- API endpoints: /api/workspace/create, /api/workspace/get.
- Database: users (id, email, role, workspace_id), workspaces (id, name, owner_id, subdomain).


#### Admin Panel:
- Admin dashboard (src/app/admin/page.tsx, src/components/AdminPanel.tsx).
- API endpoints: /api/admin/users, /api/admin/workspaces, /api/admin/setup, /api/admin/debug/*.
- Features: View/manage users and workspaces, change roles.


#### UI and Theming:
- ShadCN components (src/components/ui/*) for forms, buttons, tables, etc.
- Custom components: AuthForm.tsx, DashboardContent.tsx, WorkspaceForm.tsx, VerifyPrompt.tsx.
- Dark/light mode with next-themes (theme-provider.tsx, mode-toggle.tsx).
- Tailwind CSS with mobile-first, responsive design.


#### Architecture:
- API-first: All Supabase interactions via src/app/api/* using createRouteHandlerSupabaseClient.
- Supabase utils: src/utils/supabase/* (client.ts, server.ts, middleware.ts, route.ts, admin.ts).
- Type-safe: types/supabase.ts for database types.
- File structure: src/app/, src/components/, src/utils/supabase/, src/app/api/.



#### Files:

- Pages: src/app/(auth, admin, dashboard, verify, workspace)/*.tsx
- Components: src/components/(ui, AuthForm, DashboardContent, AdminPanel, WorkspaceForm, VerifyPrompt).tsx
- API Routes: src/app/api/(auth, user, workspace, admin)/*.ts
- Supabase: src/utils/supabase/*.ts, types/supabase.ts
- Config: next.config.ts, tailwind.config.ts, tsconfig.json

#### Testing:

- Auth: Login/signup, verification, role-based redirects.
- Workspace: Create workspace, view in dashboard.
- Admin: List users/workspaces, change roles.
- API: curl tests for /api/auth/*, /api/workspace/*, /api/admin/*.
- UI: Mobile/desktop responsiveness, dark/light mode.

## Phase 2: Onboarding Flow Reintegration
**Status**: Planned

**Objective**: Reintroduce onboarding flows from onboarding-progress branch, integrating with Phase 1's API-first architecture and workspace_onboarding table.

### Tasks:

#### Reintegrate Onboarding Files:
- Copy from onboarding-progress: src/components/OnboardingForm.tsx, src/components/ClientDashboard.tsx, src/app/onboarding/page.tsx, src/app/onboarding/confirmation/page.tsx.
- Update src/app/dashboard/page.tsx to include onboarding status (from ClientDashboard.tsx).
- Verify files: Ensure no conflicts with Phase 1 components (e.g., DashboardContent.tsx).


#### Create Onboarding API Endpoint:
- Add src/app/api/onboarding/route.ts:
  - POST: Save workspace_onboarding data (e.g., company_name, first_name, email, status).
  - GET: Fetch onboarding status/data for the user's workspace.
- Use createRouteHandlerSupabaseClient and types/supabase.ts.
- Validate inputs, handle errors (e.g., { error: 'Missing company_name' }).


#### Update OnboardingForm.tsx to call /api/onboarding instead of direct Supabase queries.


#### Update Database Access:
- Enable workspace_onboarding table (already exists: id, workspace_id, company_name, first_name, email, status, etc.).
- Set Row-Level Security (RLS):
```sql
CREATE POLICY client_access_onboarding ON workspace_onboarding
FOR ALL
TO authenticated
USING (auth.uid() = (SELECT id FROM users WHERE workspace_id = workspace_onboarding.workspace_id));
```
- Test RLS: Ensure only workspace members can access their onboarding data.


#### Refine Onboarding Flow:
- Restore 8-step form (OnboardingForm.tsx): Company details, product, target audience, lead generation, etc.
- Update ClientDashboard.tsx:
  - Show "Completed" badges for steps (not "Approved").
  - Grey out cards (opacity-50) with "Onboarding Awaiting Approval" badge when status = 'submitted' and all steps complete.
  - Keep buttons active (/onboarding).


#### Enhance app/onboarding/confirmation/page.tsx:
- White card, green checkmark, "Submission Received!" message.
- Buttons: "Book a Call" (https://cal.com/costperdemo/strategy-call), "Back to Dashboard" (/dashboard).


#### Redirect after form submission: /onboarding → /onboarding/confirmation → /dashboard.


#### Update Middleware:
- Modify src/middleware.ts: Redirect authenticated clients with incomplete onboarding to /onboarding.
- Ensure /onboarding and /onboarding/confirmation are protected (require auth).


#### UI Consistency:
- Use ShadCN components (src/components/ui/*) for forms, buttons, badges.
- Apply Tailwind CSS: White background (bg-white), mobile-first, responsive (sm:, md:).
- Support dark/light mode (bg-background, text-foreground).
- Add ARIA attributes for accessibility.



#### Database:

- Use workspace_onboarding table:
  - Columns: id (uuid), workspace_id (uuid), company_name (text), first_name (text), email (text), status (text), etc.
  - status: draft, submitted, approved, rejected.


- Foreign key: workspace_onboarding.workspace_id → workspaces.id.

#### Files to Update/Create:

- Pages: src/app/onboarding/page.tsx, src/app/onboarding/confirmation/page.tsx
- Components: src/components/OnboardingForm.tsx, src/components/ClientDashboard.tsx
- API: src/app/api/onboarding/route.ts
- Middleware: src/middleware.ts
- Dashboard: src/app/dashboard/page.tsx

#### Testing:

- Onboarding form: Submit all steps, verify data in workspace_onboarding.
- API: curl -X POST -d '{"company_name":"Test Corp"}' http://localhost:3000/api/onboarding.
- Dashboard: Check badges ("Completed"), grey-out (opacity-50) when status = 'submitted'.
- Confirmation: Verify UI, redirects, and "Book a Call" link.
- Middleware: Test redirects for incomplete onboarding.
- UI: Mobile/desktop responsiveness, dark/light mode, accessibility (VoiceOver).

#### Notes:

- Use onboarding-progress branch for reference (e.g., git checkout onboarding-progress && find . -type f).
- Ensure API endpoint validates required fields (e.g., company_name, first_name).
- Test RLS to prevent unauthorized access.

## Future Phases
### Phase 3: Campaign Management (Planned)

- Add campaign creation/editing (src/app/campaign/*).
- API endpoints: /api/campaign/create, /api/campaign/get.
- Database: New campaigns table (id, workspace_id, name, status).
- UI: Campaign dashboard, forms, and analytics.

### Phase 4: Analytics and Reporting (Planned)

- Add analytics dashboard (src/app/analytics/*).
- API endpoints: /api/analytics/*.
- Database: Store campaign performance data.
- UI: Charts, metrics, and exportable reports.

## Development Guidelines

### Coding:
- Use TypeScript (.tsx, .ts).
- PascalCase components (AuthForm), camelCase functions (handleLogin), kebab-case files (auth-form.tsx).
- Prettier (2-space indent), ESLint (eslint.config.mjs).
- JSDoc for complex functions/components.


### Architecture:
- Server components default; client components with 'use client'.
- All Supabase interactions via src/app/api/* using createRouteHandlerSupabaseClient.
- Type-safe queries with types/supabase.ts.


### UI:
- ShadCN components (src/components/ui/*).
- Tailwind CSS: Mobile-first, responsive, dark/light mode (bg-background).
- ARIA attributes for accessibility.


### API:
- Use src/app/api/*/route.ts.
- Validate inputs, return JSON errors (e.g., { error: 'Invalid data' }).
- Test with curl or Postman.


### Auth:
- Middleware (src/middleware.ts) for route protection.
- Role-based access: client (default), admin (manual).
- API endpoints for auth (/api/auth/*).


## Testing Strategy

### Unit Tests:
- Jest for components (AuthForm.tsx, WorkspaceForm.tsx).
- Mock Supabase API responses.


### API Tests:
- curl or Postman for /api/auth/*, /api/workspace/*, /api/onboarding.
- Verify status codes, JSON responses, and errors.


### UI Tests:
- Manual: Mobile/desktop responsiveness, dark/light mode.
- Accessibility: Test with VoiceOver or screen readers.


### E2E Tests:
- Auth: Signup, verify, login, workspace creation.
- Onboarding: Form submission, confirmation, dashboard updates.
- Admin: User/workspace management, role changes. 