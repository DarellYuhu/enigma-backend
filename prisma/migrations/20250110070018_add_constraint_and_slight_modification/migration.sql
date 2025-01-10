/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `PageActivity` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PageActivity" ALTER COLUMN "date" SET DATA TYPE DATE;

-- CreateIndex
CREATE UNIQUE INDEX "PageActivity_date_key" ON "PageActivity"("date");
