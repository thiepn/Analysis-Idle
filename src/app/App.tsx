import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  achievementTitle,
  artifactKindLabels,
  getApproachCopy,
  getProjectPresentation,
  milestoneTitle,
  naturalNumbersConvention,
} from "../content/natural-numbers-copy";
import { naturalNumbersContent, naturalNumbersIds } from "../content";
import {
  evaluateCondition,
  hasAutomationCapability,
  hasInformationCapability,
  resolveActivityRate,
  resolveProjectSpeed,
  selectAchievementStatus,
  selectApproachComparison,
  selectAttention,
  selectAutomationTrace,
  selectCapstone,
  selectEffectDecomposition,
  selectInsight,
  selectMilestoneProgress,
  selectOwnedTechniqueMatches,
  selectProjectAvailability,
  selectProjectDeficits,
  selectProjectProgress,
  selectPublicationReadiness,
  selectResource,
  selectUpgradePreview,
  type GameCommand,
  type GameState,
} from "../engine";
import type {
  ApproachId,
  ProjectDefinition,
  ProjectId,
  ResourceId,
  UpgradeDefinition,
} from "../shared/contracts";
import { Dialog } from "../ui/Dialog";
import {
  formatDuration,
  formatElapsed,
  formatGameNumber,
  formatPercent,
  formatRate,
} from "../ui/format";
import { ProofMap } from "../ui/ProofMap";
import {
  availableViews,
  selectCurrentObjective,
  selectDisclosure,
  type AppView,
  type DisclosureModel,
} from "../ui/view-models";
import type { AppStore, StoreSnapshot } from "./store";

interface AppProperties {
  store: AppStore;
}

const viewLabels: Record<AppView, string> = {
  overview: "Overview",
  study: "Study",
  projects: "Projects",
  map: "Proof Map",
  upgrades: "Upgrades",
  automation: "Automation",
  records: "Records",
  publication: "Publication",
  settings: "Settings",
};

function resourceSymbol(resourceId: string) {
  return resourceId === naturalNumbersIds.PRECISION ? "□" : "◯";
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.max(0, Math.min(1, value));
  return (
    <div class="progress-track" aria-label={label}>
      <span class="progress-fill" style={{ width: formatPercent(percent) }} />
      <span class="sr-only">{formatPercent(percent)}</span>
    </div>
  );
}

function ResourceCard({
  state,
  resourceId,
  compact = false,
}: {
  state: GameState;
  resourceId: ResourceId;
  compact?: boolean;
}) {
  const resource = naturalNumbersContent.resources.find(
    (candidate) => candidate.id === resourceId,
  )!;
  const selected = selectResource(state, naturalNumbersContent, resource.id);
  const cap =
    resource.id === naturalNumbersIds.PRECISION &&
    state.reachedMilestones.includes("nn.milestone.operations_built" as never)
      ? 420
      : resource.id === naturalNumbersIds.INTUITION &&
          state.reachedMilestones.includes(
            "nn.milestone.operations_built" as never,
          )
        ? 360
        : resource.cap;
  return (
    <article class={`resource-card resource-${resource.id.toLowerCase()}`}>
      <div class="resource-title">
        <span class="resource-symbol" aria-hidden="true">
          {resourceSymbol(resource.id)}
        </span>
        <div>
          <span class="resource-label">{resource.short}</span>
          {!compact ? (
            <small>
              {resource.id === naturalNumbersIds.PRECISION
                ? "Formal definitions and obligations"
                : "Examples, alternatives and discovery"}
            </small>
          ) : null}
        </div>
      </div>
      <strong class="resource-value">{formatGameNumber(selected.total)}</strong>
      <span class="resource-rate">{formatRate(selected.rate)}</span>
      {!compact ? (
        <>
          <ProgressBar
            value={selected.total / cap}
            label={`${resource.short}: ${formatGameNumber(selected.total)} of ${formatGameNumber(cap)}`}
          />
          <small>
            Cap {formatGameNumber(cap)} ·{" "}
            {resource.id === naturalNumbersIds.PRECISION
              ? "used by formal project obligations"
              : "used by discovery project requirements"}
          </small>
        </>
      ) : null}
    </article>
  );
}

function AttentionControl({
  state,
  activityId,
  dispatch,
}: {
  state: GameState;
  activityId: string;
  dispatch: (command: GameCommand) => void;
}) {
  const activity = naturalNumbersContent.activities.find(
    (candidate) => candidate.id === activityId,
  )!;
  const allocation = state.attention.allocations[activity.id] ?? 0;
  const attention = selectAttention(state);
  const current = resolveActivityRate(
    activity.id,
    state,
    naturalNumbersContent,
  );
  const previewState = structuredClone(state);
  previewState.attention.allocations[activity.id] = allocation + 1;
  const next =
    attention.available > 0
      ? resolveActivityRate(activity.id, previewState, naturalNumbersContent)
          .rate
      : current.rate;
  return (
    <div class="attention-control">
      <div>
        <strong>{activity.short}</strong>
        <span>{formatRate(current.rate)}</span>
      </div>
      <div
        class="stepper"
        role="group"
        aria-label={`${activity.short} Attention allocation, ${allocation} of ${state.attention.capacity}`}
      >
        <button
          type="button"
          aria-label={`Decrease ${activity.short} Attention`}
          disabled={allocation === 0}
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
          disabled={attention.available === 0}
          title={
            attention.available === 0
              ? "Move Attention from another activity first"
              : `Adds about ${formatRate(next - current.rate)}`
          }
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
      <small>
        Next unit adds{" "}
        {attention.available > 0
          ? formatRate(next - current.rate)
          : "no rate until a slot is moved"}
      </small>
    </div>
  );
}

function ObjectiveCard({
  state,
  onNavigate,
  dispatch,
}: {
  state: GameState;
  onNavigate: (view: AppView, projectId?: ProjectId | null) => void;
  dispatch: (command: GameCommand) => void;
}) {
  const objective = selectCurrentObjective(state);
  return (
    <section class="objective-card" aria-labelledby="current-objective-title">
      <div>
        <p class="kicker">{objective.eyebrow}</p>
        <h2 id="current-objective-title">{objective.title}</h2>
        <p>{objective.explanation}</p>
      </div>
      {objective.actionLabel ? (
        objective.title === "Begin with zero" ? (
          <button
            type="button"
            class="primary-action"
            onClick={() =>
              dispatch({
                type: "purchaseUpgrade",
                payload: { upgradeId: "nn.info.rate_ledger" as never },
              })
            }
          >
            {objective.actionLabel}
          </button>
        ) : (
          <button
            type="button"
            class="primary-action"
            onClick={() =>
              onNavigate(objective.targetView, objective.projectId)
            }
          >
            {objective.actionLabel}
          </button>
        )
      ) : null}
    </section>
  );
}

function ActiveProjectCard({
  state,
  onOpen,
}: {
  state: GameState;
  onOpen: (projectId: ProjectId) => void;
}) {
  const runtime = Object.values(state.projects).find(
    (project) => project.status === "active",
  );
  if (!runtime)
    return (
      <article class="instrument-card quiet-card">
        <p class="kicker">Dedicated project slot</p>
        <h3>No project running</h3>
        <p>Study activities continue. Choose a funded project when ready.</p>
      </article>
    );
  const definition = naturalNumbersContent.projects.find(
    (project) => project.id === runtime.id,
  )!;
  const progress = selectProjectProgress(
    state,
    naturalNumbersContent,
    runtime.id,
  );
  return (
    <article class="instrument-card active-project-card">
      <div class="card-heading">
        <div>
          <p class="kicker">Dedicated project slot · active</p>
          <h3>{definition.short}</h3>
        </div>
        <span class="status-chip status-active">working</span>
      </div>
      <ProgressBar
        value={progress.fraction}
        label={`${definition.short} ${formatPercent(progress.fraction)} complete`}
      />
      <div class="project-meta">
        <span>{formatPercent(progress.fraction)} complete</span>
        <span>{formatDuration(progress.etaSeconds)} remaining</span>
      </div>
      <button
        type="button"
        class="text-action"
        onClick={() => onOpen(runtime.id)}
      >
        Inspect plan and method →
      </button>
    </article>
  );
}

function OverviewView({
  state,
  disclosure,
  dispatch,
  onNavigate,
}: {
  state: GameState;
  disclosure: DisclosureModel;
  dispatch: (command: GameCommand) => void;
  onNavigate: (view: AppView, projectId?: ProjectId | null) => void;
}) {
  const attention = selectAttention(state);
  const nextMilestone = selectMilestoneProgress(
    state,
    naturalNumbersContent,
  ).find((entry) => !entry.reached);
  return (
    <>
      <ObjectiveCard
        state={state}
        onNavigate={onNavigate}
        dispatch={dispatch}
      />
      {!disclosure.begun ? (
        <section class="opening-note" aria-labelledby="chapter-convention">
          <div class="successor-mark" aria-hidden="true">
            0 <span>→</span> 1 <span>→</span> 2
          </div>
          <h2 id="chapter-convention">A convention, stated openly</h2>
          <p>{naturalNumbersConvention.accessible}</p>
          <details>
            <summary>Why this convention?</summary>
            <p>
              Starting at zero keeps the recursive definitions of addition and
              multiplication aligned with their identity cases. Other
              conventions are valid when stated consistently.
            </p>
            <p class="source-note">
              Source basis: {naturalNumbersConvention.source}
            </p>
          </details>
        </section>
      ) : (
        <>
          <section class="overview-grid" aria-label="Current plan">
            <div class="resource-stack">
              <ResourceCard
                state={state}
                resourceId={naturalNumbersIds.PRECISION}
                compact
              />
              {disclosure.intuition ? (
                <ResourceCard
                  state={state}
                  resourceId={naturalNumbersIds.INTUITION}
                  compact
                />
              ) : null}
              <article class="attention-summary">
                <div>
                  <p class="kicker">Attention</p>
                  <strong>
                    {attention.allocated} / {attention.capacity}
                  </strong>
                </div>
                <div class="attention-dots" aria-hidden="true">
                  {Array.from({ length: attention.capacity }, (_, index) => (
                    <span
                      key={index}
                      class={index < attention.allocated ? "used" : ""}
                    />
                  ))}
                </div>
                <small>
                  {attention.available} available. Additional focus has
                  diminishing returns.
                </small>
              </article>
            </div>
            <ActiveProjectCard
              state={state}
              onOpen={(projectId) => onNavigate("projects", projectId)}
            />
          </section>

          <section class="plan-strip" aria-labelledby="plan-strip-title">
            <div>
              <p class="kicker">Plan at a glance</p>
              <h2 id="plan-strip-title">Study continues without clicking</h2>
            </div>
            <dl>
              <div>
                <dt>Understanding</dt>
                <dd>{formatGameNumber(state.understanding)}</dd>
              </div>
              <div>
                <dt>Insight</dt>
                <dd>
                  {formatGameNumber(state.insight)} /{" "}
                  {naturalNumbersContent.configuration.insight.cap}
                </dd>
              </div>
              <div>
                <dt>Next milestone</dt>
                <dd>
                  {nextMilestone
                    ? milestoneTitle(nextMilestone.id)
                    : "Chapter complete"}
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </>
  );
}

function StudyView({
  state,
  disclosure,
  dispatch,
}: {
  state: GameState;
  disclosure: DisclosureModel;
  dispatch: (command: GameCommand) => void;
}) {
  const attention = selectAttention(state);
  const exploreOwned = state.ownedUpgrades.includes(
    "nn.activity.explore" as never,
  );
  const exploreAvailable = evaluateCondition(
    naturalNumbersContent.upgrades.find(
      (upgrade) => upgrade.id === "nn.activity.explore",
    )!.unlockCondition,
    state,
    naturalNumbersContent,
  ).met;
  return (
    <section class="view-section" aria-labelledby="study-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Study plan</p>
          <h2 id="study-title">Allocate Attention</h2>
          <p>
            Every slot helps, but concentrated focus has diminishing returns.
            Projects work in a separate dedicated slot.
          </p>
        </div>
        <div class="attention-total" aria-live="polite">
          <strong>{attention.available}</strong>
          <span>of {attention.capacity} available</span>
        </div>
      </div>
      <div class="study-grid">
        <article class="study-activity precision-activity">
          <ResourceCard
            state={state}
            resourceId={naturalNumbersIds.PRECISION}
          />
          <AttentionControl
            state={state}
            activityId={naturalNumbersIds.FORMALIZE}
            dispatch={dispatch}
          />
          <details>
            <summary>How Formalize works</summary>
            <p>
              Formalize produces Precision for definitions and proof
              obligations. A second slot helps, but adds less than the first.
            </p>
          </details>
        </article>
        {disclosure.intuition ? (
          exploreOwned ? (
            <article class="study-activity intuition-activity">
              <ResourceCard
                state={state}
                resourceId={naturalNumbersIds.INTUITION}
              />
              <AttentionControl
                state={state}
                activityId={naturalNumbersIds.EXPLORE}
                dispatch={dispatch}
              />
              <details>
                <summary>How Explore works</summary>
                <p>
                  Explore produces Intuition for examples, counterexamples and
                  alternative routes. Splitting Attention can prepare both
                  project requirements in parallel.
                </p>
              </details>
            </article>
          ) : (
            <article class="study-activity reveal-card">
              <span class="resource-symbol" aria-hidden="true">
                ◯
              </span>
              <p class="kicker">New activity</p>
              <h3>Explore examples</h3>
              <p>
                Open Intuition and create the first real Attention decision.
                This costs no resources.
              </p>
              <button
                type="button"
                class="primary-action"
                disabled={!exploreAvailable}
                onClick={() =>
                  dispatch({
                    type: "purchaseUpgrade",
                    payload: { upgradeId: "nn.activity.explore" as never },
                  })
                }
              >
                Open Explore
              </button>
            </article>
          )
        ) : null}
      </div>
      <aside class="explanation-card">
        <strong>Advanced note</strong>
        <p>
          Study output uses the configured concave Attention curve. The current
          provisional exponent is{" "}
          {naturalNumbersContent.configuration.attention.activityExponent}. This
          value is visible for audit and remains subject to playtesting.
        </p>
      </aside>
    </section>
  );
}

function relevantProjects(state: GameState): ProjectDefinition[] {
  const completed = new Set(
    Object.values(state.projects)
      .filter((project) => project.status === "completed")
      .map((project) => project.id),
  );
  return naturalNumbersContent.projects.filter((project, index) => {
    const status = state.projects[project.id]?.status;
    return (
      index === 0 ||
      status !== "locked" ||
      project.prerequisiteProjectIds.some((id) => completed.has(id))
    );
  });
}

function ProjectList({
  state,
  selectedId,
  onSelect,
}: {
  state: GameState;
  selectedId: ProjectId;
  onSelect: (id: ProjectId) => void;
}) {
  return (
    <ul class="project-list" aria-label="Relevant projects">
      {relevantProjects(state).map((project) => {
        const runtime = state.projects[project.id]!;
        const progress = selectProjectProgress(
          state,
          naturalNumbersContent,
          project.id,
        );
        return (
          <li key={project.id}>
            <button
              type="button"
              class={`project-list-item project-${runtime.status}`}
              aria-pressed={selectedId === project.id}
              onClick={() => onSelect(project.id)}
            >
              <span>
                <small>{getProjectPresentation(project.id).concept}</small>
                <strong>{project.short}</strong>
              </span>
              <span class={`status-chip status-${runtime.status}`}>
                {runtime.status}
              </span>
              {runtime.status === "active" ? (
                <ProgressBar
                  value={progress.fraction}
                  label={`${project.short} ${formatPercent(progress.fraction)} complete`}
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface ProjectDetailProperties {
  state: GameState;
  project: ProjectDefinition;
  disclosure: DisclosureModel;
  dispatch: (command: GameCommand) => void;
  onCancel: (projectId: ProjectId) => void;
  onSwitch: (projectId: ProjectId, approachId: ApproachId) => void;
}

function ProjectDetail({
  state,
  project,
  disclosure,
  dispatch,
  onCancel,
  onSwitch,
}: ProjectDetailProperties) {
  const runtime = state.projects[project.id]!;
  const presentation = getProjectPresentation(project.id);
  const progress = selectProjectProgress(
    state,
    naturalNumbersContent,
    project.id,
  );
  const availability = selectProjectAvailability(
    state,
    naturalNumbersContent,
    project.id,
  );
  const comparisons = selectApproachComparison(
    state,
    naturalNumbersContent,
    project.id,
  );
  const deficits = selectProjectDeficits(
    state,
    naturalNumbersContent,
    project.id,
  );
  const matches = selectOwnedTechniqueMatches(
    state,
    naturalNumbersContent,
    project.id,
  );
  const queueUnlocked = hasAutomationCapability(
    state,
    naturalNumbersContent,
    "queue",
  );
  const currentComparison = comparisons.find(
    (comparison) => comparison.approachId === runtime.approachId,
  )!;
  const estimatedSeconds =
    currentComparison.workRequired /
    resolveProjectSpeed(project.id, state, naturalNumbersContent);
  const canStart =
    ["available", "paused", "cancelled"].includes(runtime.status) &&
    availability.available &&
    !Object.values(state.projects).some(
      (candidate) => candidate.status === "active",
    ) &&
    deficits.PRECISION === 0 &&
    deficits.INTUITION === 0;
  return (
    <article class="project-detail" aria-labelledby="project-detail-title">
      <div class="card-heading">
        <div>
          <p class="kicker">{presentation.concept}</p>
          <h2 id="project-detail-title">{project.short}</h2>
        </div>
        <span class={`status-chip status-${runtime.status}`}>
          {runtime.status}
        </span>
      </div>
      <p class="lead-copy">{presentation.gameplay}</p>
      <div class="project-detail-grid">
        <dl class="requirement-ledger">
          <div>
            <dt>Precision</dt>
            <dd>
              □ {formatGameNumber(currentComparison.precisionRequirement)}
              {runtime.reservedPrecision > 0
                ? ` · ${formatGameNumber(runtime.reservedPrecision)} reserved`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Intuition</dt>
            <dd>
              ◯ {formatGameNumber(currentComparison.intuitionRequirement)}
              {runtime.reservedIntuition > 0
                ? ` · ${formatGameNumber(runtime.reservedIntuition)} reserved`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Project work</dt>
            <dd>{formatGameNumber(currentComparison.workRequired)} work</dd>
          </div>
          <div>
            <dt>Estimate</dt>
            <dd>
              {runtime.status === "active"
                ? formatDuration(progress.etaSeconds)
                : formatDuration(estimatedSeconds)}
            </dd>
          </div>
        </dl>
        <div class="project-progress-panel">
          <span>
            {formatGameNumber(progress.progress)} /{" "}
            {formatGameNumber(progress.required)} work
          </span>
          <ProgressBar
            value={progress.fraction}
            label={`${project.short} ${formatPercent(progress.fraction)} complete`}
          />
          <small>
            Inputs are reserved on start and consumed only when the project
            completes.
          </small>
        </div>
      </div>

      {disclosure.approaches ||
      project.id === ("nn.project.induction_walkthrough" as ProjectId) ||
      naturalNumbersContent.projects.indexOf(project) > 6 ? (
        <fieldset class="approach-fieldset">
          <legend>Project method</legend>
          <p>
            Methods change resource vectors and the typed artifact you record.
            No method is universally recommended.
          </p>
          <div class="approach-grid">
            {comparisons.map((comparison) => {
              const copy = getApproachCopy(comparison.approachId);
              return (
                <label
                  key={comparison.approachId}
                  class={
                    runtime.approachId === comparison.approachId
                      ? "approach-option selected"
                      : "approach-option"
                  }
                >
                  <input
                    type="radio"
                    name={`${project.id}-approach`}
                    value={comparison.approachId}
                    checked={runtime.approachId === comparison.approachId}
                    disabled={runtime.status === "completed"}
                    onChange={() => onSwitch(project.id, comparison.approachId)}
                  />
                  <strong>{copy.title}</strong>
                  <span>
                    □ {formatGameNumber(comparison.precisionRequirement)} · ◯{" "}
                    {formatGameNumber(comparison.intuitionRequirement)} ·{" "}
                    {formatDuration(
                      comparison.workRequired /
                        resolveProjectSpeed(
                          project.id,
                          state,
                          naturalNumbersContent,
                        ),
                    )}
                  </span>
                  <small>{copy.output}</small>
                  <small>{copy.use}</small>
                </label>
              );
            })}
          </div>
          {runtime.progress > 0 ? (
            <p class="notice-inline">
              Switching preserves inputs and{" "}
              {formatPercent(
                naturalNumbersContent.configuration.projects
                  .approachSwitchPreservation,
              )}{" "}
              of equivalent completed work.
            </p>
          ) : null}
        </fieldset>
      ) : (
        <aside class="explanation-card">
          <strong>Method choices arrive with induction</strong>
          <p>
            Early foundation projects use the Formal method while the chapter
            introduces its basic resources and dependencies.
          </p>
        </aside>
      )}

      <section class="technique-match" aria-labelledby="technique-match-title">
        <h3 id="technique-match-title">Technique and output</h3>
        <p>
          This project records <strong>{project.short} method</strong> as a
          typed artifact. Technique is reusable knowledge, never a stock or
          hidden percentage.
        </p>
        <p>
          Compatible earned methods:{" "}
          {matches.length > 0
            ? matches.map(({ artifact }) => artifact.short).join(", ")
            : "none yet"}
          .
        </p>
      </section>

      <details class="math-note">
        <summary>Why this works</summary>
        <p>{presentation.mathematics}</p>
        <p>{presentation.deeper}</p>
        <p class="source-note">
          Reviewed source basis: {project.mathematicalSource}
        </p>
      </details>

      <div class="action-cluster">
        {runtime.status === "active" ? (
          <button
            type="button"
            class="primary-action"
            onClick={() =>
              dispatch({
                type: "pauseProject",
                payload: { projectId: project.id },
              })
            }
          >
            Pause project
          </button>
        ) : runtime.status !== "completed" && runtime.status !== "queued" ? (
          <button
            type="button"
            class="primary-action"
            disabled={!canStart}
            aria-describedby="project-action-reason"
            onClick={() =>
              dispatch({
                type: "startProject",
                payload: { projectId: project.id },
              })
            }
          >
            {runtime.status === "paused" ? "Resume project" : "Start project"}
          </button>
        ) : null}
        {queueUnlocked &&
        ["available", "paused", "cancelled"].includes(runtime.status) ? (
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "queueProject",
                payload: { projectId: project.id },
              })
            }
          >
            Queue next
          </button>
        ) : null}
        {["active", "paused", "queued"].includes(runtime.status) ? (
          <button
            type="button"
            class="danger-action"
            onClick={() => onCancel(project.id)}
          >
            Cancel project
          </button>
        ) : null}
      </div>
      <p id="project-action-reason" class="control-reason" aria-live="polite">
        {!availability.available
          ? availability.reasons.join(". ")
          : deficits.PRECISION > 0 || deficits.INTUITION > 0
            ? `Need ${formatGameNumber(deficits.PRECISION)} more Precision and ${formatGameNumber(deficits.INTUITION)} more Intuition at this method.`
            : Object.values(state.projects).some(
                  (candidate) => candidate.status === "active",
                ) && runtime.status !== "active"
              ? "The dedicated project slot is occupied."
              : runtime.status === "completed"
                ? "Completed and recorded in the chapter."
                : "Requirements met."}
      </p>
    </article>
  );
}

function ProjectsView({
  state,
  disclosure,
  dispatch,
  selectedProjectId,
  onSelect,
  onCancel,
  onSwitch,
}: {
  state: GameState;
  disclosure: DisclosureModel;
  dispatch: (command: GameCommand) => void;
  selectedProjectId: ProjectId;
  onSelect: (id: ProjectId) => void;
  onCancel: (id: ProjectId) => void;
  onSwitch: (id: ProjectId, approachId: ApproachId) => void;
}) {
  const selected =
    naturalNumbersContent.projects.find(
      (project) => project.id === selectedProjectId,
    ) ?? naturalNumbersContent.projects[0]!;
  return (
    <section class="view-section" aria-labelledby="projects-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Strategic work</p>
          <h2 id="projects-title">Projects</h2>
          <p>
            Prepare inputs, choose a method, then let the dedicated project slot
            work alongside study.
          </p>
        </div>
        <div class="queue-summary">
          <span>Active slot</span>
          <strong>
            {Object.values(state.projects).some(
              (project) => project.status === "active",
            )
              ? "occupied"
              : "available"}
          </strong>
          <span>Queue {state.projectQueue.length} / 1</span>
        </div>
      </div>
      <div class="projects-layout">
        <ProjectList
          state={state}
          selectedId={selected.id}
          onSelect={onSelect}
        />
        <ProjectDetail
          state={state}
          project={selected}
          disclosure={disclosure}
          dispatch={dispatch}
          onCancel={onCancel}
          onSwitch={onSwitch}
        />
      </div>
    </section>
  );
}

function CapstoneEdges({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (command: GameCommand) => void;
}) {
  const chapter = naturalNumbersContent.chapters[0]!;
  const capstone = selectCapstone(state, naturalNumbersContent, chapter.id);
  const unlocked = hasInformationCapability(
    state,
    naturalNumbersContent,
    "capstoneEdges",
  );
  if (!unlocked && !capstone.edges.some((edge) => edge.artifactOwned))
    return null;
  return (
    <section class="capstone-panel" aria-labelledby="capstone-panel-title">
      <div>
        <p class="kicker">Equivalence capstone</p>
        <h2 id="capstone-panel-title">Connect the foundations</h2>
        <p>
          Assign the matching earned method to each implication. Raw resources
          cannot complete this map.
        </p>
      </div>
      <ol>
        {capstone.edges.map((edge) => (
          <li key={edge.id}>
            <span>
              <strong>
                {edge.fromConcept} → {edge.toConcept}
              </strong>
              <small>
                {edge.assembled
                  ? "Validated"
                  : edge.artifactOwned
                    ? "Matching method ready"
                    : "Required method not yet earned"}
              </small>
            </span>
            <button
              type="button"
              disabled={!unlocked || !edge.artifactOwned || edge.assembled}
              onClick={() =>
                dispatch({
                  type: "assembleCapstoneEdge",
                  payload: { chapterId: chapter.id, edgeId: edge.id },
                })
              }
            >
              {edge.assembled ? "Assigned" : "Assign method"}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function UpgradesView({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (command: GameCommand) => void;
}) {
  const availableTier = Math.max(
    0,
    ...naturalNumbersContent.upgrades
      .filter(
        (upgrade) =>
          state.ownedUpgrades.includes(upgrade.id) ||
          evaluateCondition(
            upgrade.unlockCondition,
            state,
            naturalNumbersContent,
          ).met,
      )
      .map((upgrade) => upgrade.tier),
  );
  const visible = naturalNumbersContent.upgrades.filter(
    (upgrade) =>
      !["nn.info.rate_ledger", "nn.activity.explore"].includes(upgrade.id) &&
      (state.ownedUpgrades.includes(upgrade.id) ||
        evaluateCondition(upgrade.unlockCondition, state, naturalNumbersContent)
          .met ||
        upgrade.tier <= availableTier + 1),
  );
  const groups = new Map<string, UpgradeDefinition[]>();
  for (const upgrade of visible) {
    const group =
      upgrade.category === "routine"
        ? "Study"
        : upgrade.category === "automation"
          ? "Automation"
          : upgrade.category === "keystone"
            ? "Technique"
            : ["capacity", "active"].includes(upgrade.category)
              ? "Planning"
              : ["capstone", "compression"].includes(upgrade.category)
                ? "Transformation"
                : "Information";
    groups.set(group, [...(groups.get(group) ?? []), upgrade]);
  }
  return (
    <section class="view-section" aria-labelledby="upgrades-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Capabilities and tools</p>
          <h2 id="upgrades-title">Upgrades</h2>
          <p>
            Buy information, methods and automation when they change the plan.
            Only two routine upgrades are simple rate multipliers.
          </p>
        </div>
      </div>
      <div class="upgrade-groups">
        {[...groups.entries()].map(([group, upgrades]) => (
          <section key={group} class="upgrade-group">
            <h3>{group}</h3>
            <div class="upgrade-grid">
              {upgrades.map((upgrade) => {
                const owned = state.ownedUpgrades.includes(upgrade.id);
                const unlocked = evaluateCondition(
                  upgrade.unlockCondition,
                  state,
                  naturalNumbersContent,
                ).met;
                const affordable = Object.entries(upgrade.cost).every(
                  ([id, amount]) =>
                    (state.resources[id] ?? 0) -
                      (state.resourceReserves[id] ?? 0) >=
                    amount,
                );
                const effects = selectUpgradePreview(
                  state,
                  naturalNumbersContent,
                  upgrade.id,
                );
                return (
                  <article
                    key={upgrade.id}
                    class={`upgrade-card ${owned ? "owned" : unlocked ? "available" : "locked"}`}
                  >
                    <div class="card-heading">
                      <div>
                        <p class="kicker">
                          {upgrade.category} · tier {upgrade.tier}
                        </p>
                        <h4>
                          {upgrade.id.split(".").at(-1)!.replaceAll("_", " ")}
                        </h4>
                      </div>
                      <span class="status-chip">
                        {owned ? "owned" : unlocked ? "available" : "locked"}
                      </span>
                    </div>
                    <p>{upgrade.strategicPurpose}</p>
                    <p class="cost-line">
                      □{" "}
                      {formatGameNumber(
                        upgrade.cost[naturalNumbersIds.PRECISION] ?? 0,
                      )}{" "}
                      · ◯{" "}
                      {formatGameNumber(
                        upgrade.cost[naturalNumbersIds.INTUITION] ?? 0,
                      )}
                    </p>
                    <details>
                      <summary>Effect and persistence</summary>
                      <ul>
                        {effects.map((effect) => (
                          <li key={effect.id}>
                            {effect.operation} on {effect.target.kind}
                            {effect.magnitude !== 1
                              ? ` (${formatGameNumber(effect.magnitude)})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                      <p>
                        Publication behavior: {upgrade.publicationBehavior}.
                      </p>
                    </details>
                    {owned ? (
                      <span class="owned-label">✓ Active</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!unlocked || !affordable}
                        title={
                          !unlocked
                            ? upgrade.unlockCondition.text.accessible
                            : !affordable
                              ? "More spendable resources are required"
                              : `Purchase ${upgrade.id}`
                        }
                        onClick={() =>
                          dispatch({
                            type: "purchaseUpgrade",
                            payload: { upgradeId: upgrade.id },
                          })
                        }
                      >
                        {!unlocked
                          ? "Not yet available"
                          : affordable
                            ? "Purchase"
                            : "Prepare resources"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function AutomationView({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (command: GameCommand) => void;
}) {
  const queue = hasAutomationCapability(state, naturalNumbersContent, "queue");
  const completion = hasAutomationCapability(
    state,
    naturalNumbersContent,
    "completionBehavior",
  );
  const reserve = hasAutomationCapability(
    state,
    naturalNumbersContent,
    "resourceReserve",
  );
  const trace = selectAutomationTrace(state).slice(-8).reverse();
  return (
    <section class="view-section" aria-labelledby="automation-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Saved plan</p>
          <h2 id="automation-title">Automation</h2>
          <p>
            Automation removes repeated management. It follows only the rules
            you configure and never buys upgrades or chooses a method for you.
          </p>
        </div>
      </div>
      <div class="automation-ladder">
        <article class="automation-stage unlocked">
          <span>1</span>
          <div>
            <h3>Manual allocation</h3>
            <p>You decide which bottleneck receives Attention.</p>
          </div>
          <strong>available</strong>
        </article>
        <article class={`automation-stage ${queue ? "unlocked" : ""}`}>
          <span>2</span>
          <div>
            <h3>Queue one project</h3>
            <p>Choose a single project to follow the current work.</p>
          </div>
          <strong>{queue ? "available" : "locked"}</strong>
        </article>
        <article class={`automation-stage ${completion ? "unlocked" : ""}`}>
          <span>3</span>
          <div>
            <h3>Completion behavior</h3>
            <p>Pause for review, or start the next funded queued project.</p>
            {completion ? (
              <fieldset>
                <legend>When a project completes</legend>
                <label>
                  <input
                    type="radio"
                    name="completion-rule"
                    checked={state.completionBehavior === "pause"}
                    onChange={() =>
                      dispatch({
                        type: "setCompletionBehavior",
                        payload: { behavior: "pause" },
                      })
                    }
                  />
                  Pause for a decision
                </label>
                <label>
                  <input
                    type="radio"
                    name="completion-rule"
                    checked={state.completionBehavior === "startNextFunded"}
                    onChange={() =>
                      dispatch({
                        type: "setCompletionBehavior",
                        payload: { behavior: "startNextFunded" },
                      })
                    }
                  />
                  Start the next funded project
                </label>
              </fieldset>
            ) : null}
          </div>
          <strong>{completion ? "available" : "locked"}</strong>
        </article>
        <article class={`automation-stage ${reserve ? "unlocked" : ""}`}>
          <span>4</span>
          <div>
            <h3>Resource reserve</h3>
            <p>
              Protect a minimum amount before automation starts queued work.
            </p>
            {reserve ? (
              <div class="reserve-grid">
                {naturalNumbersContent.resources.map((resource) => (
                  <label key={resource.id}>
                    {resource.short}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={state.resourceReserves[resource.id] ?? 0}
                      onChange={(event) =>
                        dispatch({
                          type: "setResourceReserve",
                          payload: {
                            resourceId: resource.id,
                            amount: Number(event.currentTarget.value),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <strong>{reserve ? "available" : "locked"}</strong>
        </article>
      </div>
      <section class="automation-trace" aria-labelledby="rule-trace-title">
        <h3 id="rule-trace-title">Recent rule trace</h3>
        {trace.length === 0 ? (
          <p>No automation rule has fired yet.</p>
        ) : (
          <ol>
            {trace.map((entry, index) => (
              <li key={`${entry.sequence}-${index}`}>
                <strong>{entry.action}</strong>
                <span>
                  {entry.result}: {entry.stopReason}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function InsightPanel({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (command: GameCommand) => void;
}) {
  const insight = selectInsight(state, naturalNumbersContent);
  const active = Object.values(state.projects).find(
    (project) => project.status === "active",
  );
  if (insight.value === 0 && !active) return null;
  return (
    <section class="insight-panel" aria-labelledby="insight-title">
      <div class="insight-orbit" aria-hidden="true">
        {Array.from({ length: insight.cap }, (_, index) => (
          <span key={index} class={index < insight.value ? "filled" : ""} />
        ))}
      </div>
      <div>
        <p class="kicker">Optional active decision</p>
        <h2 id="insight-title">Insight notebook</h2>
        <p>
          Stored charges do not expire. Spend one to strengthen the current
          proof step, or keep it for later. There is no timing window.
        </p>
      </div>
      <button
        type="button"
        disabled={insight.value < 1 || !active}
        onClick={() =>
          dispatch({
            type: "spendInsight",
            payload: { amount: 1, purpose: "traceStep" },
          })
        }
      >
        Trace the current step
      </button>
      <small>
        Removes 10% of remaining work; total active advantage is capped at 20%.
      </small>
    </section>
  );
}

function RecordsView({ state }: { state: GameState }) {
  const milestones = selectMilestoneProgress(state, naturalNumbersContent);
  const achievements = selectAchievementStatus(state, naturalNumbersContent);
  const ownedArtifacts = naturalNumbersContent.techniqueArtifacts.filter(
    (artifact) => state.ownedArtifacts.includes(artifact.id),
  );
  const completedProjects = naturalNumbersContent.projects.filter(
    (project) => state.projects[project.id]?.status === "completed",
  );
  return (
    <section class="view-section" aria-labelledby="records-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Permanent record</p>
          <h2 id="records-title">Records</h2>
          <p>
            A concise history of validated projects, learned methods and
            strategy. Achievements provide no production power.
          </p>
        </div>
      </div>
      <div class="records-grid">
        <section class="record-panel">
          <h3>Technique library</h3>
          {ownedArtifacts.length === 0 ? (
            <p>
              Technique artifacts appear when project methods are completed.
            </p>
          ) : (
            <ul class="artifact-list">
              {ownedArtifacts.map((artifact) => {
                const record = state.techniqueRecords[artifact.id];
                return (
                  <li key={artifact.id}>
                    <span class="artifact-glyph" aria-hidden="true">
                      ◫
                    </span>
                    <div>
                      <strong>{artifact.short}</strong>
                      <span>
                        {artifactKindLabels[artifact.kind]} · from{" "}
                        {naturalNumbersContent.projects.find(
                          (project) => project.id === artifact.sourceProjectId,
                        )?.short ?? artifact.sourceProjectId}
                      </span>
                      <small>
                        {artifact.compatibleProjectIds.length > 0
                          ? `Matches ${artifact.compatibleProjectIds
                              .map(
                                (id) =>
                                  naturalNumbersContent.projects.find(
                                    (project) => project.id === id,
                                  )?.short ?? id,
                              )
                              .join(", ")}.`
                          : "Recorded for the chapter archive."}{" "}
                        Publication: {artifact.publicationBehavior}.
                        {record
                          ? ` Earned through ${getApproachCopy(record.approachId).title}.`
                          : ""}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section class="record-panel">
          <h3>Achievements</h3>
          <div class="achievement-grid">
            {achievements.map((entry) => {
              const definition = naturalNumbersContent.achievements.find(
                (achievement) => achievement.id === entry.id,
              )!;
              return (
                <article
                  key={entry.id}
                  class={entry.recorded ? "achievement earned" : "achievement"}
                >
                  <span aria-hidden="true">{entry.recorded ? "✦" : "◇"}</span>
                  <div>
                    <strong>{achievementTitle(entry.id)}</strong>
                    <small>
                      {entry.recorded ? "Recorded" : "Not yet recorded"} ·{" "}
                      {definition.rewardClass.replaceAll(/([A-Z])/g, " $1")}
                    </small>
                    <p>{definition.condition.text.accessible}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section class="record-panel">
          <h3>Chapter history</h3>
          <dl class="record-ledger">
            <div>
              <dt>Projects validated</dt>
              <dd>{completedProjects.length} / 12</dd>
            </div>
            <div>
              <dt>Understanding</dt>
              <dd>{formatGameNumber(state.understanding)}</dd>
            </div>
            <div>
              <dt>Approaches compared</dt>
              <dd>{state.records.approachComparisons}</dd>
            </div>
            <div>
              <dt>Projects without Insight</dt>
              <dd>{state.records.projectsCompletedWithoutInsight}</dd>
            </div>
            <div>
              <dt>Offline queued completions</dt>
              <dd>{state.records.offlineQueuedCompletions}</dd>
            </div>
            <div>
              <dt>Publications</dt>
              <dd>{state.records.publications}</dd>
            </div>
          </dl>
        </section>
        <section class="record-panel">
          <h3>Milestone trail</h3>
          <ol class="milestone-trail">
            {milestones
              .filter(
                (entry, index) =>
                  entry.reached ||
                  !milestones
                    .slice(0, index)
                    .some((earlier) => !earlier.reached),
              )
              .map((entry) => (
                <li key={entry.id} class={entry.reached ? "reached" : ""}>
                  <span aria-hidden="true">{entry.reached ? "✓" : "○"}</span>
                  <div>
                    <strong>{milestoneTitle(entry.id)}</strong>
                    <small>
                      {entry.reached ? "Reached" : entry.evaluation.description}
                    </small>
                  </div>
                </li>
              ))}
          </ol>
        </section>
      </div>
    </section>
  );
}

function PublicationView({
  state,
  onPublish,
}: {
  state: GameState;
  onPublish: () => void;
}) {
  const chapter = naturalNumbersContent.chapters[0]!;
  const readiness = selectPublicationReadiness(
    state,
    naturalNumbersContent,
    chapter.id,
  );
  const published = state.chapters[chapter.id] === "published";
  return (
    <section
      class="view-section publication-view"
      aria-labelledby="publication-title"
    >
      <div class="publication-seal" aria-hidden="true">
        N<span>foundations</span>
      </div>
      <div>
        <p class="kicker">
          {published ? "Published method" : "Chapter transformation"}
        </p>
        <h2 id="publication-title">
          {published
            ? "Foundations of the Natural Numbers"
            : "Prepare the foundations for Publication"}
        </h2>
        <p class="lead-copy">
          Publication is not a multiplier reset. It archives detailed work and
          transforms selected methods into reusable cards.
        </p>
      </div>
      <div class="publication-ledger">
        <section>
          <h3>Retain</h3>
          <ul>
            <li>Settings and accessibility preferences</li>
            <li>Achievements and chapter records</li>
            <li>Unlocked Attention capacity</li>
            <li>Universal automation capabilities and templates</li>
            <li>Unspent Insight and published Mastery</li>
          </ul>
        </section>
        <section>
          <h3>Reset</h3>
          <ul>
            <li>Precision and Intuition stocks</li>
            <li>Current Attention allocation</li>
            <li>Active and queued projects</li>
            <li>Chapter resource reserves and routine modifiers</li>
          </ul>
        </section>
        <section>
          <h3>Transform</h3>
          <ul>
            <li>Induction template</li>
            <li>Lemma reuse</li>
            <li>Least-counterexample method</li>
            <li>Detailed Proof Map into a read-only archive</li>
          </ul>
        </section>
      </div>
      {published ? (
        <article class="mastery-card">
          <p class="kicker">Mastery method card</p>
          <h3>Induction Framework</h3>
          <p>
            A compressed record of base cases, induction steps, least elements
            and equivalent proof methods. It grants no generic production
            multiplier.
          </p>
          <strong>Natural Numbers · published</strong>
        </article>
      ) : (
        <>
          {!readiness.ready ? (
            <aside class="publication-readiness">
              <strong>Still required</strong>
              <ul>
                {readiness.missing.slice(0, 6).map((item) => (
                  <li key={item}>{item.replaceAll("nn.project.", "")}</li>
                ))}
              </ul>
              {readiness.missing.length > 6 ? (
                <p>And {readiness.missing.length - 6} more requirements.</p>
              ) : null}
            </aside>
          ) : null}
          <button
            type="button"
            class="primary-action publication-action"
            disabled={!readiness.ready}
            onClick={onPublish}
          >
            Review and publish
          </button>
        </>
      )}
    </section>
  );
}

function SettingsView({
  state,
  snapshot,
  store,
  importText,
  setImportText,
  onImportConfirm,
}: {
  state: GameState;
  snapshot: StoreSnapshot;
  store: AppStore;
  importText: string;
  setImportText: (text: string) => void;
  onImportConfirm: () => void;
}) {
  const dispatch = (command: GameCommand) => store.dispatch(command);
  const diagnostics = selectEffectDecomposition(state, naturalNumbersContent);
  return (
    <section class="view-section" aria-labelledby="settings-title">
      <div class="section-heading">
        <div>
          <p class="kicker">Comfort and data</p>
          <h2 id="settings-title">Settings</h2>
          <p>
            Preferences are stored with the v2 save. No account or network is
            required.
          </p>
        </div>
      </div>
      <div class="settings-grid">
        <section class="settings-panel">
          <h3>Display and access</h3>
          <label
            class="switch-row"
            htmlFor="setting-reduced-motion"
            aria-label="Reduce motion"
          >
            <span>
              <strong>Reduce motion</strong>
              <small>Stops nonessential transitions and movement.</small>
            </span>
            <input
              id="setting-reduced-motion"
              type="checkbox"
              checked={state.settings.reducedMotion}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "reducedMotion",
                    value: event.currentTarget.checked,
                  },
                })
              }
            />
          </label>
          <label
            class="switch-row"
            htmlFor="setting-high-contrast"
            aria-label="High contrast"
          >
            <span>
              <strong>High contrast</strong>
              <small>Strengthens boundaries and state separation.</small>
            </span>
            <input
              id="setting-high-contrast"
              type="checkbox"
              checked={state.settings.highContrast}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "highContrast",
                    value: event.currentTarget.checked,
                  },
                })
              }
            />
          </label>
          <label>
            Text size
            <select
              value={state.settings.textScale}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "textScale",
                    value: event.currentTarget.value,
                  },
                })
              }
            >
              <option value="standard">Standard</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Mathematical notation
            <select
              value={state.settings.notation}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "notation",
                    value: event.currentTarget.value,
                  },
                })
              }
            >
              <option value="plain">Plain language</option>
              <option value="unicode">Unicode symbols with prose</option>
            </select>
          </label>
          <label>
            Status announcements
            <select
              value={state.settings.announcementVerbosity}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "announcementVerbosity",
                    value: event.currentTarget.value,
                  },
                })
              }
            >
              <option value="essential">Essential events</option>
              <option value="all">All command feedback</option>
            </select>
          </label>
          <label
            class="switch-row"
            htmlFor="setting-confirmations"
            aria-label="Confirm destructive actions"
          >
            <span>
              <strong>Confirm destructive actions</strong>
              <small>Review cancellation and Publication ledgers.</small>
            </span>
            <input
              id="setting-confirmations"
              type="checkbox"
              checked={state.settings.confirmations}
              onChange={(event) =>
                dispatch({
                  type: "changeSetting",
                  payload: {
                    setting: "confirmations",
                    value: event.currentTarget.checked,
                  },
                })
              }
            />
          </label>
        </section>
        <section class="settings-panel">
          <h3>Save and recovery</h3>
          <dl class="save-ledger">
            <div>
              <dt>Status</dt>
              <dd>{snapshot.saveState}</dd>
            </div>
            <div>
              <dt>Generation</dt>
              <dd>{snapshot.generation}</dd>
            </div>
            <div>
              <dt>Writer</dt>
              <dd>{snapshot.writer ? "this tab" : "another tab"}</dd>
            </div>
            <div>
              <dt>Recovered from</dt>
              <dd>{snapshot.recoverySource ?? "new game"}</dd>
            </div>
          </dl>
          <p>
            Accepted commands save after about 1 second, no later than 10
            seconds while changes continue. Passive progress checkpoints every
            30 seconds and when the page is hidden.
          </p>
          <div class="action-cluster">
            <button type="button" onClick={() => void store.save()}>
              Save now
            </button>
            <button type="button" onClick={() => store.load()}>
              Recover best save
            </button>
            <button type="button" onClick={() => store.export()}>
              Prepare export
            </button>
          </div>
          {snapshot.legacyFound ? (
            <aside class="legacy-note">
              <strong>Legacy v1 save detected</strong>
              <p>
                It remains untouched and is never interpreted as v2. You may
                export its raw text separately.
              </p>
              <button
                type="button"
                onClick={() => {
                  const text = store.exportLegacy();
                  if (text !== null) setImportText(text);
                }}
              >
                Show legacy raw export
              </button>
            </aside>
          ) : null}
        </section>
        <section class="settings-panel import-panel">
          <h3>Import or exported save</h3>
          <label htmlFor="import-save">
            Versioned JSON text
            <textarea
              id="import-save"
              rows={10}
              value={importText || snapshot.exportText}
              onInput={(event) => setImportText(event.currentTarget.value)}
              spellcheck={false}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const text = importText || snapshot.exportText;
              const result = store.previewImport(text);
              if (result.valid) onImportConfirm();
            }}
          >
            Validate and preview import
          </button>
          <p class="control-reason">
            Imports are size-limited, checksum-checked and validated before they
            can replace the current state. The current save is retained as a
            backup.
          </p>
        </section>
        {import.meta.env.DEV ? (
          <details class="settings-panel diagnostics-panel">
            <summary>Development diagnostics</summary>
            <p>
              This preserves the Phase 1 diagnostic entry point without putting
              it in normal player navigation.
            </p>
            <pre>
              {JSON.stringify(
                {
                  schema: state.schemaVersion,
                  content: state.contentVersion,
                  sequence: state.sequence,
                  logicalTimeMs: state.logicalTimeMs,
                  rngDraws: state.rng.draws,
                  diagnostics: state.diagnostics,
                  activeEffects: diagnostics,
                },
                null,
                2,
              )}
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function OfflineSummaryDialog({
  snapshot,
  onClose,
  onReview,
}: {
  snapshot: StoreSnapshot;
  onClose: () => void;
  onReview: () => void;
}) {
  const summary = snapshot.offlineSummary;
  if (!summary) return null;
  return (
    <Dialog
      title="Your saved plan advanced"
      description="One return summary records what happened while this game was not active."
      onClose={onClose}
      initialFocus="confirm"
    >
      <dl class="offline-ledger">
        <div>
          <dt>Away</dt>
          <dd>{formatElapsed(summary.elapsedMs)}</dd>
        </div>
        <div>
          <dt>Credited</dt>
          <dd>{formatElapsed(summary.creditedMs)}</dd>
        </div>
        <div>
          <dt>Precision change</dt>
          <dd>{formatGameNumber(summary.resourceChanges.PRECISION ?? 0)}</dd>
        </div>
        <div>
          <dt>Intuition change</dt>
          <dd>{formatGameNumber(summary.resourceChanges.INTUITION ?? 0)}</dd>
        </div>
        <div>
          <dt>Projects completed</dt>
          <dd>{summary.completedProjectIds.length}</dd>
        </div>
        <div>
          <dt>Milestones</dt>
          <dd>{summary.reachedMilestoneIds.length}</dd>
        </div>
      </dl>
      <section class="offline-policy">
        <h3>Policy trace</h3>
        <ul>
          {summary.policyTrace.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {summary.discardedMs > 0 ? (
          <p>
            {formatElapsed(summary.discardedMs)} exceeded the configured maximum
            credited window.
          </p>
        ) : null}
      </section>
      <div class="dialog-actions">
        <button type="button" data-dialog-cancel onClick={onClose}>
          Continue
        </button>
        <button
          type="button"
          class="primary-action"
          data-dialog-confirm
          onClick={onReview}
        >
          {summary.stoppedForDecision
            ? "Review next decision"
            : "Review current plan"}
        </button>
      </div>
    </Dialog>
  );
}

export function App({ store }: AppProperties) {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [view, setView] = useState<AppView>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId>(
    naturalNumbersContent.projects[0]!.id,
  );
  const [cancelProjectId, setCancelProjectId] = useState<ProjectId | null>(
    null,
  );
  const [switchRequest, setSwitchRequest] = useState<{
    projectId: ProjectId;
    approachId: ApproachId;
  } | null>(null);
  const [publicationConfirm, setPublicationConfirm] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importText, setImportText] = useState("");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(
    () => store.subscribe(() => setSnapshot(store.getSnapshot())),
    [store],
  );

  const state = snapshot.state;
  const disclosure = selectDisclosure(state);
  const views = availableViews(disclosure);
  const dispatch = (command: GameCommand) => store.dispatch(command);
  const navigate = (next: AppView, projectId?: ProjectId | null) => {
    if (projectId) setSelectedProjectId(projectId);
    setView(next);
    queueMicrotask(() => mainRef.current?.focus());
  };
  useEffect(() => {
    if (view !== "settings" && !views.includes(view)) setView("overview");
  }, [view, views]);

  const rootClass = [
    "app",
    state.settings.highContrast ? "high-contrast" : "",
    state.settings.reducedMotion ? "reduced-motion" : "",
    state.settings.textScale === "large" ? "large-text" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const activeRuntime = Object.values(state.projects).find(
    (project) => project.status === "active",
  );
  const recentImportantEvents = useMemo(
    () =>
      [...snapshot.events]
        .reverse()
        .filter((event) =>
          [
            "projectCompleted",
            "milestoneReached",
            "achievementRecorded",
            "chapterPublished",
          ].includes(event.type),
        )
        .slice(0, 3),
    [snapshot.events],
  );

  const renderView = () => {
    switch (view) {
      case "overview":
        return (
          <OverviewView
            state={state}
            disclosure={disclosure}
            dispatch={dispatch}
            onNavigate={navigate}
          />
        );
      case "study":
        return (
          <StudyView
            state={state}
            disclosure={disclosure}
            dispatch={dispatch}
          />
        );
      case "projects":
        return (
          <ProjectsView
            state={state}
            disclosure={disclosure}
            dispatch={dispatch}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onCancel={(id) => {
              if (state.settings.confirmations) setCancelProjectId(id);
              else
                dispatch({
                  type: "cancelProject",
                  payload: { projectId: id },
                });
            }}
            onSwitch={(projectId, approachId) => {
              const runtime = state.projects[projectId]!;
              if (
                runtime.progress > 0 &&
                state.settings.confirmations &&
                runtime.approachId !== approachId
              )
                setSwitchRequest({ projectId, approachId });
              else
                dispatch({
                  type: "switchProjectApproach",
                  payload: { projectId, approachId },
                });
            }}
          />
        );
      case "map":
        return (
          <>
            <ProofMap
              state={state}
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
            <CapstoneEdges state={state} dispatch={dispatch} />
          </>
        );
      case "upgrades":
        return <UpgradesView state={state} dispatch={dispatch} />;
      case "automation":
        return <AutomationView state={state} dispatch={dispatch} />;
      case "records":
        return <RecordsView state={state} />;
      case "publication":
        return (
          <PublicationView
            state={state}
            onPublish={() => setPublicationConfirm(true)}
          />
        );
      case "settings":
        return (
          <SettingsView
            state={state}
            snapshot={snapshot}
            store={store}
            importText={importText}
            setImportText={setImportText}
            onImportConfirm={() => setImportConfirm(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div class={rootClass}>
      <header class="app-header">
        <div class="brand-block">
          <span class="brand-mark" aria-hidden="true">
            ∴
          </span>
          <div>
            <strong>Analysis Idle</strong>
            <span>Natural Numbers</span>
          </div>
        </div>
        <div class="header-status">
          <span class={`save-dot save-${snapshot.saveState}`} />
          <span>
            {snapshot.writer
              ? snapshot.saveState === "saved"
                ? "Saved locally"
                : snapshot.saveState
              : "Viewing another tab’s game"}
          </span>
        </div>
        <button
          type="button"
          class="settings-button"
          aria-label="Open settings and save tools"
          aria-pressed={view === "settings"}
          onClick={() => navigate("settings")}
        >
          Settings
        </button>
      </header>

      <div class="app-frame">
        <aside class="chapter-rail">
          <div class="chapter-identity">
            <span class="chapter-number">01</span>
            <p class="kicker">Current chapter</p>
            <h1>Natural Numbers</h1>
            <p>Build a foundation from zero, successor and proof.</p>
          </div>
          <nav aria-label="Primary">
            {views.map((item) => (
              <button
                type="button"
                key={item}
                aria-current={view === item ? "page" : undefined}
                onClick={() => navigate(item)}
              >
                <span class="nav-index" aria-hidden="true">
                  {String(views.indexOf(item) + 1).padStart(2, "0")}
                </span>
                {viewLabels[item]}
              </button>
            ))}
          </nav>
          <div class="rail-footer">
            <span>Understanding</span>
            <strong>{formatGameNumber(state.understanding)} / 12</strong>
            <ProgressBar
              value={state.understanding / 12}
              label={`${formatGameNumber(state.understanding)} of 12 Understanding`}
            />
          </div>
        </aside>

        <main id="main" ref={mainRef} tabIndex={-1}>
          <div class="mobile-chapter-bar">
            <span>01 · Natural Numbers</span>
            <strong>{viewLabels[view]}</strong>
          </div>
          {renderView()}
          {disclosure.insight && view !== "settings" ? (
            <InsightPanel state={state} dispatch={dispatch} />
          ) : null}
        </main>

        <aside class="context-rail" aria-label="Current context">
          <section>
            <p class="kicker">Now</p>
            <h2>
              {activeRuntime
                ? naturalNumbersContent.projects.find(
                    (project) => project.id === activeRuntime.id,
                  )?.short
                : "Study plan active"}
            </h2>
            <p>
              {activeRuntime
                ? `${formatDuration(
                    selectProjectProgress(
                      state,
                      naturalNumbersContent,
                      activeRuntime.id,
                    ).etaSeconds,
                  )} remain.`
                : "Choose a project when its inputs are prepared."}
            </p>
          </section>
          {recentImportantEvents.length > 0 ? (
            <section>
              <p class="kicker">Recent</p>
              <ol class="recent-events">
                {recentImportantEvents.map((event, index) => (
                  <li key={`${event.type}-${index}`}>
                    {event.type === "projectCompleted"
                      ? `Completed ${naturalNumbersContent.projects.find((project) => project.id === event.projectId)?.short ?? event.projectId}`
                      : event.type === "milestoneReached"
                        ? milestoneTitle(event.milestoneId)
                        : event.type === "achievementRecorded"
                          ? achievementTitle(event.achievementId)
                          : "Foundations published"}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section class="context-help">
            <details>
              <summary>How this screen works</summary>
              <p>
                The main objective comes first. Open details only when you want
                costs, method reasoning or mathematical depth.
              </p>
            </details>
          </section>
        </aside>
      </div>

      <nav class="mobile-nav" aria-label="Primary mobile navigation">
        {views.slice(0, 5).map((item) => (
          <button
            type="button"
            key={item}
            aria-current={view === item ? "page" : undefined}
            onClick={() => navigate(item)}
          >
            {viewLabels[item]}
          </button>
        ))}
        <button
          type="button"
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => navigate("settings")}
        >
          More
        </button>
      </nav>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="status-announcer"
        data-testid="status-announcement"
      >
        {state.settings.announcementVerbosity === "all" ||
        /completed|milestone|achievement|published|FAILED|INVALID|decision/i.test(
          snapshot.statusMessage,
        )
          ? snapshot.statusMessage
          : ""}
      </p>

      {snapshot.offlineSummary ? (
        <OfflineSummaryDialog
          snapshot={snapshot}
          onClose={() => store.dismissOfflineSummary()}
          onReview={() => {
            store.dismissOfflineSummary();
            const objective = selectCurrentObjective(state);
            navigate(objective.targetView, objective.projectId);
          }}
        />
      ) : null}

      {cancelProjectId ? (
        <Dialog
          title="Cancel this project?"
          description="Cancellation returns every reserved input, removes it from the queue, and loses all project progress. Earned Technique from earlier completed projects remains."
          onClose={() => setCancelProjectId(null)}
        >
          <dl class="dialog-ledger">
            <div>
              <dt>Precision refunded</dt>
              <dd>
                {formatGameNumber(
                  state.projects[cancelProjectId]?.reservedPrecision ?? 0,
                )}
              </dd>
            </div>
            <div>
              <dt>Intuition refunded</dt>
              <dd>
                {formatGameNumber(
                  state.projects[cancelProjectId]?.reservedIntuition ?? 0,
                )}
              </dd>
            </div>
            <div>
              <dt>Progress lost</dt>
              <dd>
                {formatGameNumber(
                  state.projects[cancelProjectId]?.progress ?? 0,
                )}{" "}
                work
              </dd>
            </div>
          </dl>
          <div class="dialog-actions">
            <button
              type="button"
              data-dialog-cancel
              onClick={() => setCancelProjectId(null)}
            >
              Keep project
            </button>
            <button
              type="button"
              class="danger-action"
              data-dialog-confirm
              onClick={() => {
                dispatch({
                  type: "cancelProject",
                  payload: { projectId: cancelProjectId },
                });
                setCancelProjectId(null);
              }}
            >
              Cancel and refund
            </button>
          </div>
        </Dialog>
      ) : null}

      {switchRequest ? (
        <Dialog
          title="Switch project method?"
          description={`Inputs remain reserved. The engine preserves ${formatPercent(
            naturalNumbersContent.configuration.projects
              .approachSwitchPreservation,
          )} of equivalent completed work under the new method.`}
          onClose={() => setSwitchRequest(null)}
        >
          <div class="dialog-actions">
            <button
              type="button"
              data-dialog-cancel
              onClick={() => setSwitchRequest(null)}
            >
              Keep current method
            </button>
            <button
              type="button"
              class="primary-action"
              data-dialog-confirm
              onClick={() => {
                dispatch({
                  type: "switchProjectApproach",
                  payload: switchRequest,
                });
                setSwitchRequest(null);
              }}
            >
              Switch to {getApproachCopy(switchRequest.approachId).title}
            </button>
          </div>
        </Dialog>
      ) : null}

      {publicationConfirm ? (
        <Dialog
          title="Publish Foundations of the Natural Numbers?"
          description="This commits the exact reset, retention, transformation and archive ledger shown on the Publication screen. The action saves immediately."
          onClose={() => setPublicationConfirm(false)}
        >
          <p>
            Retained: settings, records, automation, Attention capacity, Insight
            and published methods. Reset: chapter stocks, allocations, active
            plans, reserves and routine modifiers.
          </p>
          <div class="dialog-actions">
            <button
              type="button"
              data-dialog-cancel
              onClick={() => setPublicationConfirm(false)}
            >
              Review again
            </button>
            <button
              type="button"
              class="primary-action"
              data-dialog-confirm
              onClick={() => {
                dispatch({
                  type: "publishChapter",
                  payload: { chapterId: naturalNumbersIds.CHAPTER },
                });
                setPublicationConfirm(false);
              }}
            >
              Publish chapter
            </button>
          </div>
        </Dialog>
      ) : null}

      {importConfirm ? (
        <Dialog
          title="Replace the current game with this import?"
          description="The validated import will receive a new generation. Your current game is preserved in rotating recovery history first."
          onClose={() => setImportConfirm(false)}
        >
          <div class="dialog-actions">
            <button
              type="button"
              data-dialog-cancel
              onClick={() => setImportConfirm(false)}
            >
              Keep current game
            </button>
            <button
              type="button"
              class="primary-action"
              data-dialog-confirm
              onClick={() => {
                store.import(importText || snapshot.exportText);
                setImportConfirm(false);
              }}
            >
              Confirm import
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

export const asProjectId = (value: string): ProjectId => value as ProjectId;
export const asApproachId = (value: string): ApproachId => value as ApproachId;
