import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

function renderDialog(footer?: React.ReactNode) {
  const onClose = vi.fn();
  render(
    <Dialog title="Pick something" onClose={onClose} footer={footer}>
      <p>Body text</p>
      <button type="button">Inside</button>
    </Dialog>,
  );
  return onClose;
}

describe("Dialog", () => {
  it("is a modal dialog named by its title, with the body and footer", () => {
    renderDialog(<button type="button">Done</button>);
    const dialog = screen.getByRole("dialog", { name: "Pick something" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Body text")).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toBeVisible();
  });

  it("closes on Escape", async () => {
    const onClose = renderDialog();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on the × button", async () => {
    const onClose = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a click outside the panel but not inside it", async () => {
    const onClose = renderDialog();
    await userEvent.click(screen.getByText("Body text"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the panel and returns it to the opener on close", async () => {
    render(<button type="button">Open</button>);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();

    const { unmount } = render(
      <Dialog title="T" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
  });

  it("leaves focus alone when a child takes it, and still returns it on close", async () => {
    render(<button type="button">Open</button>);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();

    const { unmount } = render(
      <Dialog title="T" onClose={vi.fn()}>
        <input type="search" aria-label="Search" autoFocus />
      </Dialog>,
    );
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
  });
});
