import assert from "node:assert/strict";
import test from "node:test";
import {
  callRailLandingPageUrl,
  callRailReferrerName,
  callRailReferringUrl,
  type CallRailContext,
} from "../src/lib/callrail";

function ctx(partial: Partial<CallRailContext> = {}): CallRailContext {
  return partial;
}

test("CallRail referrer name is google_paid when a gclid is present", () => {
  assert.equal(
    callRailReferrerName(
      ctx({ gclid: "abc123", referrer: "https://www.google.com/" })
    ),
    "google_paid"
  );
});

test("CallRail referrer name is google_organic for a Google referrer without click ids", () => {
  assert.equal(
    callRailReferrerName(ctx({ referrer: "https://www.google.com/" })),
    "google_organic"
  );
});

test("CallRail referrer name is google_paid for googleadservices referrers", () => {
  assert.equal(
    callRailReferrerName(ctx({ referrer: "https://www.googleadservices.com/" })),
    "google_paid"
  );
});

test("CallRail referrer name uses utm paid medium as google_paid", () => {
  assert.equal(
    callRailReferrerName(ctx({ utmSource: "google", utmMedium: "cpc" })),
    "google_paid"
  );
});

test("CallRail referrer name is direct when there is no referrer or click id", () => {
  assert.equal(callRailReferrerName(ctx({})), "direct");
});

test("CallRail referring_url is document.referrer, not the form page", () => {
  assert.equal(
    callRailReferringUrl(
      ctx({ referrer: "https://www.google.com/" }),
      "https://www.ramosjam.com/contact"
    ),
    "https://www.google.com/"
  );
});

test("CallRail landing page URL gets gclid appended when missing", () => {
  const url = callRailLandingPageUrl(
    ctx({
      landingPage: "https://start.ramosjam.com/",
      gclid: "CjwKCAjw",
    }),
    "https://fallback.example/"
  );
  assert.equal(new URL(url).searchParams.get("gclid"), "CjwKCAjw");
  assert.equal(new URL(url).origin, "https://start.ramosjam.com");
});

test("CallRail landing page URL does not duplicate an existing gclid", () => {
  const url = callRailLandingPageUrl(
    ctx({
      landingPage: "https://start.ramosjam.com/?gclid=already",
      gclid: "other",
    }),
    "https://fallback.example/"
  );
  assert.equal(new URL(url).searchParams.get("gclid"), "already");
});
