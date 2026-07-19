// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { createAppStore } from "../../src/app/store";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("accessible debug UI", () => {
  it("operates Attention with keyboard and updates selector output", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore()} />);
    const increase = screen.getByRole("button", {
      name: "Increase Precision Attention",
    });
    increase.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/1 of 3 allocated/)).toBeTruthy();
    expect(document.activeElement).toBe(increase);
  });

  it("announces a typed rejection and preserves control focus", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore()} />);
    const pause = screen.getAllByRole("button", { name: "Pause" })[0]!;
    await user.click(pause);
    expect(screen.getByTestId("status-announcement").textContent).toMatch(
      /INVALID_PROJECT_STATE/,
    );
    expect(document.activeElement).toBe(pause);
  });

  it("has semantic named controls and no raw mathematics markup", () => {
    const { container } = render(<App store={createAppStore()} />);
    expect(
      screen.getByRole("heading", {
        name: "Deterministic engine debug interface",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Advance 10 seconds" }),
    ).toBeTruthy();
    expect(container.textContent).not.toContain("\\(");
    expect(
      container.querySelectorAll("button:not([aria-label])").length,
    ).toBeGreaterThan(0);
    expect(
      [...container.querySelectorAll("button")].every(
        (button) =>
          button.textContent?.trim() || button.getAttribute("aria-label"),
      ),
    ).toBe(true);
  });
});
