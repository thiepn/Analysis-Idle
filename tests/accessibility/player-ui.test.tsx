// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { createAppStore } from "../../src/app/store";
import { naturalNumbersContent } from "../../src/content";
import { createInitialState, gameNumber } from "../../src/engine";

afterEach(cleanup);

function mapState() {
  const state = createInitialState(naturalNumbersContent);
  state.ownedUpgrades.push(
    "nn.info.rate_ledger" as never,
    "nn.activity.explore" as never,
  );
  state.projects["nn.project.zero_successor"]!.status = "completed";
  state.projects["nn.project.peano_frame"]!.status = "completed";
  state.projects["nn.project.primitive_recursion"]!.status = "available";
  state.reachedMilestones.push(
    "nn.milestone.zero_named" as never,
    "nn.milestone.successor_closed" as never,
    "nn.milestone.peano_framed" as never,
  );
  state.activityEnabled.EXPLORE = true;
  state.attention.allocations = { FORMALIZE: 2, EXPLORE: 1 };
  return state;
}

describe("player accessibility contracts", () => {
  it("gives every interactive element an accessible name", () => {
    const { container } = render(<App store={createAppStore()} />);
    for (const element of container.querySelectorAll<HTMLElement>(
      "button, input, select, textarea, summary",
    )) {
      const labelled =
        element.textContent?.trim() ||
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby") ||
        element.closest("label")?.textContent?.trim();
      expect(labelled, element.outerHTML).toBeTruthy();
    }
  });

  it("offers a fully operable structured alternative to the visual Proof Map", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore(12_345, mapState())} />);
    await user.click(screen.getAllByRole("button", { name: "Proof Map" })[0]!);
    await user.click(screen.getByRole("button", { name: "Structured list" }));
    const list = screen.getByTestId("proof-map-list");
    const zero = within(list).getByRole("button", {
      name: /Zero and Successor/i,
    });
    zero.focus();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(zero);
    expect(screen.getByText(/Zero is a natural number/)).toBeTruthy();
  });

  it("represents every required Proof Map node type and preserves selected state", async () => {
    const user = userEvent.setup();
    const state = mapState();
    for (const project of naturalNumbersContent.projects)
      state.projects[project.id]!.status = "completed";
    state.ownedArtifacts = naturalNumbersContent.techniqueArtifacts.map(
      (artifact) => artifact.id,
    );
    state.assembledCapstoneEdges =
      naturalNumbersContent.chapters[0]!.capstoneEdges.map((edge) => edge.id);
    render(<App store={createAppStore(12_345, state, true)} />);
    await user.click(screen.getAllByRole("button", { name: "Proof Map" })[0]!);

    for (const type of [
      "definition",
      "example",
      "exercise",
      "lemma",
      "proof step",
      "Technique artifact",
      "capstone element",
      "Publication dependency",
    ])
      expect(screen.getAllByText(type, { exact: true }).length).toBeGreaterThan(
        0,
      );
    expect(
      screen.getByRole("button", {
        name: /Zero and Successor, project,.*completed, selected/i,
      }),
    ).toBeTruthy();
    expect(screen.getAllByText(/Prerequisite/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Output/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Next action/).length).toBeGreaterThan(0);
  });

  it("traps dialog focus, supports Escape, and restores the invoking control", async () => {
    const user = userEvent.setup();
    const state = mapState();
    state.resources.PRECISION = gameNumber(100);
    state.resources.INTUITION = gameNumber(100);
    render(<App store={createAppStore(12_345, state, true)} />);
    await user.click(screen.getAllByRole("button", { name: "Projects" })[0]!);
    await user.click(
      screen.getByRole("button", { name: /Primitive Recursion/ }),
    );
    const start = screen.getByRole("button", { name: "Start project" });
    await user.click(start);
    await user.click(screen.getByRole("button", { name: "Pause project" }));
    const cancel = screen.getByRole("button", { name: "Cancel project" });
    await user.click(cancel);
    const dialog = screen.getByRole("dialog");
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Keep project" })).toBe(
        document.activeElement,
      );
    });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(cancel);
  });

  it("exposes state with text labels independent of color", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore(12_345, mapState())} />);
    await user.click(screen.getAllByRole("button", { name: "Projects" })[0]!);
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("available").length).toBeGreaterThan(0);
  });

  it("keeps late destinations reachable from the mobile More menu", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore(12_345, mapState())} />);
    await user.click(screen.getByRole("button", { name: "More" }));
    const menu = screen.getByRole("navigation", {
      name: "More destinations",
    });
    expect(within(menu).getByRole("button", { name: "Records" })).toBeTruthy();
    expect(within(menu).getByRole("button", { name: "Settings" })).toBeTruthy();
    await user.click(within(menu).getByRole("button", { name: "Records" }));
    expect(screen.getByRole("heading", { name: "Records" })).toBeTruthy();
  });

  it("announces invalid imports even with essential verbosity", async () => {
    const user = userEvent.setup();
    render(<App store={createAppStore(12_345, undefined, true)} />);
    await user.click(
      screen.getByRole("button", { name: "Open settings and save tools" }),
    );
    fireEvent.input(
      screen.getByRole("textbox", { name: "Versioned JSON text" }),
      { target: { value: "{" } },
    );
    await user.click(
      screen.getByRole("button", { name: "Validate and preview import" }),
    );
    expect(screen.getByTestId("status-announcement").textContent).toMatch(
      /CORRUPT_JSON/,
    );
  });
});
