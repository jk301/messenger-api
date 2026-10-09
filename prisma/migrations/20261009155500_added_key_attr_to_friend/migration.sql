/*
  Warnings:

  - A unique constraint covering the columns `[pairKey]` on the table `Friend` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pairKey` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friend" ADD COLUMN     "pairKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Friend_pairKey_key" ON "Friend"("pairKey");
