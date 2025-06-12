/*
  Warnings:

  - A unique constraint covering the columns `[phone,userId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "direction" SET DEFAULT 'OUT',
ALTER COLUMN "sentAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TwilioNumber" (
    "phone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwilioNumber_pkey" PRIMARY KEY ("phone")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_phone_userId_key" ON "Contact"("phone", "userId");

-- CreateIndex
CREATE INDEX "Message_contactId_idx" ON "Message"("contactId");
