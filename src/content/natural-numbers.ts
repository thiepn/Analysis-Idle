import type {
  AccessibleText,
  AchievementDefinition,
  ActivityDefinition,
  ApproachDefinition,
  ChapterDefinition,
  ConditionDefinition,
  ContentMetadata,
  EffectDefinition,
  EffectOperation,
  EffectTarget,
  GameContent,
  MilestoneDefinition,
  ProjectDefinition,
  ResourceId,
  ResourceDefinition,
  TechniqueArtifactDefinition,
  UpgradeDefinition,
} from "../shared/contracts";
import { id } from "../shared/contracts";

const designSource = "docs/design/NATURAL_NUMBERS_CONTENT.md";
const mathematicalSource =
  "docs/research/MATHEMATICAL_SOURCES.md#natural-numbers";
const accessible = (short: string, accessibleText = short): AccessibleText => ({
  short,
  accessible: accessibleText,
});
const metadata = (
  short: string,
  balanceTestId: string,
  source = designSource,
): ContentMetadata => ({
  ...accessible(short),
  designSource: source,
  mathematicalSource,
  status: "PROVISIONAL",
  balanceTestId,
});
const always: ConditionDefinition = {
  type: "constant",
  value: true,
  text: accessible("Available"),
};
const projectComplete = (projectId: string): ConditionDefinition => ({
  type: "projectCompleted",
  projectId: id<"ProjectId">(projectId),
  text: accessible(
    `Complete ${projectId}`,
    `Complete the ${projectId} project.`,
  ),
});
const projectStarted = (projectId: string): ConditionDefinition => ({
  type: "projectStarted",
  projectId: id<"ProjectId">(projectId),
  text: accessible(`Start ${projectId}`, `Start the ${projectId} project.`),
});
const recordAtLeast = (
  record: Extract<ConditionDefinition, { type: "recordAtLeast" }>["record"],
  short: string,
): ConditionDefinition => ({
  type: "recordAtLeast",
  record,
  amount: 1,
  text: accessible(short),
});
const artifactOwned = (artifactId: string): ConditionDefinition => ({
  type: "techniqueArtifactOwned",
  artifactId: id<"TechniqueArtifactId">(artifactId),
  text: accessible(
    `Own ${artifactId}`,
    `Own the ${artifactId} Technique artifact.`,
  ),
});
const all = (...conditions: ConditionDefinition[]): ConditionDefinition => ({
  type: "all",
  conditions,
  text: accessible("Meet all requirements"),
});

const PRECISION = id<"ResourceId">("PRECISION");
const INTUITION = id<"ResourceId">("INTUITION");
const FORMALIZE = id<"ActivityId">("FORMALIZE");
const EXPLORE = id<"ActivityId">("EXPLORE");
const FORMAL = id<"ApproachId">("FORMAL");
const EXPLORATORY = id<"ApproachId">("EXPLORATORY");
const CONSTRUCTIVE = id<"ApproachId">("CONSTRUCTIVE");
const CHAPTER = id<"ChapterId">("nn.chapter.natural_numbers");

const resources: ResourceDefinition[] = [
  {
    id: PRECISION,
    ...metadata("Precision", "resource-precision"),
    unit: "precision",
    initialValue: 0,
    cap: 180,
    sourceActivityIds: [FORMALIZE],
    permittedSinks: ["project", "upgrade"],
    resetLayer: "chapter",
    publicationBehavior: "reset",
    offlineBehavior: "produce",
  },
  {
    id: INTUITION,
    ...metadata("Intuition", "resource-intuition"),
    unit: "intuition",
    initialValue: 0,
    cap: 150,
    sourceActivityIds: [EXPLORE],
    permittedSinks: ["project", "upgrade"],
    resetLayer: "chapter",
    publicationBehavior: "reset",
    offlineBehavior: "produce",
  },
];

const activities: ActivityDefinition[] = [
  {
    id: FORMALIZE,
    ...metadata("Formalize", "activity-formalize"),
    resourceId: PRECISION,
    baseRatePerSecond: 0.25,
    initiallyUnlocked: true,
    resetLayer: "chapter",
  },
  {
    id: EXPLORE,
    ...metadata("Explore", "activity-explore"),
    resourceId: INTUITION,
    baseRatePerSecond: 0.2,
    initiallyUnlocked: false,
    resetLayer: "chapter",
  },
];

const approaches: ApproachDefinition[] = [
  {
    id: FORMAL,
    ...metadata("Formal", "approach-formal"),
    precisionRequirementMultiplier: 1.25,
    intuitionRequirementMultiplier: 0.9,
    workMultiplier: 0.95,
    outputKind: "lemma",
  },
  {
    id: EXPLORATORY,
    ...metadata("Exploratory", "approach-exploratory"),
    precisionRequirementMultiplier: 0.9,
    intuitionRequirementMultiplier: 1.25,
    workMultiplier: 1,
    outputKind: "reveal",
  },
  {
    id: CONSTRUCTIVE,
    ...metadata("Constructive", "approach-constructive"),
    precisionRequirementMultiplier: 1.05,
    intuitionRequirementMultiplier: 1.05,
    workMultiplier: 1.05,
    outputKind: "template",
  },
];

interface ProjectSeed {
  key: string;
  title: string;
  prerequisites: string[];
  precision: number;
  intuition: number;
  work: number;
  reward: number;
  insight?: number;
}

const projectSeeds: ProjectSeed[] = [
  {
    key: "zero_successor",
    title: "Zero and Successor",
    prerequisites: [],
    precision: 12,
    intuition: 0,
    work: 45,
    reward: 1,
  },
  {
    key: "peano_frame",
    title: "Peano Frame",
    prerequisites: ["zero_successor"],
    precision: 28,
    intuition: 12,
    work: 120,
    reward: 1,
  },
  {
    key: "primitive_recursion",
    title: "Primitive Recursion",
    prerequisites: ["peano_frame"],
    precision: 45,
    intuition: 26,
    work: 210,
    reward: 1,
  },
  {
    key: "addition",
    title: "Define Addition",
    prerequisites: ["primitive_recursion"],
    precision: 68,
    intuition: 38,
    work: 300,
    reward: 1,
  },
  {
    key: "addition_lemmas",
    title: "Addition Lemmas",
    prerequisites: ["addition", "peano_frame"],
    precision: 92,
    intuition: 44,
    work: 360,
    reward: 1,
  },
  {
    key: "multiplication",
    title: "Define Multiplication",
    prerequisites: ["addition", "primitive_recursion"],
    precision: 85,
    intuition: 62,
    work: 420,
    reward: 1,
  },
  {
    key: "induction_walkthrough",
    title: "Induction Walkthrough",
    prerequisites: ["peano_frame", "addition"],
    precision: 110,
    intuition: 75,
    work: 480,
    reward: 1,
  },
  {
    key: "counterexample_lab",
    title: "Missing Base, Missing Step",
    prerequisites: ["induction_walkthrough"],
    precision: 55,
    intuition: 125,
    work: 300,
    reward: 1,
    insight: 1,
  },
  {
    key: "strong_induction",
    title: "Strong Induction",
    prerequisites: ["induction_walkthrough"],
    precision: 135,
    intuition: 95,
    work: 540,
    reward: 1,
    insight: 1,
  },
  {
    key: "well_ordering",
    title: "Well-Ordering",
    prerequisites: ["induction_walkthrough"],
    precision: 150,
    intuition: 105,
    work: 600,
    reward: 1,
  },
  {
    key: "least_counterexample",
    title: "Least Counterexample",
    prerequisites: ["well_ordering", "counterexample_lab"],
    precision: 120,
    intuition: 150,
    work: 540,
    reward: 1,
    insight: 1,
  },
  {
    key: "equivalence_capstone",
    title: "Equivalent Foundations",
    prerequisites: [
      "strong_induction",
      "well_ordering",
      "least_counterexample",
      "addition_lemmas",
    ],
    precision: 240,
    intuition: 210,
    work: 900,
    reward: 1,
    insight: 1,
  },
];

const projectId = (key: string) => id<"ProjectId">(`nn.project.${key}`);
const artifactId = (key: string) =>
  id<"TechniqueArtifactId">(`nn.artifact.${key}`);

const techniqueArtifacts: TechniqueArtifactDefinition[] = projectSeeds.map(
  (seed, index) => ({
    id: artifactId(seed.key),
    ...metadata(`${seed.title} method`, `artifact-${seed.key}`),
    kind:
      index % 4 === 0
        ? "exerciseRecord"
        : index % 4 === 1
          ? "preparedStep"
          : index % 4 === 2
            ? "proofTemplate"
            : "reusableMethod",
    sourceProjectId: projectId(seed.key),
    compatibleProjectIds: projectSeeds
      .slice(index + 1)
      .filter((candidate) => candidate.prerequisites.includes(seed.key))
      .map((candidate) => projectId(candidate.key)),
    prerequisites: projectComplete(`nn.project.${seed.key}`),
    resetLayer: "publication",
    publicationBehavior: index >= 6 ? "retain" : "archive",
    removalBehavior: "disableMatching",
  }),
);

const projects: ProjectDefinition[] = projectSeeds.map((seed) => ({
  id: projectId(seed.key),
  ...metadata(
    seed.title,
    `project-${seed.key}`,
    "docs/design/NATURAL_NUMBERS_PROJECTS.md",
  ),
  chapterId: CHAPTER,
  prerequisiteProjectIds: seed.prerequisites.map(projectId),
  precisionRequirement: seed.precision,
  intuitionRequirement: seed.intuition,
  techniqueRequirements:
    seed.key === "equivalence_capstone"
      ? [
          artifactId("strong_induction"),
          artifactId("well_ordering"),
          artifactId("least_counterexample"),
        ]
      : [],
  workRequired: seed.work,
  allowedApproachIds: [FORMAL, EXPLORATORY, CONSTRUCTIVE],
  outputArtifactIds: [artifactId(seed.key)],
  understandingReward: seed.reward,
  insightReward: seed.insight ?? 0,
  resetLayer: "chapter",
  publicationBehavior: "archive",
}));

const cost = (
  precision: number,
  intuition: number,
): Record<ResourceId, number> => ({
  [PRECISION]: precision,
  [INTUITION]: intuition,
});
const effect = (
  effectId: string,
  sourceId: string,
  target: EffectTarget,
  operation: EffectOperation,
  magnitude: number,
  stackingGroup: string,
): EffectDefinition => ({
  id: id<"EffectId">(effectId),
  ...metadata(
    effectId,
    `effect-${effectId}`,
    "docs/balance/NATURAL_NUMBERS_UPGRADES.md",
  ),
  source: { kind: "upgrade", id: sourceId },
  activation: always,
  target,
  operation,
  magnitude,
  stackingGroup,
  priority: 100,
  cap: null,
  resetLayer: "chapter",
  publicationBehavior: "reset",
});

interface UpgradeSeed {
  id: string;
  category: UpgradeDefinition["category"];
  tier: number;
  precision: number;
  intuition: number;
  unlock: ConditionDefinition;
  effects: EffectDefinition[];
  purpose: string;
}

const upgradeSeeds: UpgradeSeed[] = [
  {
    id: "nn.info.rate_ledger",
    category: "information",
    tier: 0,
    precision: 0,
    intuition: 0,
    unlock: always,
    effects: [
      effect(
        "nn.effect.rate_ledger",
        "nn.info.rate_ledger",
        { kind: "information", capability: "rateLedger" },
        "informationUnlock",
        1,
        "information.rate",
      ),
    ],
    purpose: "Explain marginal rates and estimates.",
  },
  {
    id: "nn.activity.explore",
    category: "milestone",
    tier: 0,
    precision: 0,
    intuition: 0,
    unlock: projectComplete("nn.project.zero_successor"),
    effects: [
      effect(
        "nn.effect.explore_unlock",
        "nn.activity.explore",
        { kind: "information", capability: `activity:${EXPLORE}` },
        "informationUnlock",
        1,
        "activity.unlock",
      ),
    ],
    purpose: "Reveal the Intuition activity.",
  },
  {
    id: "nn.routine.notation_discipline",
    category: "routine",
    tier: 1,
    precision: 24,
    intuition: 8,
    unlock: projectComplete("nn.project.peano_frame"),
    effects: [
      effect(
        "nn.effect.notation_discipline",
        "nn.routine.notation_discipline",
        { kind: "activityRate", id: FORMALIZE },
        "namedMultiply",
        1.2,
        "activity.base.precision",
      ),
    ],
    purpose: "Accelerate Precision locally.",
  },
  {
    id: "nn.routine.variant_library",
    category: "routine",
    tier: 1,
    precision: 12,
    intuition: 24,
    unlock: projectComplete("nn.project.peano_frame"),
    effects: [
      effect(
        "nn.effect.variant_library",
        "nn.routine.variant_library",
        { kind: "activityRate", id: EXPLORE },
        "namedMultiply",
        1.2,
        "activity.base.intuition",
      ),
    ],
    purpose: "Accelerate Intuition locally.",
  },
  {
    id: "nn.automation.queue_one",
    category: "automation",
    tier: 1,
    precision: 35,
    intuition: 20,
    unlock: projectComplete("nn.project.primitive_recursion"),
    effects: [
      effect(
        "nn.effect.queue_one",
        "nn.automation.queue_one",
        { kind: "automation", capability: "queue" },
        "automationUnlock",
        1,
        "automation.queue",
      ),
    ],
    purpose: "Queue a next project.",
  },
  {
    id: "nn.info.dependency_trace",
    category: "information",
    tier: 1,
    precision: 45,
    intuition: 35,
    unlock: projectComplete("nn.project.addition"),
    effects: [
      effect(
        "nn.effect.dependency_trace",
        "nn.info.dependency_trace",
        { kind: "information", capability: "dependencyTrace" },
        "informationUnlock",
        1,
        "information.dependencies",
      ),
    ],
    purpose: "Expose downstream requirements.",
  },
  {
    id: "nn.keystone.recursion_template",
    category: "keystone",
    tier: 2,
    precision: 60,
    intuition: 45,
    unlock: all(
      projectComplete("nn.project.primitive_recursion"),
      artifactOwned("nn.artifact.primitive_recursion"),
    ),
    effects: [
      effect(
        "nn.effect.recursion_template",
        "nn.keystone.recursion_template",
        { kind: "information", capability: "technique:recursionTemplate" },
        "informationUnlock",
        1,
        "project.method.recursion",
      ),
    ],
    purpose: "Reuse matching recursive setup steps.",
  },
  {
    id: "nn.keystone.lemma_reuse",
    category: "keystone",
    tier: 2,
    precision: 75,
    intuition: 50,
    unlock: all(
      projectComplete("nn.project.addition_lemmas"),
      artifactOwned("nn.artifact.addition_lemmas"),
    ),
    effects: [
      effect(
        "nn.effect.lemma_reuse",
        "nn.keystone.lemma_reuse",
        { kind: "information", capability: "technique:lemmaReuse" },
        "informationUnlock",
        1,
        "project.method.lemma",
      ),
    ],
    purpose: "Reuse matching lemma obligations.",
  },
  {
    id: "nn.automation.completion_rule",
    category: "automation",
    tier: 2,
    precision: 55,
    intuition: 55,
    unlock: projectComplete("nn.project.induction_walkthrough"),
    effects: [
      effect(
        "nn.effect.completion_rule",
        "nn.automation.completion_rule",
        { kind: "automation", capability: "completionBehavior" },
        "automationUnlock",
        1,
        "automation.completion",
      ),
    ],
    purpose: "Select pause or start-next behavior.",
  },
  {
    id: "nn.active.insight_notebook",
    category: "active",
    tier: 2,
    precision: 40,
    intuition: 70,
    unlock: projectComplete("nn.project.counterexample_lab"),
    effects: [
      effect(
        "nn.effect.insight_notebook",
        "nn.active.insight_notebook",
        { kind: "information", capability: "insightActions" },
        "informationUnlock",
        1,
        "active.insight",
      ),
    ],
    purpose: "Expose bounded stored-agency actions.",
  },
  {
    id: "nn.capacity.fourth_attention",
    category: "capacity",
    tier: 2,
    precision: 90,
    intuition: 90,
    unlock: all(projectComplete("nn.project.induction_walkthrough"), {
      type: "understandingAtLeast",
      amount: 6,
      text: accessible("Reach six Understanding"),
    }),
    effects: [
      effect(
        "nn.effect.fourth_attention",
        "nn.capacity.fourth_attention",
        { kind: "attentionCapacity" },
        "capacityAdd",
        1,
        "attention.capacity",
      ),
    ],
    purpose: "Add one allocation slot after six core Understanding awards.",
  },
  {
    id: "nn.automation.resource_reserve",
    category: "automation",
    tier: 3,
    precision: 80,
    intuition: 65,
    unlock: projectComplete("nn.project.well_ordering"),
    effects: [
      effect(
        "nn.effect.resource_reserve",
        "nn.automation.resource_reserve",
        { kind: "automation", capability: "resourceReserve" },
        "automationUnlock",
        1,
        "automation.reserve",
      ),
    ],
    purpose: "Protect a minimum stock from automation.",
  },
  {
    id: "nn.info.effect_decomposition",
    category: "information",
    tier: 3,
    precision: 70,
    intuition: 85,
    unlock: projectComplete("nn.project.strong_induction"),
    effects: [
      effect(
        "nn.effect.effect_decomposition",
        "nn.info.effect_decomposition",
        { kind: "information", capability: "effectDecomposition" },
        "informationUnlock",
        1,
        "information.effects",
      ),
    ],
    purpose: "Show the stable effect ledger.",
  },
  {
    id: "nn.capstone.equivalence_map",
    category: "capstone",
    tier: 4,
    precision: 130,
    intuition: 130,
    unlock: all(
      artifactOwned("nn.artifact.strong_induction"),
      artifactOwned("nn.artifact.well_ordering"),
      artifactOwned("nn.artifact.least_counterexample"),
      artifactOwned("nn.artifact.addition_lemmas"),
    ),
    effects: [
      effect(
        "nn.effect.equivalence_map",
        "nn.capstone.equivalence_map",
        { kind: "information", capability: "capstoneEdges" },
        "informationUnlock",
        1,
        "capstone.map",
      ),
    ],
    purpose: "Assign implication edges.",
  },
  {
    id: "nn.compression.publication_index",
    category: "compression",
    tier: 4,
    precision: 0,
    intuition: 0,
    unlock: projectComplete("nn.project.equivalence_capstone"),
    effects: [
      effect(
        "nn.effect.publication_index",
        "nn.compression.publication_index",
        { kind: "publication", chapterId: CHAPTER },
        "publicationTransform",
        1,
        "publication.ledger",
      ),
    ],
    purpose: "Preview the exact Publication matrix.",
  },
];

const upgrades: UpgradeDefinition[] = upgradeSeeds.map((seed) => ({
  id: id<"UpgradeId">(seed.id),
  ...metadata(
    seed.id,
    `upgrade-${seed.id}`,
    "docs/balance/NATURAL_NUMBERS_UPGRADES.md",
  ),
  category: seed.category,
  tier: seed.tier,
  cost: cost(seed.precision, seed.intuition),
  unlockCondition: seed.unlock,
  effects: seed.effects,
  resetLayer: seed.category === "routine" ? "chapter" : "publication",
  publicationBehavior: seed.category === "routine" ? "reset" : "retain",
  strategicPurpose: seed.purpose,
}));

const milestoneSeeds: [string, ConditionDefinition][] = [
  ["zero_named", projectStarted("nn.project.zero_successor")],
  ["successor_closed", projectComplete("nn.project.zero_successor")],
  ["peano_framed", projectComplete("nn.project.peano_frame")],
  ["recursion_available", projectComplete("nn.project.primitive_recursion")],
  [
    "operations_built",
    all(
      projectComplete("nn.project.addition"),
      projectComplete("nn.project.multiplication"),
    ),
  ],
  ["approach_selected", projectStarted("nn.project.induction_walkthrough")],
  ["induction_template", projectComplete("nn.project.induction_walkthrough")],
  ["stronger_hypothesis", projectComplete("nn.project.strong_induction")],
  ["least_element", projectComplete("nn.project.well_ordering")],
  [
    "equivalent_foundations",
    projectComplete("nn.project.equivalence_capstone"),
  ],
  [
    "published",
    {
      type: "chapterStatus",
      chapterId: CHAPTER,
      status: "published",
      text: accessible("Publish Natural Numbers"),
    },
  ],
];
const milestones: MilestoneDefinition[] = milestoneSeeds.map(
  ([key, condition]) => {
    const milestoneId = id<"MilestoneId">(`nn.milestone.${key}`);
    const capEffects: EffectDefinition[] =
      key === "operations_built"
        ? (
            [
              ["PRECISION", PRECISION, 420],
              ["INTUITION", INTUITION, 360],
            ] as const
          ).map(([label, resourceId, cap]) => ({
            id: id<"EffectId">(
              `nn.effect.operations_cap.${label.toLowerCase()}`,
            ),
            ...metadata(
              `Post-operations ${label} cap`,
              `effect-operations-cap-${label.toLowerCase()}`,
              "docs/balance/NATURAL_NUMBERS_BALANCE.md",
            ),
            source: { kind: "milestone", id: milestoneId },
            activation: {
              type: "all",
              conditions: [
                {
                  type: "milestoneReached",
                  milestoneId,
                  text: accessible("Operations built"),
                },
                {
                  type: "chapterStatus",
                  chapterId: CHAPTER,
                  status: "active",
                  text: accessible("Natural Numbers chapter active"),
                },
              ],
              text: accessible("Post-operations cap active"),
            },
            target: { kind: "resourceCap", id: resourceId },
            operation: "cap",
            magnitude: cap,
            stackingGroup: `resource.cap.${label.toLowerCase()}`,
            priority: 100,
            cap: null,
            resetLayer: "chapter",
            publicationBehavior: "reset",
          }))
        : [];
    return {
      id: milestoneId,
      ...metadata(
        key,
        `milestone-${key}`,
        "docs/design/NATURAL_NUMBERS_MILESTONES.md",
      ),
      condition,
      effects: capEffects,
      resetLayer: "never",
      publicationBehavior: "retain",
    };
  },
);

const achievementSeeds: [
  string,
  ConditionDefinition,
  AchievementDefinition["rewardClass"],
][] = [
  [
    "first_successor",
    projectComplete("nn.project.zero_successor"),
    "badgeHistory",
  ],
  ["peano_frame", projectComplete("nn.project.peano_frame"), "badgeHistory"],
  [
    "two_ways_forward",
    recordAtLeast("approachComparisons", "Compare two project approaches"),
    "nonPowerRecords",
  ],
  [
    "exact_hypothesis",
    recordAtLeast(
      "exactDependencyCompletions",
      "Complete a project with exact dependencies",
    ),
    "badgeHistory",
  ],
  [
    "counterexample_found",
    projectComplete("nn.project.counterexample_lab"),
    "nonPowerInformation",
  ],
  [
    "without_shortcut",
    recordAtLeast(
      "projectsCompletedWithoutInsight",
      "Complete a project without Insight",
    ),
    "badgeHistory",
  ],
  [
    "patient_plan",
    recordAtLeast(
      "offlineQueuedCompletions",
      "Complete an offline queued transition",
    ),
    "badgeHistory",
  ],
  ["least_of_all", projectComplete("nn.project.well_ordering"), "badgeHistory"],
  [
    "full_circle",
    recordAtLeast("validCapstones", "Assemble every valid implication edge"),
    "badgeHistory",
  ],
  [
    "published_foundations",
    {
      type: "chapterStatus",
      chapterId: CHAPTER,
      status: "published",
      text: accessible("Publish Natural Numbers"),
    },
    "nonPowerAccess",
  ],
];
const achievements: AchievementDefinition[] = achievementSeeds.map(
  ([key, condition, rewardClass]) => ({
    id: id<"AchievementId">(`nn.achievement.${key}`),
    ...metadata(
      key,
      `achievement-${key}`,
      "docs/design/NATURAL_NUMBERS_ACHIEVEMENTS.md",
    ),
    condition,
    rewardClass,
    resetLayer: "never",
    publicationBehavior: "retain",
  }),
);

const edgeDefinitions = [
  ["well_ordering", "ordinary induction", "Well-Ordering"],
  ["least_counterexample", "Well-Ordering", "least-counterexample reasoning"],
  ["addition_lemmas", "strong induction", "ordinary induction"],
  ["strong_induction", "ordinary induction", "strong induction"],
] as const;
const chapter: ChapterDefinition = {
  id: CHAPTER,
  ...metadata("Natural Numbers", "chapter-natural-numbers"),
  projectIds: projects.map((project) => project.id),
  capstoneEdges: edgeDefinitions.map(
    ([key, fromConcept, toConcept], index) => ({
      id: id<"CapstoneEdgeId">(`nn.capstone.edge.${index + 1}`),
      ...metadata(
        `Implication edge ${index + 1}`,
        `capstone-edge-${index + 1}`,
      ),
      requiredArtifactId: artifactId(key),
      fromConcept,
      toConcept,
      relationship: "implication",
    }),
  ),
  publication: {
    chapterId: CHAPTER,
    ...metadata("Publish Natural Numbers", "publication-natural-numbers"),
    requiredProjectIds: projectSeeds.map((seed) => projectId(seed.key)),
    requiredCapstoneEdgeIds: [1, 2, 3, 4].map((index) =>
      id<"CapstoneEdgeId">(`nn.capstone.edge.${index}`),
    ),
    masteryArtifactId: "mastery.induction_framework",
    resetResourceIds: [PRECISION, INTUITION],
    retainedArtifactIds: [
      artifactId("addition_lemmas"),
      artifactId("strong_induction"),
      artifactId("well_ordering"),
      artifactId("least_counterexample"),
    ],
  },
};

export const naturalNumbersContent: GameContent = {
  schemaVersion: 1,
  contentVersion: "phase1-nn-fixture-1",
  configuration: {
    attention: {
      startingCapacity: 3,
      maximumCapacity: 4,
      activityExponent: 0.8,
    },
    insight: {
      cap: 3,
      sustainedTargetMin: 0.1,
      sustainedTargetMax: 0.15,
      ceiling: 0.2,
      modifierPerInsight: 0.1,
      modifierDurationSeconds: 60,
    },
    automation: { queueCapacity: 1 },
    offline: {
      fullEfficiencyHours: 12,
      tailEfficiency: 0.25,
      maximumCreditedHours: 72,
    },
    pacing: {
      firstPublicationMinMinutes: 60,
      firstPublicationMaxMinutes: 120,
      campaignMinHours: 30,
      campaignMaxHours: 50,
    },
    projects: {
      approachSwitchPreservation: 0.9,
      baseSpeedPerSecond: 1,
      techniqueOutputBonuses: {
        lemmaPrecisionDiscount: 0.1,
        revealIntuitionDiscount: 0.1,
        templateWorkDiscount: 0.1,
      },
    },
  },
  resources,
  activities,
  approaches,
  techniqueArtifacts,
  projects,
  upgrades,
  milestones,
  achievements,
  chapters: [chapter],
};

export const naturalNumbersIds = {
  PRECISION,
  INTUITION,
  FORMALIZE,
  EXPLORE,
  FORMAL,
  EXPLORATORY,
  CONSTRUCTIVE,
  CHAPTER,
} as const;
