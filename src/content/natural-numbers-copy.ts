import type {
  AchievementId,
  ApproachId,
  MilestoneId,
  ProjectId,
  TechniqueArtifactKind,
} from "../shared/contracts";

export interface ProjectPresentation {
  concept: string;
  gameplay: string;
  mathematics: string;
  deeper: string;
  nodeType: "definition" | "exercise" | "lemma" | "proof" | "capstone";
}

export const naturalNumbersConvention = {
  short: "This chapter includes zero in the natural numbers.",
  accessible:
    "We use the convention that the natural numbers are zero, one, two, and so on. Some books begin at one; this game begins at zero.",
  source:
    "Tao, Analysis I; Enderton, A Mathematical Introduction to Logic; Open Logic Project.",
};

const projectCopy: Record<string, ProjectPresentation> = {
  "nn.project.zero_successor": {
    concept: "Definition",
    gameplay: "Name the starting point and the operation that moves forward.",
    mathematics:
      "Zero is a natural number. Every natural number has a successor, and zero is not the successor of another natural number.",
    deeper:
      "Successor is injective in the Peano-style frame used by this chapter.",
    nodeType: "definition",
  },
  "nn.project.peano_frame": {
    concept: "Foundational assumptions",
    gameplay: "Establish the shared rules that make later projects valid.",
    mathematics:
      "The chapter records a Peano-style formulation with zero, successor, and induction. The exact number of axioms depends on formulation.",
    deeper:
      "Induction is an explicit principle here; it is not derived from successor alone.",
    nodeType: "definition",
  },
  "nn.project.primitive_recursion": {
    concept: "Recursive definition",
    gameplay: "Prepare a reusable pattern for defining operations.",
    mathematics:
      "A base value and a successor rule determine a function on the natural numbers under the stated recursion principle.",
    deeper:
      "Existence and uniqueness come from the recursion principle, not from notation alone.",
    nodeType: "proof",
  },
  "nn.project.addition": {
    concept: "Definition",
    gameplay: "Build addition from the recursion template.",
    mathematics:
      "Addition is defined by n plus zero equals n, and n plus the successor of m equals the successor of n plus m.",
    deeper: "The recursion is on the second input in the convention used here.",
    nodeType: "definition",
  },
  "nn.project.addition_lemmas": {
    concept: "Lemma set",
    gameplay: "Record reusable obligations for later proofs.",
    mathematics:
      "Identity, successor, and associativity properties become reusable lemmas once their dependencies are established.",
    deeper:
      "A lemma is reusable only where its stated assumptions and conclusion match.",
    nodeType: "lemma",
  },
  "nn.project.multiplication": {
    concept: "Definition",
    gameplay: "Use addition to define a second operation.",
    mathematics:
      "Multiplication is defined by n times zero equals zero, and n times the successor of m equals n times m plus n.",
    deeper:
      "Repeated addition is useful intuition, while recursion supplies the complete definition.",
    nodeType: "definition",
  },
  "nn.project.induction_walkthrough": {
    concept: "Proof method",
    gameplay: "Choose how to prepare a base case and induction step.",
    mathematics:
      "Ordinary induction combines a base case with a step from n to its successor.",
    deeper:
      "Both obligations matter: a step without a base, or a base without a step, cannot establish every case.",
    nodeType: "proof",
  },
  "nn.project.counterexample_lab": {
    concept: "Exercise",
    gameplay: "Test what fails when a proof obligation is missing.",
    mathematics:
      "Counterexamples show why the base case and induction step are separate requirements.",
    deeper:
      "This is an explanatory exercise, not a quiz or destructive failure state.",
    nodeType: "exercise",
  },
  "nn.project.strong_induction": {
    concept: "Proof method",
    gameplay: "Prepare a hypothesis that can refer to all earlier cases.",
    mathematics:
      "Strong induction may assume every earlier case in the step; in this setting it has the same proving power as ordinary induction.",
    deeper: "Some strong-induction proofs require more than one base case.",
    nodeType: "proof",
  },
  "nn.project.well_ordering": {
    concept: "Principle",
    gameplay: "Establish a least-element method for nonempty sets.",
    mathematics:
      "Every nonempty subset of the natural numbers has a least element.",
    deeper:
      "Multiplication is chapter content, but it is not a mathematical prerequisite for Well-Ordering.",
    nodeType: "proof",
  },
  "nn.project.least_counterexample": {
    concept: "Proof method",
    gameplay: "Turn a hypothetical failure into a contradiction.",
    mathematics:
      "If a counterexample set were nonempty, its least member would conflict with the induction-style step.",
    deeper:
      "This connects Well-Ordering to induction through an explicit implication.",
    nodeType: "proof",
  },
  "nn.project.equivalence_capstone": {
    concept: "Capstone",
    gameplay: "Assemble four valid implication edges using earned methods.",
    mathematics:
      "Ordinary induction, strong induction, Well-Ordering, and least-counterexample reasoning are equivalent under the stated background assumptions.",
    deeper:
      "Resources fund the work, but resources alone cannot validate the implication map.",
    nodeType: "capstone",
  },
};

export const getProjectPresentation = (
  projectId: ProjectId | string,
): ProjectPresentation =>
  projectCopy[projectId] ?? {
    concept: "Project",
    gameplay: "Advance the current mathematical plan.",
    mathematics: "This project uses the chapter's stated assumptions.",
    deeper: "Inspect its prerequisites and method artifact for exact details.",
    nodeType: "proof",
  };

export const artifactKindLabels: Record<TechniqueArtifactKind, string> = {
  exerciseRecord: "Exercise record",
  preparedStep: "Prepared step",
  proofTemplate: "Proof template",
  reusableMethod: "Reusable method",
};

export const approachCopy = {
  FORMAL: {
    title: "Formal",
    use: "Best when explicit obligations and a reusable lemma matter.",
    output: "Records an auditable lemma artifact.",
  },
  EXPLORATORY: {
    title: "Exploratory",
    use: "Best when downstream information and examples matter.",
    output: "Records a requirement or alternate-route reveal.",
  },
  CONSTRUCTIVE: {
    title: "Constructive",
    use: "Best when prepared steps and reusable Technique matter.",
    output: "Records a typed step or proof template.",
  },
} as const;

export const getApproachCopy = (approachId: ApproachId | string) =>
  approachCopy[approachId as keyof typeof approachCopy] ??
  approachCopy.CONSTRUCTIVE;

const milestoneTitles: Record<string, string> = {
  "nn.milestone.zero_named": "Zero named",
  "nn.milestone.successor_closed": "A second way to study",
  "nn.milestone.peano_framed": "Foundations framed",
  "nn.milestone.recursion_available": "Recursion prepared",
  "nn.milestone.operations_built": "Operations built",
  "nn.milestone.approach_selected": "A method chosen",
  "nn.milestone.induction_template": "Induction prepared",
  "nn.milestone.stronger_hypothesis": "A stronger hypothesis",
  "nn.milestone.least_element": "A least element",
  "nn.milestone.equivalent_foundations": "Foundations connected",
  "nn.milestone.published": "Foundations published",
};

export const milestoneTitle = (id: MilestoneId | string): string =>
  milestoneTitles[id] ?? id.replace("nn.milestone.", "").replaceAll("_", " ");

const achievementTitles: Record<string, string> = {
  "nn.achievement.first_successor": "First successor",
  "nn.achievement.peano_frame": "The frame is set",
  "nn.achievement.two_ways_forward": "Two ways forward",
  "nn.achievement.exact_hypothesis": "Exact hypothesis",
  "nn.achievement.counterexample_found": "Counterexample found",
  "nn.achievement.without_shortcut": "Without a shortcut",
  "nn.achievement.patient_plan": "Patient plan",
  "nn.achievement.least_of_all": "Least of all",
  "nn.achievement.full_circle": "Full circle",
  "nn.achievement.published_foundations": "Published foundations",
};

export const achievementTitle = (id: AchievementId | string): string =>
  achievementTitles[id] ??
  id.replace("nn.achievement.", "").replaceAll("_", " ");
