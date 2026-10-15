import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CollapsibleGroup } from "./CollapsibleGroup";

describe("CollapsibleGroup", () => {
  it("is a heading with a toggle button that reports its state; the badge is not in the name", () => {
    render(
      <CollapsibleGroup label="Form B" badge="direct" expanded={false} onToggle={vi.fn()}>
        <p>email</p>
      </CollapsibleGroup>,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Form Bdirect");
    const toggle = screen.getByRole("button", { name: "Form B" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("email")).not.toBeVisible();
  });

  it("shows the content when expanded and links it to the button", () => {
    render(
      <CollapsibleGroup label="Form B" expanded onToggle={vi.fn()}>
        <p>email</p>
      </CollapsibleGroup>,
    );
    const toggle = screen.getByRole("button", { name: "Form B" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("email")).toBeVisible();
    expect(screen.getByText("email").parentElement).toHaveAttribute(
      "id",
      toggle.getAttribute("aria-controls"),
    );
  });

  it("asks the parent to toggle", async () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleGroup label="Form B" expanded={false} onToggle={onToggle}>
        <p>email</p>
      </CollapsibleGroup>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Form B" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
