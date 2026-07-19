import { describe, expect, it } from "vitest";
import { naturalNumbersContent, naturalNumbersIds } from "../../src/content";
import { envelope, reduceCommand } from "../../src/engine";
import { createInitialState } from "../../src/engine/state/game-state";
import { advanceOffline } from "../../src/platform/time/offline";

describe("online/offline equivalence", () => {
  it("produces the same economy for an equivalent credited window", () => {
    const base = createInitialState(naturalNumbersContent);
    base.attention.allocations[naturalNumbersIds.FORMALIZE] = 2;
    const online = reduceCommand(
      base,
      envelope(
        {
          type: "advanceTime",
          payload: { durationMs: 60_000, offline: false, safePolicy: false },
        },
        1,
      ),
      naturalNumbersContent,
    );
    const offline = advanceOffline(base, naturalNumbersContent, 60_000, true);
    expect(online.accepted).toBe(true);
    if (!online.accepted) return;
    expect(offline.state.resources).toEqual(online.state.resources);
    expect(offline.state.projects).toEqual(online.state.projects);
    expect(offline.state.logicalTimeMs).toBe(online.state.logicalTimeMs);
    expect(offline.state.rng).toEqual(online.state.rng);
  });

  it("stops before an unresolved completion decision", () => {
    const base = createInitialState(naturalNumbersContent);
    base.projects["nn.project.zero_successor"]!.status = "active";
    const result = advanceOffline(base, naturalNumbersContent, 60_000, false);
    expect(result.stoppedForDecision).toBe(true);
    expect(result.state).toBe(base);
    expect(result.policyTrace[0]).toMatch(/Stopped/);
  });
});
