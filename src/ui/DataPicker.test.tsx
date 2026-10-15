import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { indexGraph } from "../graph";
import { resolveSources } from "../prefill/config";
import type { GroupOrder } from "../prefill/groupOrder";
import type { SourceContext } from "../prefill/source";
import { mockGraph, NODE } from "../test/builders";
import { DataPicker } from "./DataPicker";

const index = indexGraph(mockGraph);
const context: SourceContext = {
  index,
  targetNode: index.nodesById.get(NODE["Form D"]!)!,
};
const BRIEF_SOURCES = ["direct_dependencies", "transitive_dependencies", "global_data"];

function renderPicker(groupOrder?: GroupOrder) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(
    <DataPicker
      field="email"
      sources={resolveSources(BRIEF_SOURCES)}
      context={context}
      groupOrder={groupOrder}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { onSelect, onClose };
}

const groupLabels = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .slice(1)
    .map((h) => h.textContent);
const toggle = (name: string) => screen.getByRole("button", { name });
const select = () => screen.getByRole("button", { name: "Select" });
const detail = () => screen.getByRole("complementary", { name: "Selected element" });
/** The value shown for a term in the detail pane. */
const definition = (term: string) =>
  within(detail()).getByText(term).nextElementSibling?.textContent;

describe("DataPicker", () => {
  it("is the reference dialog: title, Available data, search, groups alphabetical and collapsed", () => {
    renderPicker();
    expect(
      screen.getByRole("dialog", { name: "Select data element to map" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "Available data" }),
    ).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveFocus();
    expect(groupLabels()).toEqual([
      "Action Properties",
      "Client Organisation Properties",
      "Form Atransitive",
      "Form Bdirect",
    ]);
    expect(toggle("Form B")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "email" })).not.toBeInTheDocument();
    expect(select()).toBeDisabled();
    expect(detail()).toHaveTextContent("Highlight an element to see its details.");
  });

  it("can keep the configured source order", () => {
    renderPicker("source");
    expect(groupLabels()).toEqual([
      "Form Bdirect",
      "Form Atransitive",
      "Action Properties",
      "Client Organisation Properties",
    ]);
  });

  it("expands a group, highlights an element, shows its details, then selects it", async () => {
    const { onSelect, onClose } = renderPicker();

    await userEvent.click(toggle("Form A"));
    const formA = within(toggle("Form A").closest("section")!);
    expect(formA.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Form A",
      "completed_at",
      "button",
      "dynamic_checkbox_group",
      "dynamic_object",
      "email",
      "id",
      "multi_select",
      "name",
      "notes",
    ]);

    await userEvent.click(formA.getByRole("button", { name: "email" }));
    expect(formA.getByRole("button", { name: "email" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(definition("Element")).toBe("email");
    expect(definition("Group")).toBe("Form A");
    expect(definition("Source")).toBe("Transitive dependencies");
    expect(definition("Kind")).toBe("form_field");
    expect(onSelect).not.toHaveBeenCalled();
    expect(select()).toBeEnabled();

    await userEvent.click(select());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      kind: "form_field",
      nodeId: NODE["Form A"],
      field: "email",
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves the highlight to the last clicked element", async () => {
    renderPicker();
    await userEvent.click(toggle("Action Properties"));
    await userEvent.click(screen.getByRole("button", { name: "id" }));
    await userEvent.click(screen.getByRole("button", { name: "status" }));
    expect(screen.getByRole("button", { name: "id" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "status" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Cancel closes without selecting, even with a highlight", async () => {
    const { onSelect, onClose } = renderPicker();
    await userEvent.click(toggle("Form B"));
    await userEvent.click(screen.getByRole("button", { name: "name" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("search keeps matching elements and opens their groups", async () => {
    renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "mail");

    expect(groupLabels()).toEqual([
      "Action Properties",
      "Form Atransitive",
      "Form Bdirect",
    ]);
    expect(toggle("Form A")).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByRole("button", { name: /mail/ }).map((b) => b.textContent),
    ).toEqual(["initiator_email", "email", "email"]);
  });

  it("search matches a group by its label and says when nothing matches", async () => {
    renderPicker();
    const box = screen.getByRole("searchbox");

    await userEvent.type(box, "client");
    expect(groupLabels()).toEqual(["Client Organisation Properties"]);
    expect(screen.getByRole("button", { name: "tier" })).toBeVisible();

    await userEvent.clear(box);
    await userEvent.type(box, "zzz");
    expect(screen.getByText("No matching data elements.")).toBeVisible();
  });
});
