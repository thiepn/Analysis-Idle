// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/preact";
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

function begunState() {
  const state = createInitialState(naturalNumbersContent);
  state.ownedUpgrades.push("nn.info.rate_ledger" as never);
  state.resources.PRECISION = gameNumber(100);
  return state;
}

describe("Natural Numbers production UI", () => {
  it("begins with one guided action and hides future systems", () => {
    render(<App store={createAppStore()} />);
    expect(
      screen.getByRole("heading", { name: "Begin with zero" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Use zero as the beginning" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Projects" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Automation" })).toBeNull();
    expect(screen.queryByText("Publication")).toBeNull();
  });

  it("reveals Study, operates Attention with keyboard, and preserves focus", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore()} />);
    await user.click(
      screen.getByRole("button", { name: "Use zero as the beginning" }),
    );
    const studyButtons = screen.getAllByRole("button", { name: "Study" });
    await user.click(studyButtons[0]!);
    const decrease = screen.getByRole("button", {
      name: "Decrease Formalize Attention",
    });
    decrease.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("group", {
        name: /Formalize Attention allocation, 2 of 3/,
      }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(decrease);
  });

  it("starts, pauses, and cancellation-confirms through typed commands", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore(12_345, begunState())} />);
    await user.click(screen.getAllByRole("button", { name: "Projects" })[0]!);
    await user.click(screen.getByRole("button", { name: "Start project" }));
    expect(screen.getByRole("button", { name: "Pause project" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Pause project" }));
    await user.click(screen.getByRole("button", { name: "Cancel project" }));
    const dialog = screen.getByRole("dialog", {
      name: "Cancel this project?",
    });
    expect(
      within(dialog).getByText(/returns every reserved input/i),
    ).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: "Keep project" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has named landmarks and controls with no raw mathematics markup", () => {
    const { container } = render(<App store={createAppStore()} />);
    expect(
      screen.getByRole("heading", { name: "Natural Numbers", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(container.textContent).not.toContain("\\(");
    expect(container.textContent).not.toContain("\\frac");
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
