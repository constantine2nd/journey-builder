import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBox } from "./SearchBox";

describe("SearchBox", () => {
  it("is a named search box that reports every change", async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchBox value="" onChange={onChange} label="Search available data" />);

    const box = screen.getByRole("searchbox", { name: "Search available data" });
    await userEvent.type(box, "em");

    expect(onChange.mock.calls.map(([value]) => value)).toEqual(["e", "m"]);
  });

  it("shows the given value", () => {
    render(<SearchBox value="email" onChange={vi.fn()} label="Search" />);
    expect(screen.getByRole("searchbox")).toHaveValue("email");
  });
});
