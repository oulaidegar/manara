# Radar

Radar is a web application for civil-society organizations, independent media, NGOs, advocacy organizations, research organizations, and other public-interest groups.

Radar helps an organization understand what work it produced, who that work reached, how audiences responded, which communications practices appear to work, where its work was cited or referenced, what real-world changes occurred, and what evidence exists that the organization contributed to those changes.

## Technology Stack

- **Frontend:** Next.js 16 (App Router), TypeScript (strict), React 19, Tailwind CSS v4, Lucide icons
- **Backend:** Convex (database, functions, realtime, file storage)
- **Authentication:** Clerk
- **AI:** OpenAI Responses API (future)
- **Hosting:** Vercel + Convex managed backend

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Environment Variables

Create a `.env.local` file:

```env
# Convex
CONVEX_DEPLOYMENT=<your-deployment>
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/~/select-org
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/~/select-org
```

### Development

```bash
# Install dependencies
npm install

# Start Convex backend (in one terminal)
npx convex dev

# Start Next.js dev server (in another terminal)
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
app/
  (public)/          # Landing page
  (auth)/            # Sign-in / Sign-up (Clerk)
  (app)/
    ~/select-org/    # Organization selector
    [organizationSlug]/
      page.tsx       # Home / briefing
      analyze/       # Analytics
      initiatives/   # Initiatives management
      impact/        # Impact tracking
      reports/       # Report generation
      settings/      # Organization settings

components/
  layout/            # Sidebar, header

convex/
  schema.ts          # Database schema
  lib/               # Auth helpers, audit, errors
  users.ts           # User management
  organizations/     # Organization CRUD + members

tests/               # Unit and integration tests
```

## Authorization Model

Radar uses role-based access control with five roles:

| Role | Capabilities |
|------|-------------|
| **Owner** | Full control including billing and deletion |
| **Admin** | Manage members, integrations, settings, data |
| **Analyst** | Analyze data, create initiatives/outcomes/reports |
| **Contributor** | Create/edit initiatives, add outcomes/evidence |
| **Viewer** | Read-only access |

Every Convex function accessing organization data verifies authentication, user existence, organization membership, and role permissions.

## Multi-Tenancy

Every tenant-owned record has an explicit `organizationId`. Authorization is verified server-side on every request — never inferred from knowing a record ID.

## License

Proprietary. All rights reserved.
