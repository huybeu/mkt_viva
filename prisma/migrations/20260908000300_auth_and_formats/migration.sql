ALTER TABLE "Post" ADD COLUMN "facebookFormat" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'MEMBER';
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "createdAt", "updatedAt")
VALUES ('admin', 'Administrator', 'admin', 'e8841ae322a7fc03b3f80a6a5feba7f8:81ceb280a4cc9794e308cf20b9085ee699fec75bb1d7145246f3efbaa0522273', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("username") DO NOTHING;
