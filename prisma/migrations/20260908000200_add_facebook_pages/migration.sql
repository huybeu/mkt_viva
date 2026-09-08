CREATE TABLE "FacebookPage" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FacebookPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FacebookPage_pageId_key" ON "FacebookPage"("pageId");
