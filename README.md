# Omni

This repository uses Prisma with a PostgreSQL database.

## Setup database

1. Create a PostgreSQL database and set the `DATABASE_URL` environment variable.
2. Apply migrations and generate the Prisma client:
   ```sh
   npx prisma migrate deploy --schema ./omnibox/prisma/schema.prisma
   npx prisma generate --schema ./omnibox/prisma/schema.prisma
   ```
   For local development you can run `npx prisma migrate dev --schema ./omnibox/prisma/schema.prisma` instead of `migrate deploy`.
3. Seed sample data:
   ```sh
   npx ts-node omnibox/prisma/seed.ts
   ```

After these steps the `Contact` table and the rest of the schema will exist and you can run the application normally.

Whenever the Prisma schema changes run:
```sh
npx prisma migrate dev --schema ./omnibox/prisma/schema.prisma
npx prisma generate --schema ./omnibox/prisma/schema.prisma
```
to update your database and regenerate the Prisma client.

## Environment variables

Before running the application you must provide several variables so the server
can connect to external services:

- `DATABASE_URL` – PostgreSQL connection string used by Prisma
- `SENDGRID_API_KEY` – API key for sending email based sign-in links
- `EMAIL_FROM` – address emails are sent from
- `ADMIN_EMAIL` – email allowed to access admin endpoints

Set these variables in your Vercel project or a local `.env` file.

## Workflow

Write clear commit messages that briefly describe what your change does. For example:

```
Add dashboard layout and pages using shadcn-ui
```

Keeping messages concise makes the project history easier to understand.
