import { useEffect, useState } from "preact/hooks";
import { naturalNumbersContent, naturalNumbersIds } from "../content";
import type { ApproachId, ProjectId } from "../shared/contracts";
import {
  selectAchievementStatus,
  selectAttention,
  selectAutomationTrace,
  selectCapstone,
  selectDiagnostics,
  selectEffectDecomposition,
  selectInsight,
  selectMilestoneProgress,
  selectProjectAvailability,
  selectProjectProgress,
  selectPublicationReadiness,
  selectResource,
} from "../engine/selectors";
import {
  hasAutomationCapability,
  hasInformationCapability,
  type GameCommand,
} from "../engine";
import type { AppStore } from "./store";

interface AppProperties {
  store: AppStore;
}

export function App({ store }: AppProperties) {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [importText, setImportText] = useState("");
  useEffect(
    () => store.subscribe(() => setSnapshot(store.getSnapshot())),
    [store],
  );
  const state = snapshot.state;
  const attention = selectAttention(state);
  const dispatch = (command: GameCommand) => store.dispatch(command);
  const resourceRows = naturalNumbersContent.resources.map((resource) => ({
    resource,
    selection: selectResource(state, naturalNumbersContent, resource.id),
  }));
  const chapter = naturalNumbersContent.chapters[0]!;
  const publication = selectPublicationReadiness(
    state,
    naturalNumbersContent,
    chapter.id,
  );
  const queueUnlocked = hasAutomationCapability(
    state,
    naturalNumbersContent,
    "queue",
  );
  const completionUnlocked = hasAutomationCapability(
    state,
    naturalNumbersContent,
    "completionBehavior",
  );
  const capstoneUnlocked = hasInformationCapability(
    state,
    naturalNumbersContent,
    "capstoneEdges",
  );

  return (
    <main id="main">
      <header>
        <p class="eyebrow">Analysis Idle v2 · Phase 1</p>
        <h1>Deterministic engine debug interface</h1>
        <p>
          This technical surface exercises commands and selectors. It is not the
          Phase 2 player interface.
        </p>
        <p
          role="status"
          aria-live="polite"
          class="status"
          data-testid="status-announcement"
        >
          {snapshot.statusMessage}
        </p>
      </header>

      <section aria-labelledby="engine-heading">
        <h2 id="engine-heading">Engine status</h2>
        <dl class="metrics">
          <div>
            <dt>Schema</dt>
            <dd>{state.schemaVersion}</dd>
          </div>
          <div>
            <dt>Sequence</dt>
            <dd>{state.sequence}</dd>
          </div>
          <div>
            <dt>Logical seconds</dt>
            <dd>{(state.logicalTimeMs / 1000).toFixed(1)}</dd>
          </div>
          <div>
            <dt>RNG draws</dt>
            <dd>{state.rng.draws}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "advanceTime",
              payload: {
                durationMs: 10_000,
                offline: false,
                safePolicy: false,
              },
            })
          }
        >
          Advance 10 seconds
        </button>
      </section>

      <section aria-labelledby="resources-heading">
        <h2 id="resources-heading">Resources and Attention</h2>
        <table>
          <caption>Canonical stock values and selector-derived rates</caption>
          <thead>
            <tr>
              <th scope="col">Stock</th>
              <th scope="col">Value</th>
              <th scope="col">Per second</th>
              <th scope="col">Attention</th>
            </tr>
          </thead>
          <tbody>
            {resourceRows.map(({ resource, selection }) => {
              const activity = naturalNumbersContent.activities.find(
                (candidate) => candidate.resourceId === resource.id,
              )!;
              const allocation = state.attention.allocations[activity.id] ?? 0;
              return (
                <tr key={resource.id}>
                  <th scope="row">{resource.short}</th>
                  <td>{selection.total.toFixed(2)}</td>
                  <td>{selection.rate.toFixed(3)}</td>
                  <td>
                    <div
                      class="stepper"
                      role="group"
                      aria-label={`${activity.short} Attention allocation`}
                    >
                      <button
                        type="button"
                        aria-label={`Decrease ${activity.short} Attention`}
                        onClick={() =>
                          dispatch({
                            type: "setAttention",
                            payload: {
                              activityId: activity.id,
                              allocation: Math.max(0, allocation - 1),
                            },
                          })
                        }
                      >
                        −
                      </button>
                      <output aria-live="polite">{allocation}</output>
                      <button
                        type="button"
                        aria-label={`Increase ${activity.short} Attention`}
                        onClick={() =>
                          dispatch({
                            type: "setAttention",
                            payload: {
                              activityId: activity.id,
                              allocation: allocation + 1,
                            },
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>
          {attention.allocated} of {attention.capacity} allocated;{" "}
          {attention.available} available.
        </p>
      </section>

      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading">Projects and approaches</h2>
        <div class="card-grid">
          {naturalNumbersContent.projects.map((project) => {
            const runtime = state.projects[project.id]!;
            const availability = selectProjectAvailability(
              state,
              naturalNumbersContent,
              project.id,
            );
            const progress = selectProjectProgress(
              state,
              naturalNumbersContent,
              project.id,
            );
            const controlsId = `${project.id}-reason`;
            return (
              <article class="card" key={project.id}>
                <h3>{project.short}</h3>
                <p>
                  Status: <strong>{runtime.status}</strong>. Progress{" "}
                  {Math.round(progress.fraction * 100)}%
                  {progress.etaSeconds === null
                    ? ""
                    : `; ${progress.etaSeconds.toFixed(0)} seconds remaining`}
                  .
                </p>
                <fieldset>
                  <legend>Approach</legend>
                  {project.allowedApproachIds.map((approachId) => (
                    <label key={approachId}>
                      <input
                        type="radio"
                        name={`${project.id}-approach`}
                        value={approachId}
                        checked={runtime.approachId === approachId}
                        onChange={() =>
                          dispatch({
                            type: "switchProjectApproach",
                            payload: { projectId: project.id, approachId },
                          })
                        }
                      />
                      {
                        naturalNumbersContent.approaches.find(
                          (candidate) => candidate.id === approachId,
                        )!.short
                      }
                    </label>
                  ))}
                </fieldset>
                <div class="button-row">
                  <button
                    type="button"
                    disabled={!queueUnlocked}
                    title={
                      queueUnlocked
                        ? "Queue this project"
                        : "Queue automation is not unlocked"
                    }
                    aria-describedby={controlsId}
                    onClick={() =>
                      dispatch({
                        type: "startProject",
                        payload: { projectId: project.id },
                      })
                    }
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "pauseProject",
                        payload: { projectId: project.id },
                      })
                    }
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "cancelProject",
                        payload: { projectId: project.id },
                      })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "queueProject",
                        payload: { projectId: project.id },
                      })
                    }
                  >
                    Queue
                  </button>
                </div>
                <p id={controlsId} class="hint">
                  {availability.available
                    ? "Prerequisites met; resource requirements still apply."
                    : availability.reasons.join("; ")}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="technique-heading">
        <h2 id="technique-heading">Technique artifacts</h2>
        <ul>
          {naturalNumbersContent.techniqueArtifacts.map((artifact) => (
            <li key={artifact.id}>
              <span aria-hidden="true">
                {state.ownedArtifacts.includes(artifact.id) ? "✓" : "○"}
              </span>{" "}
              {artifact.short}:{" "}
              {state.ownedArtifacts.includes(artifact.id)
                ? "owned"
                : "not owned"}
              . Compatible with {artifact.compatibleProjectIds.length} project
              {artifact.compatibleProjectIds.length === 1 ? "" : "s"}; removal{" "}
              {artifact.removalBehavior}.
              {state.techniqueRecords[artifact.id]
                ? ` Earned as ${state.techniqueRecords[artifact.id]!.outputKind} through ${state.techniqueRecords[artifact.id]!.approachId}.`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="upgrade-heading">
        <h2 id="upgrade-heading">Upgrades</h2>
        <ul class="control-list">
          {naturalNumbersContent.upgrades.map((upgrade) => (
            <li key={upgrade.id}>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "purchaseUpgrade",
                    payload: { upgradeId: upgrade.id },
                  })
                }
              >
                {state.ownedUpgrades.includes(upgrade.id)
                  ? "Owned"
                  : "Purchase"}{" "}
                {upgrade.short}
              </button>
              <span>
                {upgrade.cost[naturalNumbersIds.PRECISION]} Precision,{" "}
                {upgrade.cost[naturalNumbersIds.INTUITION]} Intuition.{" "}
                {upgrade.strategicPurpose}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="insight-heading">
        <h2 id="insight-heading">Insight and automation</h2>
        <p>
          Understanding {state.understanding}; this monotonic progression record
          is not a spendable stock.
        </p>
        <p>
          Insight {selectInsight(state, naturalNumbersContent).value} of{" "}
          {selectInsight(state, naturalNumbersContent).cap}.
        </p>
        <button
          type="button"
          disabled={
            state.insight < 1 ||
            !Object.values(state.projects).some(
              (project) => project.status === "active",
            )
          }
          title="Reduce a bounded portion of the active project's remaining work"
          onClick={() =>
            dispatch({
              type: "spendInsight",
              payload: { amount: 1, purpose: "traceStep" },
            })
          }
        >
          Spend 1 Insight
        </button>
        <label>
          Completion behavior{" "}
          <select
            value={state.completionBehavior}
            disabled={!completionUnlocked}
            aria-describedby="completion-behavior-help"
            onChange={(event) =>
              dispatch({
                type: "setCompletionBehavior",
                payload: {
                  behavior: event.currentTarget.value as
                    "pause" | "startNextFunded",
                },
              })
            }
          >
            <option value="pause">Pause</option>
            <option value="startNextFunded">Start next funded</option>
          </select>
        </label>
        <p id="completion-behavior-help" class="hint">
          {completionUnlocked
            ? "Choose the saved project-completion policy."
            : "Completion behavior unlocks after the induction walkthrough."}
        </p>
        <details>
          <summary>
            Automation trace ({selectAutomationTrace(state).length})
          </summary>
          <pre>{JSON.stringify(selectAutomationTrace(state), null, 2)}</pre>
        </details>
      </section>

      <section aria-labelledby="capstone-heading">
        <h2 id="capstone-heading">Capstone and Publication</h2>
        <ul>
          {selectCapstone(state, naturalNumbersContent, chapter.id).edges.map(
            (edge) => (
              <li key={edge.id}>
                {edge.fromConcept} â†’ {edge.toConcept} ({edge.relationship}):{" "}
                {edge.assembled
                  ? "assembled"
                  : edge.artifactOwned
                    ? "ready to assemble"
                    : "required artifact missing"}{" "}
                <button
                  type="button"
                  disabled={
                    !capstoneUnlocked || !edge.artifactOwned || edge.assembled
                  }
                  title={
                    capstoneUnlocked
                      ? "Assign the required typed Technique artifact"
                      : "The equivalence map is not unlocked"
                  }
                  onClick={() =>
                    dispatch({
                      type: "assembleCapstoneEdge",
                      payload: { chapterId: chapter.id, edgeId: edge.id },
                    })
                  }
                >
                  Assemble
                </button>
              </li>
            ),
          )}
        </ul>
        <p>
          {publication.ready
            ? "Publication ready."
            : `Not ready: ${publication.missing.join("; ")}`}
        </p>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "publishChapter",
              payload: { chapterId: chapter.id },
            })
          }
        >
          Publish chapter
        </button>
      </section>

      <section aria-labelledby="persistence-heading">
        <h2 id="persistence-heading">Save, load, export and import</h2>
        <div class="button-row">
          <button type="button" onClick={() => void store.save()}>
            Save
          </button>
          <button type="button" onClick={() => store.load()}>
            Load
          </button>
          <button type="button" onClick={() => store.export()}>
            Prepare export
          </button>
        </div>
        <label htmlFor="import-save">Import or exported JSON text</label>
        <textarea
          id="import-save"
          value={importText || snapshot.exportText}
          onInput={(event) => setImportText(event.currentTarget.value)}
          rows={8}
        />
        <button
          type="button"
          onClick={() => store.import(importText || snapshot.exportText)}
        >
          Validate and import
        </button>
      </section>

      <section aria-labelledby="derived-heading">
        <h2 id="derived-heading">Selector output and diagnostics</h2>
        <details>
          <summary>Milestones and achievements</summary>
          <pre>
            {JSON.stringify(
              {
                milestones: selectMilestoneProgress(
                  state,
                  naturalNumbersContent,
                ),
                achievements: selectAchievementStatus(
                  state,
                  naturalNumbersContent,
                ),
              },
              null,
              2,
            )}
          </pre>
        </details>
        <details>
          <summary>Effect decomposition</summary>
          <pre>
            {JSON.stringify(
              selectEffectDecomposition(state, naturalNumbersContent),
              null,
              2,
            )}
          </pre>
        </details>
        <details open>
          <summary>Invariant diagnostics</summary>
          <pre>{JSON.stringify(selectDiagnostics(state), null, 2)}</pre>
        </details>
      </section>

      <section aria-labelledby="events-heading">
        <h2 id="events-heading">Event log</h2>
        <ol reversed>
          {[...snapshot.events].reverse().map((event, index) => (
            <li key={`${state.sequence}-${index}`}>
              <code>{event.type}</code> {JSON.stringify(event)}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export const asProjectId = (value: string): ProjectId => value as ProjectId;
export const asApproachId = (value: string): ApproachId => value as ApproachId;
