import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formOf, indexGraph } from "../graph";
import type { FormPrefill } from "../prefill/state";
import { MOCK_FIELDS, mockGraph, NODE } from "../test/builders";
import { PrefillPanel } from "./PrefillPanel";

const index = indexGraph(mockGraph);
const formD = index.nodesById.get(NODE["Form D"]!)!;

function renderPanel(prefill: FormPrefill = { enabled: true, mappings: {} }) {
  const handlers = { onToggle: vi.fn(), onPick: vi.fn(), onClear: vi.fn() };
  render(
    <PrefillPanel
      node={formD}
      form={formOf(index, formD)!}
      prefill={prefill}
      describe={(reference) => `described ${reference.kind}`}
      {...handlers}
    />,
  );
  return handlers;
}

describe("PrefillPanel", () => {
  it("shows the reference header with the switch and one row per prefillable field", () => {
    renderPanel();
    const panel = screen.getByRole("region", { name: "Prefill for Form D" });
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent("Prefill");
    expect(within(panel).getByText("Prefill fields for this form")).toBeVisible();
    expect(
      within(panel).getByRole("switch", { name: "Prefill fields for Form D" }),
    ).toBeChecked();
    expect(
      within(panel)
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual(MOCK_FIELDS.filter((field) => field !== "button"));
  });

  it("renders mapped rows with the described label and clears them", async () => {
    const { onClear, onPick } = renderPanel({
      enabled: true,
      mappings: {
        email: { kind: "form_field", nodeId: NODE["Form A"]!, field: "email" },
      },
    });

    expect(
      screen.getByRole("button", { name: "email: described form_field" }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Clear prefill for email" }),
    );
    expect(onClear).toHaveBeenCalledExactlyOnceWith("email");

    await userEvent.click(
      screen.getByRole("button", { name: "name, no prefill configured" }),
    );
    expect(onPick).toHaveBeenCalledExactlyOnceWith("name");
  });

  it("reports the switch and disables the rows while prefill is off", async () => {
    const { onToggle } = renderPanel({ enabled: false, mappings: {} });

    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "email, no prefill configured" }),
    ).toBeDisabled();

    await userEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(true);
  });
});
