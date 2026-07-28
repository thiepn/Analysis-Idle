import { useMemo, useState } from "preact/hooks";
import { naturalNumbersContent } from "../content";
import { getProjectPresentation } from "../content/natural-numbers-copy";
import {
  selectOwnedTechniqueMatches,
  selectProjectAvailability,
  selectProjectDeficits,
  selectPublicationReadiness,
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
  if (runtime.status === "available" && availability.available) {
    if (projectId === "nn.project.equivalence_capstone")
      return "capstone-ready";
    const deficits = selectProjectDeficits(
      state,
      naturalNumbersContent,
      projectId,
    );
    return deficits.PRECISION > 0 || deficits.INTUITION > 0
      ? "blocked"
      : "available";
  }
  return "locked";
}

function nextAction(status: string): string {
  if (status === "completed") return "Review the archived result";
  if (status === "active") return "Continue the active project";
  if (status === "queued") return "Review the queued plan";
  if (status === "paused") return "Resume or revise the project";
  if (status === "available" || status === "capstone-ready")
    return "Review and start the project";
  if (status === "blocked") return "Prepare the displayed resource deficit";
  return "Complete the listed prerequisites";
}

const mathematicalNodes: Array<{
  id: string;
  type: "definition" | "example" | "exercise" | "lemma" | "proof step";
  title: string;
  projectId: ProjectId;
}> = [
  {
    id: "definition-zero-successor",
    type: "definition",
    title: "Zero and successor definition",
    projectId: "nn.project.zero_successor" as ProjectId,
  },
  {
    id: "example-recursive-addition",
    type: "example",
    title: "Recursive addition example",
    projectId: "nn.project.addition" as ProjectId,
  },
  {
    id: "exercise-missing-step",
    type: "exercise",
    title: "Missing base or step exercise",
    projectId: "nn.project.counterexample_lab" as ProjectId,
  },
  {
    id: "lemma-addition",
    type: "lemma",
    title: "Reusable addition lemmas",
    projectId: "nn.project.addition_lemmas" as ProjectId,
  },
  {
    id: "proof-step-induction",
    type: "proof step",
    title: "Induction base and successor step",
    projectId: "nn.project.induction_walkthrough" as ProjectId,
  },
];

export function ProofMap({
  state,
  selectedProjectId,
  onSelect,
}: ProofMapProperties) {
  const [mode, setMode] = useState<"visual" | "list">(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(max-width: 820px)").matches
      ? "list"
      : "visual",
  );
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
  const visibleIds = new Set(visible.map((project) => project.id));
  const chapter = naturalNumbersContent.chapters[0]!;
  const publication = selectPublicationReadiness(
    state,
    naturalNumbersContent,
    chapter.id,
  );

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
            const selected = selectedProjectId === project.id;
            const presentation = getProjectPresentation(project.id);
            return (
              <button
                type="button"
                key={project.id}
                class={`proof-node proof-node-${status} ${selected ? "proof-node-selected" : ""}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                aria-pressed={selectedProjectId === project.id}
                aria-label={`${project.short}, project, ${presentation.concept}, ${status}${selected ? ", selected" : ""}`}
                onClick={() => onSelect(project.id)}
              >
                <span class="node-type">project · {presentation.concept}</span>
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
                      project · {presentation.concept} · {status}
                      {selectedProjectId === project.id ? " · selected" : ""}
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

      <section
        class="map-element-section"
        aria-labelledby="proof-map-elements-title"
      >
        <div class="section-heading compact-heading">
          <div>
            <p class="kicker">Typed dependency nodes</p>
            <h3 id="proof-map-elements-title">Mathematical evidence chain</h3>
            <p>
              These nodes expose the definitions, examples, exercises, lemmas,
              proof steps, learned Technique, capstone implications and final
              Publication dependency represented by the project graph.
            </p>
          </div>
        </div>
        <ul class="map-element-grid">
          {mathematicalNodes
            .filter((node) => visibleIds.has(node.projectId))
            .map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  class="map-element-node"
                  onClick={() => onSelect(node.projectId)}
                >
                  <span class="node-type">{node.type}</span>
                  <strong>{node.title}</strong>
                  <small>
                    Project dependency · {nodeStatus(state, node.projectId)}
                  </small>
                  <small>
                    Prerequisites ·{" "}
                    {naturalNumbersContent.projects
                      .find((project) => project.id === node.projectId)!
                      .prerequisiteProjectIds.map(
                        (id) =>
                          naturalNumbersContent.projects.find(
                            (project) => project.id === id,
                          )?.short ?? id,
                      )
                      .join(", ") || "None"}
                  </small>
                  <small>
                    Output · {getProjectPresentation(node.projectId).gameplay}
                  </small>
                  <small>
                    Next action ·{" "}
                    {nextAction(nodeStatus(state, node.projectId))}
                  </small>
                </button>
              </li>
            ))}
          {naturalNumbersContent.techniqueArtifacts
            .filter((artifact) => visibleIds.has(artifact.sourceProjectId))
            .map((artifact) => (
              <li key={artifact.id}>
                <button
                  type="button"
                  class="map-element-node"
                  onClick={() => onSelect(artifact.sourceProjectId)}
                >
                  <span class="node-type">Technique artifact</span>
                  <strong>{artifact.short}</strong>
                  <small>
                    {state.ownedArtifacts.includes(artifact.id)
                      ? "completed · learned"
                      : state.projects[artifact.sourceProjectId]?.status ===
                          "active"
                        ? "active · being prepared"
                        : "locked · complete its source project"}
                  </small>
                  <small>
                    Prerequisite ·{" "}
                    {naturalNumbersContent.projects.find(
                      (project) => project.id === artifact.sourceProjectId,
                    )?.short ?? artifact.sourceProjectId}
                  </small>
                  <small>
                    Output · {artifact.kind.replaceAll(/([A-Z])/g, " $1")}
                  </small>
                  <small>
                    Next action ·{" "}
                    {state.ownedArtifacts.includes(artifact.id)
                      ? "Review compatible downstream projects"
                      : "Complete the source project"}
                  </small>
                </button>
              </li>
            ))}
          {chapter.capstoneEdges.map((edge) => (
            <li key={edge.id}>
              <button
                type="button"
                class="map-element-node"
                onClick={() =>
                  onSelect("nn.project.equivalence_capstone" as ProjectId)
                }
              >
                <span class="node-type">capstone element</span>
                <strong>
                  {edge.fromConcept} → {edge.toConcept}
                </strong>
                <small>
                  {state.assembledCapstoneEdges.includes(edge.id)
                    ? "completed · implication assembled"
                    : state.ownedArtifacts.includes(edge.requiredArtifactId)
                      ? "capstone-ready · Technique available"
                      : "blocked · required Technique not learned"}
                </small>
                <small>
                  Prerequisite ·{" "}
                  {naturalNumbersContent.techniqueArtifacts.find(
                    (artifact) => artifact.id === edge.requiredArtifactId,
                  )?.short ?? edge.requiredArtifactId}
                </small>
                <small>Output · validated implication edge</small>
                <small>
                  Next action ·{" "}
                  {state.assembledCapstoneEdges.includes(edge.id)
                    ? "Review the assembled edge"
                    : state.ownedArtifacts.includes(edge.requiredArtifactId)
                      ? "Assemble this implication below"
                      : "Learn the required Technique"}
                </small>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              class="map-element-node"
              onClick={() =>
                onSelect("nn.project.equivalence_capstone" as ProjectId)
              }
            >
              <span class="node-type">Publication dependency</span>
              <strong>Foundations of the Natural Numbers</strong>
              <small>
                {state.chapters[chapter.id] === "published"
                  ? "completed · published"
                  : publication.ready
                    ? "capstone-ready · Publication available"
                    : `blocked · ${publication.missing.length} dependencies remain`}
              </small>
              <small>
                Prerequisites · 12 completed projects and 4 capstone edges
              </small>
              <small>Output · Induction Framework Mastery card</small>
              <small>
                Next action ·{" "}
                {state.chapters[chapter.id] === "published"
                  ? "Review the published archive"
                  : publication.ready
                    ? "Open Publication and review the reset ledger"
                    : "Complete the remaining dependencies"}
              </small>
            </button>
          </li>
        </ul>
      </section>

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
