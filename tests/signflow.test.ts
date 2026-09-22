import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  asSigningConfig,
  extractDateOfLoss,
  extractSignContact,
  phoneToE164,
  pickTemplateId,
  type SignFlowStep,
} from "../src/lib/signflow";

const steps: SignFlowStep[] = [
  { stepKey: "name", inputType: "text", leadField: "name" },
  { stepKey: "phone", inputType: "phone", leadField: "phone" },
  { stepKey: "email", inputType: "email", leadField: "email" },
  { stepKey: "dol", inputType: "date" },
  { stepKey: "sign_retainer", inputType: "sign", signing: { templateIdEn: "12", templateIdEs: "13" } },
];

describe("pickTemplateId", () => {
  it("uses the sign-step IDs over settings defaults", () => {
    assert.equal(
      pickTemplateId("en", { templateIdEn: "12", templateIdEs: "13" }, { templateIdEn: "99", templateIdEs: "98" }),
      "12"
    );
    assert.equal(
      pickTemplateId("es", { templateIdEn: "12", templateIdEs: "13" }, { templateIdEn: "99", templateIdEs: "98" }),
      "13"
    );
  });

  it("falls back to settings when the step IDs are blank", () => {
    assert.equal(
      pickTemplateId("en", { templateIdEn: "", templateIdEs: "" }, { templateIdEn: "99", templateIdEs: "98" }),
      "99"
    );
  });

  it("falls back to English when Spanish is missing", () => {
    assert.equal(
      pickTemplateId("es", { templateIdEn: "12" }, { templateIdEn: "99" }),
      "12"
    );
    assert.equal(pickTemplateId("es", {}, { templateIdEn: "99" }), "99");
  });
});

describe("extractSignContact", () => {
  it("reads name/phone/email from leadField mappings", () => {
    const c = extractSignContact(steps, {
      name: "Jane Doe",
      phone: "5125551212",
      email: "jane@example.com",
    });
    assert.equal(c.clientName, "Jane Doe");
    assert.equal(c.phone, "5125551212");
    assert.equal(c.email, "jane@example.com");
  });

  it("falls back to first phone/email input types", () => {
    const c = extractSignContact(
      [
        { stepKey: "full_name", inputType: "text" },
        { stepKey: "mobile", inputType: "phone" },
        { stepKey: "mail", inputType: "email" },
      ],
      { full_name: "Ada", mobile: "+15125550100", mail: "ada@x.com" }
    );
    assert.equal(c.clientName, "Ada");
    assert.equal(c.phone, "+15125550100");
    assert.equal(c.email, "ada@x.com");
  });
});

describe("extractDateOfLoss", () => {
  it("uses the configured key, else the first date step", () => {
    assert.equal(extractDateOfLoss(steps, { dol: "2026-03-12" }, "dol"), "2026-03-12");
    assert.equal(extractDateOfLoss(steps, { dol: "2026-03-12T15:00:00Z" }, "dol"), "2026-03-12");
    assert.equal(extractDateOfLoss(steps, { dol: "2026-03-12" }, null), "2026-03-12");
    assert.equal(extractDateOfLoss(steps, {}, "dol"), null);
  });
});

describe("phoneToE164", () => {
  it("prefixes 10-digit US numbers", () => {
    assert.equal(phoneToE164("5125551212"), "+15125551212");
    assert.equal(phoneToE164("+15125551212"), "+15125551212");
  });
});

describe("asSigningConfig", () => {
  it("normalises blank strings to null and defaults mode to newtab", () => {
    const s = asSigningConfig({ mode: "embed", url: "  ", templateIdEn: "12" });
    assert.equal(s?.mode, "embed");
    assert.equal(s?.url, null);
    assert.equal(s?.templateIdEn, "12");
    assert.equal(asSigningConfig({}).mode, "newtab");
  });
});
