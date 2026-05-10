import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadWhere, leadCsv } from "../src/lib/lead-filters";
import { publicFeatureToggles } from "../src/lib/widget-config";

test("public widget feature config never includes server-side secrets", () => {
  const features = publicFeatureToggles({
    showProgress: true,
    allowFileUpload: false,
    collectUtm: true,
    collectPageUrl: true,
    collectReferrer: true,
    enableAiSummary: true,
    enableLeadScoring: true,
    llmProvider: "openai",
    llmModel: "gpt-4o-mini",
    llmApiKey: "sk-live-secret",
    enableAfterHours: false,
    enableSmsAlerts: true,
    enableEmailAlerts: true,
    enableSlackAlerts: true,
    enableGoogleSheetSync: true,
    enableCrmWebhook: true,
    enableMedia: true,
    enableFallbackForm: true,
    enableSpamProtection: true,
  } as never);

  const serialized = JSON.stringify(features);
  assert.equal(serialized.includes("llmApiKey"), false);
  assert.equal(serialized.includes("sk-live-secret"), false);
  assert.equal(serialized.includes("enableAiSummary"), false);
  assert.equal(serialized.includes("enableLeadScoring"), false);
});

test("lead filter builder scopes queries and normalizes date/status filters", () => {
  const where = buildLeadWhere({
    clientId: "client_123",
    q: "injury",
    status: "booked",
    qualified: "yes",
    referral: "maybe",
    start: "2026-05-01",
    end: "2026-05-09",
  });

  assert.equal(where.clientId, "client_123");
  assert.equal(where.status, "booked");
  assert.equal(where.qualified, "yes");
  assert.equal("referral" in where, false);
  assert.ok(where.OR);
  assert.deepEqual(where.createdAt, {
    gte: new Date("2026-05-01T00:00:00.000Z"),
    lte: new Date("2026-05-09T23:59:59.999Z"),
  });
});

test("lead CSV export escapes commas, quotes, and line breaks", () => {
  const csv = leadCsv([
    {
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
      name: 'Jane "JJ" Ramos',
      phone: "+15125550100",
      email: "jane@example.com",
      serviceRequested: "Truck, injury",
      qualified: "yes",
      referral: "no",
      leadScore: 91,
      status: "new",
      sourceUrl: "https://example.com/intake",
      utmSource: "google",
      utmCampaign: "spring\ncampaign",
      aiSummary: "High intent lead.",
    },
  ] as never);

  assert.match(csv, /"Jane ""JJ"" Ramos"/);
  assert.match(csv, /"Truck, injury"/);
  assert.match(csv, /"spring\ncampaign"/);
});
