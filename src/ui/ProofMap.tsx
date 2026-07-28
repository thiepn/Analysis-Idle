import { useMemo, useState } from "preact/hooks";
import { naturalNumbersContent } from "../content";
import { getProjectPresentation } from "../content/natural-numbers-copy";
import {
  selectOwnedTechniqueMatches,
  selectProjectAvailability,
  type GameState,
} from "../engine";
import type { ProjectId } from "../shared/contracts";

interface ProofMapProperties {
  state: GameState;
  selectedProjectId: ProjectId | null;
  onSelect: (projectId: ProjectId) => void;
}

const positions: Record<string, { x: number; y: number }> = {
  "nn.project.zero_successor": { x: 10, y: 9 },
  "nn.project.peano_frame": { x: 23, y: 9 },
  "nn.project.primitive_recursion": { x: 41, y: 9 },
  "nn.project.addition": { x: 59, y: 9 },
  "nn.project.addition_lemmas": { x: 77, y: 2 },
  "nn.project.multiplication": { x: 77, y: 18 },
  "nn.project.induction_walkthrough": { x: 59, y: 38 },
  "nn.project.counterexample_lab": { x: 77, y: 34 },
  "nn.project.strong_induction": { x: 77, y: 50 },
  "nn.project.well_ordering": { x: 59, y: 66 },
  "nn.project.least_counterexample": { x: 77, y: 72 },
  "nn.project.equivalence_capstone": { x: 41, y: 86 },
};

function nodeStatus(state: GameState, projectId: ProjectId) {
  const runtime = state.projects[projectId]!;
  const availability = selectProjectAvailability(
    state,
    naturalNumbersContent,
    projectId,
  );
  if (runtime.status === "completed") return "completed";
  if (runtime.status === "active") return "active";
  if (runtime.status === "queued") return "queued";
  if (runtime.status === "paused") return "paused";
  if (runtime.status === "available" && availability.available)
    return "available";
  return "locked";
}

export function ProofMap({
  state,
  selectedProjectId,
  onSelect,
}: ProofMapProperties) {
  const [mode, setMode] = useState<"visual" | "list">("visual");
  const visible = useMemo(() => {
    const completed = new Set(
      naturalNumbersContent.projects
        .filter((project) => state.projects[project.id]?.status === "completed")
        .map((project) => project.id),
    );
    return naturalNumbersContent.projects.filter((project, index) => {
      const runtime = state.projects[project.id]!;
      return (
        index < 3 ||
        runtime.status !== "locked" ||
        project.prerequisiteProjectIds.some((id) => completed.has(id))
      );
    });
  }, [state]);

  return (
    <section class="view-section" aria-labelledby="proof-map-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Dependency instrument</p>
          <h2 id="proof-map-title">Proof Map</h2>
          <p>
            Follow definitions into methods. Every connector is a declared
            prerequisite; the list view carries the same information.
          </p>
        </div>
        <div class="segmented" aria-label="Proof Map display">
          <button
            type="button"
            aria-pressed={mode === "visual"}
            onClick={() => setMode("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            aria-pressed={mode === "list"}
            onClick={() => setMode("list")}
          >
            Structured list
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <div class="proof-map" data-testid="proof-map-visual">
          <svg
            class="proof-connectors"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {visible.flatMap((project) =>
              project.prerequisiteProjectIds.map((prerequisite) => {
                const from = positions[prerequisite];
                const to = positions[project.id];
                if (!from || !to) return null;
                return (
                  <path
                    key={`${prerequisite}-${project.id}`}
                    d={`M ${from.x + 7} ${from.y + 4} C ${from.x + 12} ${from.y + 4}, ${to.x - 5} ${to.y + 4}, ${to.x} ${to.y + 4}`}
                    class={
                      state.projects[prerequisite]?.status === "completed"
                        ? "connector connector-complete"
                        : "connector"
                    }
                  />
                );
              }),
            )}
          </svg>
          {visible.map((project) => {
            const position = positions[project.id]!;
            const status = nodeStatus(state, project.id);
            const presentation = getProjectPresentation(project.id);
            return (
              <button
                type="button"
                key={project.id}
                class={`proof-node proof-node-${status}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                aria-pressed={selectedProjectId === project.id}
                aria-label={`${project.short}, ${presentation.concept}, ${status}`}
                onClick={() => onSelect(project.id)}
              >
                <span class="node-type">{presentation.concept}</span>
                <strong>{project.short}</strong>
                <span class="node-status">{status}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <ol class="proof-list" data-testid="proof-map-list">
          {visible.map((project) => {
            const presentation = getProjectPresentation(project.id);
            const status = nodeStatus(state, project.id);
            const matches = selectOwnedTechniqueMatches(
              state,
              naturalNumbersContent,
              project.id,
            );
            return (
              <li key={project.id}>
                <button
                  type="button"
                  class="proof-list-button"
                  aria-pressed={selectedProjectId === project.id}
                  onClick={() => onSelect(project.id)}
                >
                  <span>
                    <strong>{project.short}</strong>
                    <small>
                      {presentation.concept} · {status}
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
                <dl class="compact-definition">
                  <div>
                    <dt>Prerequisites</dt>
                    <dd>
                      {project.prerequisiteProjectIds.length === 0
                        ? "None"
                        : project.prerequisiteProjectIds
                            .map(
                              (id) =>
                                naturalNumbersContent.projects.find(
                                  (candidate) => candidate.id === id,
                                )?.short ?? id,
                            )
                            .join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Output</dt>
                    <dd>{presentation.gameplay}</dd>
                  </div>
                  <div>
                    <dt>Compatible Technique</dt>
                    <dd>
                      {matches.length > 0
                        ? matches
                            .map(({ artifact }) => artifact.short)
                            .join(", ")
                        : "No earned match yet"}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      )}

      {selectedProjectId ? (
        <aside class="map-detail" aria-live="polite">
          <p class="kicker">
            {getProjectPresentation(selectedProjectId).concept}
          </p>
          <h3>
            {
              naturalNumbersContent.projects.find(
                (project) => project.id === selectedProjectId,
              )?.short
            }
          </h3>
          <p>{getProjectPresentation(selectedProjectId).mathematics}</p>
          <details>
            <summary>Deeper proof note</summary>
            <p>{getProjectPresentation(selectedProjectId).deeper}</p>
          </details>
        </aside>
      ) : null}
    </section>
  );
}
