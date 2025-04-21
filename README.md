# CostPerDemo - B2B SaaS Platform

CostPerDemo is a Next.js-based B2B SaaS platform for client authentication, workspace management, and administration. This documentation provides a comprehensive reference to the project's architecture, components, and development guidelines.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Authentication System](#authentication-system)
- [Workspace Management](#workspace-management)
- [Admin Panel](#admin-panel)
- [UI Components](#ui-components)
- [API Endpoints](#api-endpoints)
- [Theming and Dark Mode](#theming-and-dark-mode)
- [Development Guidelines](#development-guidelines)
- [Development Plan](DEVELOPMENT_PLAN.md)

## Architecture Overview

CostPerDemo is built with:

- **Next.js 15.3.1** (App Router)
- **React 19.1.0**
- **TypeScript**
- **Supabase** for authentication and database
- **ShadCN UI** for component library
- **Tailwind CSS** for styling

The application follows a server-first approach using Next.js App Router, with API routes for Supabase interactions to maintain security best practices. Authentication is handled via Supabase Auth with middleware for route protection and role-based access control.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin panel pages
│   │   └── ...           # Admin-specific components
│   ├── api/              # API routes for server operations
│   │   ├── admin/        # Admin-specific endpoints 
│   │   ├── auth/         # Authentication endpoints
│   │   ├── user/         # User management endpoints
│   │   └── workspace/    # Workspace management endpoints
│   ├── auth/             # Authentication pages (login/signup)
│   ├── dashboard/        # Client dashboard pages
│   ├── verify/           # Email verification pages
│   └── workspace/        # Workspace creation and management
├── components/           # Reusable React components
│   ├── ui/               # ShadCN UI components
│   └── ...               # Application-specific components
├── lib/                  # Utility functions and helpers
├── types/                # TypeScript type definitions
└── utils/                # Utility modules
    └── supabase/         # Supabase client utilities
        ├── admin.ts      # Admin-specific Supabase operations
        ├── client.ts     # Browser client
        ├── index.ts      # Entry point for Supabase clients
        ├── middleware.ts # Middleware for auth protection
        ├── route.ts      # Route handlers for API endpoints
        └── server.ts     # Server-side Supabase client
```

## Authentication System

Authentication is built on Supabase Auth with a custom implementation flow:

1. **Registration Flow**
   - User signs up via `/auth` page (signup tab)
   - Email verification required via `/verify` page
   - Upon verification, redirected to workspace creation

2. **Login Flow**
   - User logs in via `/auth` page (login tab)
   - Redirected based on role and workspace status:
     - Admin users → `/admin`
     - Regular users with workspace → `/dashboard`
     - Regular users without workspace → `/workspace`

3. **Auth Protection**
   - `middleware.ts` handles route protection
   - API routes verified using `createRouteHandlerSupabaseClient`
   - Role-based access control (admin vs client)

4. **Database Schema**
   - `users` table: id, email, role, workspace_id
   - `workspaces` table: id, name, owner_id, subdomain

## Workspace Management

Workspaces are company containers for users:

1. **Creation**
   - New users create workspaces via `/workspace` page
   - Required fields: Company name
   - Optional: Subdomain

2. **Dashboard**
   - Users access their workspace via `/dashboard`
   - Displays workspace information

3. **API Endpoints**
   - `/api/workspace/create` - Create new workspace
   - `/api/workspace/get` - Get workspace details

## Admin Panel

Admin functionality for system management:

1. **Dashboard**
   - Overview of system at `/admin`
   - Managed by `AdminPanel.tsx` component

2. **Features**
   - View/manage workspaces
   - View/manage users
   - Change user roles

3. **API Endpoints**
   - `/api/admin/users` - List/manage users
   - `/api/admin/workspaces` - List/manage workspaces
   - Various debugging endpoints

## UI Components

The application uses ShadCN UI components with custom additions:

1. **Authentication Components**
   - `AuthForm.tsx` - Login/signup form
   - `VerifyPrompt.tsx` - Email verification

2. **Admin Components**
   - `AdminPanel.tsx` - Admin dashboard

3. **Client Components**
   - `DashboardContent.tsx` - Client dashboard
   - `WorkspaceForm.tsx` - Workspace creation form

4. **UI Components**
   - ShadCN components in `src/components/ui/`
   - Custom components like `Spinner.tsx`
   - Theme components: `theme-provider.tsx`, `mode-toggle.tsx`

## API Endpoints

All Supabase interactions occur via API endpoints:

1. **Authentication**
   - `/api/auth/login` - Handle login
   - `/api/auth/signup` - Handle registration
   - `/api/auth/verify` - Verify email
   - `/api/auth/session` - Get current session
   - `/api/auth/logout` - Handle logout

2. **User Management**
   - `/api/user/profile` - Get/update user profile
   - `/api/user/list` - List users (admin only)

3. **Workspace Management**
   - `/api/workspace/create` - Create workspace
   - `/api/workspace/get` - Get workspace details

4. **Admin Operations**
   - `/api/admin/users` - Manage users
   - `/api/admin/workspaces` - Manage workspaces
   - `/api/admin/debug/...` - Debug endpoints
   - `/api/admin/setup` - System setup

## Theming and Dark Mode

The application supports theme switching between light and dark modes:

1. **Implementation**
   - Uses `next-themes` package
   - Theme provider wraps the application in root layout
   - Seamless toggling with `ModeToggle` component

2. **Theme Toggle**
   - Available on all main pages
   - Supports light, dark, and system themes
   - Persistent preference across sessions

3. **CSS Implementation**
   - Tailwind CSS with `darkMode: "class"`
   - CSS variables for theme colors
   - Semantic color classes (background, foreground, etc.)

## Development Guidelines

Follow these guidelines when working on the project:

1. **Naming Conventions**
   - PascalCase for components: `AuthForm.tsx`
   - camelCase for functions/variables: `handleLogin`
   - kebab-case for files: `auth-form.tsx`

2. **Code Organization**
   - Pages in `src/app/`
   - Components in `src/components/`
   - Supabase utilities in `src/utils/supabase/`
   - API routes in `src/app/api/`

3. **API Development**
   - All Supabase interactions via API endpoints
   - Use `createRouteHandlerSupabaseClient`
   - Proper error handling and type safety

4. **Component Development**
   - Server components by default
   - Client components with `'use client'` directive when needed
   - ShadCN UI for base components
   - Mobile-first responsive design

5. **Authentication**
   - Always check authentication in API routes
   - Use middleware for route protection
   - Role-based access control

6. **Styling**
   - Use Tailwind utility classes
   - Use theme variables: `bg-background`, `text-foreground`
   - Support both light and dark modes
   - Responsive design with Tailwind breakpoints

---

This documentation serves as a comprehensive reference for the CostPerDemo platform. As the project evolves, keep this document updated to reflect the current state of the application.
