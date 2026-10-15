import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("is a named switch that reports its state", () => {
    render(<Switch checked onChange={vi.fn()} label="Prefill fields for this form" />);
    expect(
      screen.getByRole("switch", { name: "Prefill fields for this form" }),
    ).toBeChecked();
  });

  it("asks to flip when clicked", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Prefill" />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
