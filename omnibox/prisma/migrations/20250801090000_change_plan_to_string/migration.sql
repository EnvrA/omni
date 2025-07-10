ALTER TABLE "StripeCustomer" ALTER COLUMN "plan" TYPE TEXT USING "plan"::text;
DROP TYPE IF EXISTS "Plan";
