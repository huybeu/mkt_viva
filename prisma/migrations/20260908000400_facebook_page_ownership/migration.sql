DROP INDEX IF EXISTS "FacebookPage_pageId_key";
ALTER TABLE "FacebookPage" ADD COLUMN "ownerId" TEXT;
UPDATE "FacebookPage" SET "ownerId" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" LIMIT 1) WHERE "ownerId" IS NULL;
CREATE UNIQUE INDEX "FacebookPage_ownerId_pageId_key" ON "FacebookPage"("ownerId", "pageId");
CREATE INDEX "FacebookPage_ownerId_idx" ON "FacebookPage"("ownerId");
ALTER TABLE "FacebookPage" ADD CONSTRAINT "FacebookPage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
