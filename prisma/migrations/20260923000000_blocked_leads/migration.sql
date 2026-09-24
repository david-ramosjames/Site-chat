-- Manual spam blocklist: drop submissions that match a name, phone, or email.

CREATE TABLE "BlockedLead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlockedLead_clientId_kind_normalized_key" ON "BlockedLead"("clientId", "kind", "normalized");
CREATE INDEX "BlockedLead_clientId_kind_idx" ON "BlockedLead"("clientId", "kind");

ALTER TABLE "BlockedLead" ADD CONSTRAINT "BlockedLead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
