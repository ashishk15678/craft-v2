Completed a full scan of the entire codebase: all app pages/layouts/API routes, all components, lib, contexts, rbac, prisma schema, config files, and .env keys. No middleware.ts exists. Everything was found and read in 3 turns. - app/layout.tsx, app/page.tsx, app/globals.css - (auth) group: layout, login/page, register/page - (protected) group: layout, and 10 dashboard sub-pages (dashboard, admin, assistant, community, learn, org-manager, platform, portfolio, settings, teach, tracks) - API routes: /api/auth/[...all], /api/student/assistant, /api/student/progress, /api/workspace/[scope] - All 12 components including full ui/dropdown-menu.tsx - lib: auth.ts, auth-client.ts, db.ts, utils.ts, student-session.ts, workspace-auth.ts - contexts/org-context.tsx - rbac/permissions.ts (rbac/index.ts is empty) - prisma/schema.prisma (full schema) - package.json, next.config.ts, tsconfig.json, components.json, prisma.config.ts - .env keys - CLAUDE.md (just references AGENTS.md), README.md (test user credentials) - middleware.ts (does not exist) - tailwind.config.* (Tailwind 4 is configured via globals.css @import, no separate config file) - auth.config.ts (not present; auth config is inline in lib/auth.ts) - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not in .env (only DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL)
<relevant_files> prisma/schema.prisma lib/auth.ts lib/workspace-auth.ts app/api/workspace/[scope]/route.ts app/(protected)/layout.tsx contexts/org-context.tsx rbac/permissions.ts components/role-workspaces.tsx components/student-sidebar.tsx app/(protected)/dashboard/page.tsx </relevant_files>

<relevant_ranges> </relevant_ranges>

<relevant_file_ranking> <ranked_file rank="1"> prisma/schema.prisma Full data model: all 17 models including User, Challenge, ChallengeStage, Enrollment, Submission, Benchmark, PeerReview, Organization, OrganizationMember, TeamTrack, AuditLog, StudentProgress, Courses, Lessons + enums ROLE, ChallengeStatus, ChallengeAccess, ReviewStatus </ranked_file> <ranked_file rank="2"> app/api/workspace/[scope]/route.ts Single large API route handling 4 workspace scopes (creator, organization, platform, org-manager) with full CRUD — the core business logic of the app </ranked_file> <ranked_file rank="3"> rbac/permissions.ts Defines all AppRole, Permission, OrgRole types and the full role-permission matrix used throughout the app </ranked_file> <ranked_file rank="4"> contexts/org-context.tsx OrgProvider + useOrg context: the client-side org/role state machine that drives most conditional rendering </ranked_file> <ranked_file rank="5"> components/role-workspaces.tsx All 4 role-specific workspace UIs (TeacherWorkspace, AdminWorkspace, SuperadminWorkspace, OrgManagerWorkspace) + RoleGateway — largest component file </ranked_file> </relevant_file_ranking>

Full Codebase Summary
What the app does
Craft-v2 is a coding-challenge learning platform. Users solve multi-stage, Docker-tested engineering challenges (build your own KV store, vector DB, Docker runtime, etc.) locally via a git workflow. The app tracks progress, runs benchmarks, supports peer review, and has a creator/teacher side for authoring new challenges. Organizations can be created for internal onboarding tracks (cohort learning).

Auth system
better-auth (^1.6.23) with the username plugin. Supports email+password and GitHub OAuth. Auth handler is at /api/auth/[...all] via toNextJsHandler. Session is fetched server-side via auth.api.getSession({ headers }). No middleware — route protection is done manually in layouts/pages with redirect().

Database
SQLite via better-sqlite3 + Prisma @prisma/adapter-better-sqlite3
Prisma client output: app/generated/prisma/
DB file: file:./file.db (local, committed to workspace)
Data models (schema.prisma)
Model	Key fields
User	id, name, email, username, role (ROLE enum), org memberships
Session / Account / Verification	better-auth managed
Challenge	slug, title, track, status, access, priceCents, languages, stages, enrollments
ChallengeStage	position, title, brief, hint, testCommand
Enrollment	userId, challengeId, language, currentStage
Submission	userId, stageId, commitSha, testOutput, passed
Benchmark	requestsPerSecond, p99LatencyMs, memoryMb
PeerReview	enrollmentId, reviewerId, status, notes
Organization	name, slug, ownerId, members, teamTracks, challenges
OrganizationMember	userId, organizationId, role (string: ORG_OWNER/ORG_ADMIN/INSTRUCTOR/LEARNER)
TeamTrack	organizationId, challengeId, title, description
AuditLog	actorId, action, target, metadata
StudentProgress	userId, activeChallenge, language, currentStage, totalStages, hintsUsed
Courses / Lessons	basic course+lesson structure (minimally used)
Enums: ROLE (SUPERADMIN, ADMIN, USER, ORG_MANAGER, EDITOR, TEACHER, STUDENT), ChallengeStatus (DRAFT/REVIEW/PUBLISHED/ARCHIVED), ChallengeAccess (OPEN/PAID/PRIVATE), ReviewStatus (REQUESTED/ASSIGNED/APPROVED/CHANGES_REQUESTED)

Role system (two-layer)
Global platform role (User.role): ORG_MANAGER > SUPERADMIN > ADMIN > EDITOR > TEACHER > STUDENT
Per-org role (OrganizationMember.role string): ORG_OWNER > ORG_ADMIN > INSTRUCTOR > LEARNER
Permission matrix in 
permissions.ts
. Auth helpers in 
workspace-auth.ts
 (requireRole, requireRoleOrOrgManager). Client-side context in 
org-context.tsx
 (OrgProvider, useOrg).

UI library
shadcn/ui (style: aria-nova) — components built on react-aria-components
Only one shadcn component installed: 
dropdown-menu.tsx
Tailwind CSS v4 (configured entirely via 
globals.css
 @import "tailwindcss", no tailwind.config.*)
lucide-react icons + @hugeicons/react (used for dark mode toggle)
framer-motion (used in register page step transitions)
next-themes for dark/light theme
Design system: monospace/uppercase gaming aesthetic, indigo accent color, oklch color tokens
Page structure

/                          → app/page.tsx (empty div)
/login                     → (auth)/login/page.tsx — better-auth client signIn
/register                  → (auth)/register/page.tsx — 2-step form, better-auth signUp

/dashboard                 → overview: active challenge, stats, tracks, role workspaces
/dashboard/learn           → StudentProgress component + workflow steps
/dashboard/tracks          → static catalog of 4 tracks × 3 projects each
/dashboard/assistant       → DebuggingCompanion (POST /api/student/assistant)
/dashboard/community       → leaderboard (static) + peer review request
/dashboard/portfolio       → verified portfolio card (static/hardcoded)
/dashboard/settings        → shows signed-in email
/dashboard/teach           → TeacherWorkspace (client, checks org role)
/dashboard/admin           → AdminWorkspace (org creation/management)
/dashboard/platform        → SuperadminWorkspace (challenge moderation, user governance)
/dashboard/org-manager     → OrgManagerWorkspace (full platform control)
Protected layout (app/(protected)/layout.tsx): checks session, redirects to /login, renders StudentSidebar.

API routes
Route	Methods	Auth
/api/auth/[...all]	GET, POST	better-auth handler
/api/student/progress	GET, PATCH	any authenticated user
/api/student/assistant	POST	any authenticated user
/api/workspace/creator	GET, POST	TEACHER/EDITOR/ADMIN/SUPERADMIN/ORG_MANAGER
/api/workspace/organization	GET, POST	all authenticated roles
/api/workspace/platform	GET, POST	SUPERADMIN/ORG_MANAGER
/api/workspace/org-manager	GET, POST	ORG_MANAGER only
Key files for refactor

schema.prisma
 — full data model

auth.ts
 + 
auth-client.ts
 — auth config

workspace-auth.ts
 — role enforcement helpers

permissions.ts
 — permission matrix

org-context.tsx
 — client org state

org-context-bridge.tsx
 — server→client bridge for org data
app/api/workspace/[scope]/route.ts — all business logic mutations

role-workspaces.tsx
 — all 4 role workspace UIs (~550 lines)

student-sidebar.tsx
 — nav with dynamic role-based items
.env keys (no values)
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
(GitHub OAuth keys referenced in 
auth.ts
 but not in .env: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
No middleware.ts — protection is layout-level only.
[ {"path": "/home/ashish/Desktop/projects/craft-v2/prisma/schema.prisma"}, {"path": "/home/ashish/Desktop/projects/craft-v2/package.json"}, {"path": "/home/ashish/Desktop/projects/craft-v2/lib/auth.ts"}, {"path": "/home/ashish/Desktop/projects/craft-v2/lib/workspace-auth.ts"}, {"path": "/home/ashish/Desktop/projects/craft-v2/rbac/permissions.ts"}, {"path": "/home/ashish/Desktop/projects/craft-v2/contexts/org-context.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/components/org-context-bridge.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/app/api/workspace/[scope]/route.ts"}, {"path": "/home/ashish/Desktop/projects/craft-v2/components/role-workspaces.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/components/student-sidebar.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/app/(protected)/layout.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/app/(protected)/dashboard/page.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/app/layout.tsx"}, {"path": "/home/ashish/Desktop/projects/craft-v2/next.config.ts"}, {"path": "/home/ashish/Desktop/projects/craft-v2/tsconfig.json"}, {"path": "/home/ashish/Desktop/projects/craft-v2/components.json"} ]