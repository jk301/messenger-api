-- AlterTable
ALTER TABLE "message" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileURL" TEXT,
ALTER COLUMN "text" DROP NOT NULL;
