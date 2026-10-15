import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ENDPOINT } from "./api/client";
import { App } from "./App";
import rawGraph from "./test/fixtures/graph.json";

const renderApp = () => render(<App endpoint={DEFAULT_ENDPOINT} sources={[]} />);

describe("App", () => {
  it("shows a loading message, then the blueprint", async () => {
    let respond: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (respond = resolve))),
    );
    renderApp();

    expect(screen.getByText("Loading blueprint…")).toBeVisible();

    respond(Response.json(rawGraph));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Onboard Customer 0" }),
    ).toBeVisible();
    expect(screen.queryByText("Loading blueprint…")).not.toBeInTheDocument();
  });

  it("shows the error when the blueprint cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503, statusText: "Unavailable" })),
    );
    renderApp();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load the blueprint");
    expect(alert).toHaveTextContent("503 Unavailable");
  });
});
