// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { createAppStore } from "../../src/app/store";
import { naturalNumbersContent } from "../../src/content";
import { gameNumber } from "../../src/engine";
import { createInitialState } from "../../src/engine/state/game-state";
import {
  createSaveEnvelope,
  exportSave,
  SAVE_KEYS,
} from "../../src/platform/persistence";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("accessible debug UI", () => {
  it("operates Attention with keyboard and updates selector output", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore()} />);
    const decrease = screen.getByRole("button", {
      name: "Decrease Formalize Attention",
    });
    decrease.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/2 of 3 allocated/)).toBeTruthy();
    expect(document.activeElement).toBe(decrease);
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

  it("restores the newest save on startup and preserves lower-generation imports", async () => {
    const saved = createInitialState(naturalNumbersContent);
    saved.resources.PRECISION = gameNumber(12);
    localStorage.setItem(
      SAVE_KEYS.current,
      exportSave(
        createSaveEnvelope(saved, {
          generation: 10,
          savedAtMs: Date.now() + 1_000,
          sessionId: "startup-test",
          buildId: "test",
        }),
      ),
    );
    const store = createAppStore();
    await store.initialize();
    expect(store.getSnapshot().state.resources.PRECISION).toBe(12);

    const imported = createInitialState(naturalNumbersContent);
    imported.resources.PRECISION = gameNumber(1);
    store.import(
      exportSave(
        createSaveEnvelope(imported, {
          generation: 1,
          savedAtMs: Date.now(),
          sessionId: "import-test",
          buildId: "test",
        }),
      ),
    );
    store.load();
    expect(
      store.getSnapshot().state.resources.PRECISION,
    ).toBeGreaterThanOrEqual(1);
    expect(store.getSnapshot().state.resources.PRECISION).toBeLessThan(2);
    window.dispatchEvent(new Event("pagehide"));
  });

  it("keeps a second initialized tab passive and rejects imported mutation", async () => {
    const first = createAppStore();
    const second = createAppStore();
    await first.initialize();
    await second.initialize();
    const imported = createSaveEnvelope(
      createInitialState(naturalNumbersContent),
      {
        generation: 1,
        savedAtMs: Date.now(),
        sessionId: "passive-import",
        buildId: "test",
      },
    );
    expect(second.import(exportSave(imported))).toMatchObject({
      valid: false,
      code: "PASSIVE_READER",
    });
    expect(
      second.dispatch({
        type: "advanceTime",
        payload: { durationMs: 1_000, offline: false, safePolicy: false },
      }),
    ).toMatchObject({
      accepted: false,
      events: [],
    });
    window.dispatchEvent(new Event("pagehide"));
  });
});
