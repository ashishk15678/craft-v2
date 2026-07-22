# Craft seed data

Run the Prisma migrations first, then load the demo organization, role accounts, challenges, stages, enrollment, benchmark, review request, and audit records:

```bash
npx prisma db execute --file seeds/platform.sql
```

The seed records intentionally do not include authentication passwords or sessions. Register normally with any seed email if you need a local sign-in account, or use the records as fixtures for tests and admin tooling.
