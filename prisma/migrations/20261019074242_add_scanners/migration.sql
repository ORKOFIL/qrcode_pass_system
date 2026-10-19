/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `EventStaff` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventStaff_name_key" ON "EventStaff"("name");
