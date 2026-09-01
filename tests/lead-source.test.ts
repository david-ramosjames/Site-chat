import assert from "node:assert/strict";
import test from "node:test";
import { leadSourceLabel } from "../src/lib/lead-source";

test("gclid shows as Google Ads even without UTM", () => {
  assert.equal(
    leadSourceLabel({ gclid: "abc", referrer: "https://www.google.com/" }),
    "Google Ads"
  );
});

test("google.com referrer without click id is Google Organic", () => {
  assert.equal(
    leadSourceLabel({ referrer: "https://www.google.com/" }),
    "Google Organic"
  );
});

test("UTM google/cpc plus campaign appends the campaign", () => {
  assert.equal(
    leadSourceLabel({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "south-padre",
    }),
    "Google Ads · south-padre"
  );
});

test("custom UTM source is used when there is no click id", () => {
  assert.equal(
    leadSourceLabel({ utmSource: "newsletter", utmMedium: "email" }),
    "newsletter"
  );
});

test("no signals is Direct", () => {
  assert.equal(leadSourceLabel({}), "Direct");
});
