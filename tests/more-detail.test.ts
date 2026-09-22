import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MORE_DETAIL_KEY,
  MORE_DETAIL_LABEL,
  answerFieldLabel,
  appendMoreDetail,
} from "../src/lib/more-detail";

describe("appendMoreDetail", () => {
  it("rejects blank extra text", () => {
    assert.equal(appendMoreDetail({}, "   "), null);
    assert.equal(appendMoreDetail({ name: "Ada" }, ""), null);
  });

  it("writes the first note onto more_detail", () => {
    const r = appendMoreDetail({ name: "Ada" }, "  rear-ended on I-35  ");
    assert.ok(r);
    assert.equal(r.appended, "rear-ended on I-35");
    assert.equal(r.answers.name, "Ada");
    assert.equal(r.answers[MORE_DETAIL_KEY], "rear-ended on I-35");
  });

  it("appends later notes instead of overwriting", () => {
    const r = appendMoreDetail({ [MORE_DETAIL_KEY]: "first" }, "second");
    assert.ok(r);
    assert.equal(r.answers[MORE_DETAIL_KEY], "first\n\nsecond");
  });
});

describe("answerFieldLabel", () => {
  it("labels more_detail as More details", () => {
    assert.equal(answerFieldLabel(MORE_DETAIL_KEY), MORE_DETAIL_LABEL);
    assert.equal(answerFieldLabel("phone"), "phone");
  });
});
