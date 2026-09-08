CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY_TO_PUBLISH', 'PUBLISHED', 'PAUSED');
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Post" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL DEFAULT '', "scheduledAt" TIMESTAMP(3),
  "status" "PostStatus" NOT NULL DEFAULT 'DRAFT', "assigneeId" TEXT, "externalImageUrl" TEXT, "publishedUrl" TEXT,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PostImage" (
  "id" TEXT NOT NULL, "postId" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "fileSize" INTEGER NOT NULL, "width" INTEGER, "height" INTEGER, "url" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0, "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Post_scheduledAt_idx" ON "Post"("scheduledAt");
CREATE INDEX "Post_status_idx" ON "Post"("status");
CREATE INDEX "Post_assigneeId_idx" ON "Post"("assigneeId");
CREATE UNIQUE INDEX "PostImage_storageKey_key" ON "PostImage"("storageKey");
CREATE INDEX "PostImage_postId_position_idx" ON "PostImage"("postId", "position");
ALTER TABLE "Post" ADD CONSTRAINT "Post_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
