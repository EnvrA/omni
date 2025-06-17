# Omni

This repository uses Prisma with a PostgreSQL database.

## Setup database

1. Create a PostgreSQL database and set the `DATABASE_URL` environment variable.
2. Generate the schema in your database:
   ```sh
   npx prisma db push
   ```
3. Seed sample data:
   ```sh
   npx ts-node prisma/seed.ts
   ```

After these steps the `Contact` table and the rest of the schema will exist and you can run the application normally.

Whenever the Prisma schema changes (for example the new optional contact fields introduced in this update) run:
```sh
npx prisma db push
npx prisma generate
```
to update your database and regenerate the Prisma client.

If you see errors like `The column `Contact.company` does not exist` when running
the web app, your database has not been updated. Ensure the `DATABASE_URL`
environment variable is set and run `npx prisma db push` from the `omnibox`
directory to apply the latest schema.

## Workflow



Write clear commit messages that briefly describe what your change does. For example:

```
Add dashboard layout and pages using shadcn-ui
```

Keeping messages concise makes the project history easier to understand.
