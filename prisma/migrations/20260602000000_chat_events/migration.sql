CREATE TABLE "ChatEvent" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT,
  "sourceUrl" TEXT,
  "referrer" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatEvent_clientId_createdAt_idx" ON "ChatEvent"("clientId", "createdAt");
CREATE INDEX "ChatEvent_clientId_type_idx" ON "ChatEvent"("clientId", "type");
CREATE INDEX "ChatEvent_clientId_sessionId_idx" ON "ChatEvent"("clientId", "sessionId");

ALTER TABLE "ChatEvent"
  ADD CONSTRAINT "ChatEvent_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
