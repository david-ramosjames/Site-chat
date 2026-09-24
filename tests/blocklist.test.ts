import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  contactBlockKeys,
  matchesBlocklist,
  normalizeBlockValue,
} from "../src/lib/blocklist";

describe("normalizeBlockValue", () => {
  it("rejects blank and too-short values", () => {
    assert.equal(normalizeBlockValue("name", "  "), null);
    assert.equal(normalizeBlockValue("name", "J"), null);
    assert.equal(normalizeBlockValue("email", "not-an-email"), null);
    assert.equal(normalizeBlockValue("phone", "123"), null);
  });

  it("normalizes names case-insensitively and collapses spaces", () => {
    assert.equal(normalizeBlockValue("name", "  John   Smith "), "john smith");
  });

  it("lowercases emails", () => {
    assert.equal(normalizeBlockValue("email", "  Foo@Bar.COM "), "foo@bar.com");
  });

  it("matches US phones across formats via last 10 digits", () => {
    assert.equal(normalizeBlockValue("phone", "(512) 555-0100"), "5125550100");
    assert.equal(normalizeBlockValue("phone", "+1 512 555 0100"), "5125550100");
    assert.equal(normalizeBlockValue("phone", "15125550100"), "5125550100");
  });
});

describe("matchesBlocklist", () => {
  const entries = [
    { kind: "name", normalized: "spam person" },
    { kind: "phone", normalized: "5125550100" },
    { kind: "email", normalized: "spam@example.com" },
  ];

  it("does not match empty contact or empty list", () => {
    assert.equal(matchesBlocklist(entries, {}), false);
    assert.equal(matchesBlocklist([], { name: "Spam Person" }), false);
  });

  it("matches any one of name, phone, or email", () => {
    assert.equal(matchesBlocklist(entries, { name: "Spam Person" }), true);
    assert.equal(matchesBlocklist(entries, { phone: "512-555-0100" }), true);
    assert.equal(matchesBlocklist(entries, { email: "SPAM@example.com" }), true);
  });

  it("leaves unrelated visitors alone", () => {
    assert.equal(
      matchesBlocklist(entries, {
        name: "Ada Lovelace",
        phone: "512-555-9999",
        email: "ada@example.com",
      }),
      false
    );
  });
});

describe("contactBlockKeys", () => {
  it("only emits keys that normalize", () => {
    const keys = contactBlockKeys({
      name: "Ada",
      phone: "x",
      email: "ada@example.com",
    });
    assert.deepEqual(keys, [
      { kind: "name", normalized: "ada" },
      { kind: "email", normalized: "ada@example.com" },
    ]);
  });
});
