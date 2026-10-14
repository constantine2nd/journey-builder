import { describe, expect, it } from "vitest";
import { MOCK_FIELDS, mockGraph } from "../test/builders";
import { fieldNames, prefillableFields } from "./fields";

const form = mockGraph.forms[0]!;

describe("fieldNames", () => {
  it("lists every field in schema order", () => {
    expect(fieldNames(form)).toEqual([...MOCK_FIELDS]);
  });
});

describe("prefillableFields", () => {
  it("leaves out buttons", () => {
    expect(prefillableFields(form)).toEqual(MOCK_FIELDS.filter((f) => f !== "button"));
  });
});
