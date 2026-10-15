import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ENDPOINT } from "./api/client";
import { App } from "./App";
import { resolveSources } from "./prefill/config";
import rawGraph from "./test/fixtures/graph.json";

/**
 * The whole user flow, from the API response to a cleared mapping. Only
 * the network is faked; the loader, builder, panel, picker and store are
 * the real code, with the brief's three sources.
 */
const BRIEF_SOURCES = ["direct_dependencies", "transitive_dependencies", "global_data"];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(rawGraph)),
  );
});

const user = userEvent.setup();

const formButton = (name: string) =>
  within(screen.getByRole("navigation", { name: "Forms" })).getByRole("button", { name });
const unmappedRow = (field: string) =>
  screen.getByRole("button", { name: `${field}, no prefill configured` });
const mappedRow = (text: string) => screen.getByRole("button", { name: text });
const picker = () => screen.getByRole("dialog", { name: "Select data element to map" });

async function renderApp() {
  render(<App endpoint={DEFAULT_ENDPOINT} sources={resolveSources(BRIEF_SOURCES)} />);
  await screen.findByRole("heading", { level: 1, name: "Onboard Customer 0" });
}

async function pick(group: string, element: string) {
  await user.click(within(picker()).getByRole("button", { name: group }));
  await user.click(within(picker()).getByRole("button", { name: element }));
  await user.click(within(picker()).getByRole("button", { name: "Select" }));
}

describe("the prefill flow", () => {
  it("loads the blueprint and lists its forms", async () => {
    await renderApp();
    expect(
      within(screen.getByRole("navigation", { name: "Forms" }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Form A", "Form B", "Form C", "Form D", "Form E", "Form F"]);
    expect(screen.getByText("Select a form to configure its prefill.")).toBeVisible();
  });

  it("maps Form D's email to Form A's email, as in the reference, and clears it", async () => {
    await renderApp();
    await user.click(formButton("Form D"));
    await user.click(unmappedRow("email"));

    expect(within(picker()).getByText(/^For field/)).toHaveTextContent("For field email");
    await pick("Form A", "email");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mappedRow("email: Form A.email")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Clear prefill for email" }));
    expect(unmappedRow("email")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Clear prefill for email" }),
    ).not.toBeInTheDocument();
  });

  it("keeps mappings per form and replaces one when picked again", async () => {
    await renderApp();
    await user.click(formButton("Form D"));
    await user.click(unmappedRow("email"));
    await pick("Form A", "email");
    await user.click(unmappedRow("name"));
    await pick("Client Organisation Properties", "name");

    expect(mappedRow("name: Client Organisation.name")).toBeVisible();

    await user.click(formButton("Form E"));
    expect(unmappedRow("email")).toBeVisible();
    await user.click(formButton("Form D"));
    expect(mappedRow("email: Form A.email")).toBeVisible();

    await user.click(mappedRow("email: Form A.email"));
    await pick("Form B", "completed_at");
    expect(mappedRow("email: Form B.completed_at")).toBeVisible();
  });

  it.each([
    [
      "Cancel",
      () => user.click(within(picker()).getByRole("button", { name: "Cancel" })),
    ],
    ["Escape", () => user.keyboard("{Escape}")],
    [
      "the × button",
      () => user.click(within(picker()).getByRole("button", { name: "Close" })),
    ],
  ])(
    "leaves the field unmapped on %s and returns focus to the row",
    async (_, dismiss) => {
      await renderApp();
      await user.click(formButton("Form D"));
      await user.click(unmappedRow("email"));
      await user.click(within(picker()).getByRole("button", { name: "Form A" }));
      await user.click(within(picker()).getByRole("button", { name: "email" }));

      await dismiss();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(unmappedRow("email")).toHaveFocus();
    },
  );

  it("turns prefill off for one form only", async () => {
    await renderApp();
    await user.click(formButton("Form D"));
    await user.click(screen.getByRole("switch", { name: "Prefill fields for Form D" }));
    expect(unmappedRow("email")).toBeDisabled();

    await user.click(formButton("Form B"));
    expect(
      screen.getByRole("switch", { name: "Prefill fields for Form B" }),
    ).toBeChecked();
    expect(unmappedRow("email")).toBeEnabled();
  });

  it("offers only global data for Form A, which depends on nothing", async () => {
    await renderApp();
    await user.click(formButton("Form A"));
    await user.click(unmappedRow("email"));
    expect(
      within(picker())
        .getAllByRole("heading", { level: 3 })
        .slice(1)
        .map((heading) => heading.textContent),
    ).toEqual(["Action Properties", "Client Organisation Properties"]);
  });

  it("offers nothing but a message when no source applies", async () => {
    render(
      <App
        endpoint={DEFAULT_ENDPOINT}
        sources={resolveSources(["direct_dependencies"])}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    await user.click(formButton("Form A"));
    await user.click(unmappedRow("email"));
    expect(within(picker()).getByText("No matching data elements.")).toBeVisible();
  });
});
