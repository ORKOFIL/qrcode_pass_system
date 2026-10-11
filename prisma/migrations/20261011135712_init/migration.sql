/*
  Warnings:

  - Added the required column `accessToken` to the `EventStaff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `EventStaff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwwordHash` to the `EventStaff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accessToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventStaff" ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "passwwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessToken" TEXT NOT NULL;
