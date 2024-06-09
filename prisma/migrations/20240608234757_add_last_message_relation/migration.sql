/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "messageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chats_messageId_key" ON "chats"("messageId");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
