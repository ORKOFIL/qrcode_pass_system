-- DropForeignKey
ALTER TABLE "ScanLog" DROP CONSTRAINT "ScanLog_ticketId_fkey";

-- DropIndex
DROP INDEX "ScanLog_ticketId_key";

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
