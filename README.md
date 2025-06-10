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
