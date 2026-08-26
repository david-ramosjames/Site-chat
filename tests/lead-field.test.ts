import assert from "node:assert/strict";
import test from "node:test";
import { resolveLeadColumnValue } from "../src/lib/lead-field";

test("multiple-choice option maps to yes", () => {
  assert.equal(
    resolveLeadColumnValue("opt_1", {
      leadFieldByOption: { opt_1: "yes", opt_2: "yes", opt_3: "no" },
    }),
    "yes"
  );
});

test("multiple-choice option maps to no", () => {
  assert.equal(
    resolveLeadColumnValue("opt_3", {
      leadFieldByOption: { opt_1: "yes", opt_2: "yes", opt_3: "no" },
    }),
    "no"
  );
});

test("empty-string override leaves the column blank", () => {
  assert.equal(
    resolveLeadColumnValue("opt_3", { leadFieldByOption: { opt_3: "" } }),
    undefined
  );
});

test("unmapped multiple-choice value falls through to the raw answer", () => {
  assert.equal(
    resolveLeadColumnValue("opt_1", { leadFieldByOption: { opt_2: "yes" } }),
    "opt_1"
  );
});

test("yes/no invert still works when byOption is absent", () => {
  assert.equal(
    resolveLeadColumnValue("no", { leadFieldOnYes: "no", leadFieldOnNo: "yes" }),
    "yes"
  );
  assert.equal(
    resolveLeadColumnValue("yes", { leadFieldOnYes: "no", leadFieldOnNo: "yes" }),
    "no"
  );
});

test("byOption wins over yes/no overrides for the same raw value", () => {
  assert.equal(
    resolveLeadColumnValue("yes", {
      leadFieldOnYes: "no",
      leadFieldByOption: { yes: "yes" },
    }),
    "yes"
  );
});
