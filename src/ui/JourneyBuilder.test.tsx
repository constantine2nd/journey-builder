import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { toExpression } from "../prefill/expressions";
import { resolveSources } from "../prefill/config";
import { buildGraph, mockGraph } from "../test/builders";
import { JourneyBuilder } from "./JourneyBuilder";

const sources = resolveSources(undefined);

describe("JourneyBuilder", () => {
  it("lists the forms and asks to select one", () => {
    render(<JourneyBuilder graph={mockGraph} sources={sources} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Onboard Customer 0",
    );
    expect(screen.getByRole("navigation", { name: "Forms" })).toBeVisible();
    expect(screen.getByText("Select a form to configure its prefill.")).toBeVisible();
  });

  it("opens the selected form's panel and keeps its switch state per form", async () => {
    render(<JourneyBuilder graph={mockGraph} sources={sources} />);

    await userEvent.click(screen.getByRole("button", { name: "Form D" }));
    const panel = screen.getByRole("region", { name: "Prefill for Form D" });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(7);

    await userEvent.click(within(panel).getByRole("switch"));
    expect(within(panel).getByRole("switch")).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Form E" }));
    expect(
      within(screen.getByRole("region", { name: "Prefill for Form E" })).getByRole(
        "switch",
      ),
    ).toBeChecked();
  });

  it("starts from the mappings saved in the graph and can clear them", async () => {
    const graph = buildGraph([
      { id: "a", name: "Form A" },
      {
        id: "d",
        name: "Form D",
        prerequisites: ["a"],
        input_mapping: {
          email: toExpression({ kind: "form_field", nodeId: "a", field: "email" }),
        },
      },
    ]);
    render(<JourneyBuilder graph={graph} sources={sources} />);

    await userEvent.click(screen.getByRole("button", { name: "Form D" }));
    expect(screen.getByRole("button", { name: "email: Form A.email" })).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Clear prefill for email" }),
    );
    expect(
      screen.getByRole("button", { name: "email, no prefill configured" }),
    ).toBeVisible();
  });
});
