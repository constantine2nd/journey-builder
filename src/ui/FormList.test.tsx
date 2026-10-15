import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockGraph, NODE } from "../test/builders";
import { FormList } from "./FormList";

describe("FormList", () => {
  it("lists forms by name and marks the selected one", () => {
    render(
      <FormList
        nodes={[...mockGraph.nodes].reverse()}
        selectedNodeId={NODE["Form D"]}
        onSelect={vi.fn()}
      />,
    );

    const list = screen.getByRole("navigation", { name: "Forms" });
    const buttons = list.querySelectorAll("button");
    expect([...buttons].map((button) => button.textContent)).toEqual([
      "Form A",
      "Form B",
      "Form C",
      "Form D",
      "Form E",
      "Form F",
    ]);
    expect(screen.getByRole("button", { name: "Form D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Form A" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the clicked form's node id", async () => {
    const onSelect = vi.fn();
    render(<FormList nodes={mockGraph.nodes} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Form B" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(NODE["Form B"]);
  });
});
