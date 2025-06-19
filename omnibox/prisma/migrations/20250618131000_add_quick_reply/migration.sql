-- CreateTable
CREATE TABLE "QuickReply" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "QuickReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuickReply" ADD CONSTRAINT "QuickReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
