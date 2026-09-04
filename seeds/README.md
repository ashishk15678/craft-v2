# Craft seed data

Run the Prisma seed command to populate the database with the demo organization, role accounts, challenges, stages, enrollment, benchmark, review request, and audit records:

## Interactive practice arena

Apply the migration and seed the company-style practice challenges with:

```bash
npm run db:setup:practice
```

This creates twelve interactive, solution-backed challenges across logic, systems, coding, debugging, communication, architecture, release, product, and algorithms. The practice data is available to every registered user; XP and reward profiles are created automatically on first use.

```bash
npx prisma db seed
```

All seed users are created with the password: `password123`.

You can sign in with:

- `avery@craft.local` (SUPERADMIN)
- `jordan@craft.local` (ADMIN)
- `mira@craft.local` (TEACHER)
- `dev@craft.local` (STUDENT)
