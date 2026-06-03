export const ACHIEVEMENT_DEFINITIONS = {
  tabulaRasa: achievement(
    "Tabula Rasa",
    "Begin with the first spark of Understanding.",
    "foundations",
    understanding(10),
  ),
  firstDefinition: achievement(
    "First Principle",
    "Write your first Definition.",
    "foundations",
    owned("definitions", 1),
  ),
  countingBegins: achievement(
    "Counting Begins",
    "Write 3 Definitions.",
    "foundations",
    owned("definitions", 3),
  ),
  theFirstAxiom: achievement(
    "The First Axiom",
    "Study the Peano Axioms.",
    "foundations",
    researched("peanoAxioms"),
  ),
  byInduction: achievement(
    "By Induction",
    "Study Mathematical Induction.",
    "foundations",
    researched("mathematicalInduction"),
  ),
  theSuccessor: achievement(
    "The Successor",
    "Study the Successor Function.",
    "foundations",
    researched("successorFunction"),
  ),
  workedExample: achievement(
    "Number Line",
    "Work through your first Example.",
    "foundations",
    owned("examples", 1),
  ),
  practiceMakesPerfect: achievement(
    "Infinite Engine",
    "Complete your first Exercise.",
    "foundations",
    owned("exercises", 1),
  ),
  naturalOrder: achievement(
    "Natural Order",
    "Study the Well-Ordering Principle.",
    "foundations",
    researched("wellOrderingPrinciple"),
  ),
  foundationsComplete: achievement(
    "First Chapter",
    "Complete the Natural Numbers chapter.",
    "chapterCompletion",
    completed("naturalNumbers"),
  ),

  intoTheNegatives: achievement(
    "Into the Negatives",
    "Unlock the Integers chapter.",
    "numberSystems",
    understanding(10000),
  ),
  signedAndSealed: achievement(
    "Signed and Sealed",
    "Study Additive Inverses.",
    "numberSystems",
    researched("additiveInverses"),
  ),
  primeDiscovery: achievement(
    "Prime Discovery",
    "Study Prime Numbers.",
    "numberSystems",
    researched("primeNumbers"),
  ),
  ancientAlgorithm: achievement(
    "Ancient Algorithm",
    "Study the Euclidean Algorithm.",
    "numberSystems",
    researched("euclideanAlgorithm"),
  ),
  uniqueFactorization: achievement(
    "Unique Factorization",
    "Study the Fundamental Theorem of Arithmetic.",
    "numberSystems",
    researched("fundamentalTheoremArithmetic"),
  ),
  integersMastered: achievement(
    "Integers Mastered",
    "Complete the Integers chapter.",
    "chapterCompletion",
    completed("integers"),
  ),
  ratioAndProportion: achievement(
    "Ratio and Proportion",
    "Study the Fraction Definition.",
    "numberSystems",
    researched("fractionDefinition"),
  ),
  repeatingPattern: achievement(
    "The Repeating Pattern",
    "Study Decimal Expansion.",
    "numberSystems",
    researched("decimalExpansion"),
  ),
  denseEnough: achievement(
    "Dense Enough",
    "Study the Density of Q.",
    "numberSystems",
    researched("densityOfQ"),
  ),
  countableInfinity: achievement(
    "Countable Infinity",
    "Study that Q is Countable.",
    "numberSystems",
    researched("qIsCountable"),
  ),
  rationalsMastered: achievement(
    "Rationals Mastered",
    "Complete the Rational Numbers chapter.",
    "chapterCompletion",
    completed("rationalNumbers"),
  ),
  theGap: achievement(
    "The Gap",
    "Prove the irrationality of sqrt(2).",
    "numberSystems",
    researched("irrationalitySqrt2"),
  ),
  leastUpperBound: achievement(
    "Least Upper Bound",
    "Study Suprema.",
    "numberSystems",
    researched("suprema"),
  ),
  completeness: achievement(
    "Completeness",
    "Study the Completeness Axiom.",
    "numberSystems",
    researched("completenessAxiom"),
  ),
  archimedesLives: achievement(
    "Archimedes Lives",
    "Study the Archimedean Property.",
    "numberSystems",
    researched("archimedeanProperty"),
  ),
  nestedAndCertain: achievement(
    "Nested and Certain",
    "Study Nested Intervals.",
    "numberSystems",
    researched("nestedIntervals"),
  ),
  uncountable: achievement(
    "Uncountable",
    "Study Cantor's Theorem.",
    "numberSystems",
    researched("cantorTheorem"),
  ),
  realsMastered: achievement(
    "Reals Mastered",
    "Complete the Real Numbers chapter.",
    "chapterCompletion",
    completed("realNumbers"),
  ),

  carefulReader: achievement(
    "First Thousand",
    "Reach 1,000 Understanding.",
    "understandingMilestone",
    understanding(1000),
  ),
  tenThousand: achievement(
    "Ten Thousand",
    "Reach 10,000 Understanding.",
    "understandingMilestone",
    understanding(10000),
  ),
  oneMillion: achievement(
    "One Million",
    "Reach 1,000,000 Understanding.",
    "understandingMilestone",
    understanding(1000000),
  ),

  firstBuilding: achievement(
    "First Building",
    "Create your first piece of study work.",
    "buildingMilestone",
    totalBuildings(1),
  ),
  definitionsEnough: achievement(
    "The Definition Is Enough",
    "Write 50 Definitions.",
    "buildingMilestone",
    owned("definitions", 50),
  ),
  workedExamples: achievement(
    "Worked Examples",
    "Work through 30 Examples.",
    "buildingMilestone",
    owned("examples", 30),
  ),
  practiceMakesRigorous: achievement(
    "Practice Makes Rigorous",
    "Complete 10 Exercises.",
    "buildingMilestone",
    owned("exercises", 10),
  ),
  firstProofAttempt: achievement(
    "First Proof Attempt",
    "Draft your first Proof Attempt.",
    "buildingMilestone",
    owned("proofAttempts", 1),
  ),
  lemmaEstablished: achievement(
    "Lemma Established",
    "Establish your first Lemma.",
    "buildingMilestone",
    owned("lemmas", 1),
  ),
  firstTheorem: achievement(
    "First Theorem",
    "Prove your first Theorem.",
    "buildingMilestone",
    owned("theorems", 1),
  ),
  proofStructure: achievement(
    "Proof Structure",
    "Establish 5 Lemmas.",
    "buildingMilestone",
    owned("lemmas", 5),
  ),
  theoremBuilder: achievement(
    "Theorem Builder",
    "Prove 3 Theorems.",
    "buildingMilestone",
    owned("theorems", 3),
  ),

  theFirstSequence: achievement(
    "The First Sequence",
    "Study Sequence Definition.",
    "sequences",
    researched("sequenceDefinition"),
  ),
  gettingCloser: achievement(
    "Getting Closer",
    "Study Convergence.",
    "sequences",
    researched("sequenceConvergence"),
  ),
  boundedAndMonotone: achievement(
    "Bounded and Monotone",
    "Study the Monotone Convergence Theorem.",
    "sequences",
    researched("monotoneConvergenceTheorem"),
  ),
  cauchyCriterionAchievement: achievement(
    "Cauchy Criterion",
    "Study Cauchy Sequences.",
    "sequences",
    researched("cauchySequences"),
  ),
  hiddenPattern: achievement(
    "The Hidden Pattern",
    "Study Subsequences.",
    "sequences",
    researched("subsequences"),
  ),
  theGreatTheorem: achievement(
    "The Great Theorem",
    "Prove Bolzano-Weierstrass.",
    "sequences",
    researched("bolzanoWeierstrass"),
  ),
  sequencesMastered: achievement(
    "Sequences Mastered",
    "Complete the Sequences chapter.",
    "chapterCompletion",
    completed("sequences"),
  ),
  infiniteList: achievement(
    "Infinite List",
    "Own 280 total Study Work items.",
    "sequences",
    totalBuildings(280),
  ),
  eventuallyAlwaysAchievement: achievement(
    "Eventually Always",
    "Study Eventually Always.",
    "sequences",
    researched("eventuallyAlways"),
  ),
  compactnessForeshadowed: achievement(
    "Compactness Foreshadowed",
    "Complete all major Sequences research.",
    "sequences",
    allResearched([
      "sequenceDefinition",
      "boundedSequences",
      "monotoneSequences",
      "sequenceConvergence",
      "cauchySequences",
      "subsequences",
      "bolzanoWeierstrass",
    ]),
  ),

  firstLimit: achievement(
    "The First Limit",
    "Study Limit Notation.",
    "limits",
    researched("limitNotation"),
  ),
  epsilonGreaterThanZero: achievement(
    "epsilon Greater Than Zero",
    "Study the Epsilon-Delta Definition.",
    "limits",
    researched("epsilonDeltaDefinition"),
  ),
  algebraOfLimitsAchievement: achievement(
    "Algebra of Limits",
    "Study the main Limit Laws.",
    "limits",
    allResearched(["limitLawsLinearity", "limitLawsProducts", "limitLawsQuotients"]),
  ),
  oneSideAtATime: achievement(
    "One Side at a Time",
    "Study One-Sided Limits.",
    "limits",
    researched("oneSidedLimits"),
  ),
  toInfinity: achievement(
    "To Infinity",
    "Study Infinite Limits.",
    "limits",
    researched("infiniteLimits"),
  ),
  squeezedIntoTruthAchievement: achievement(
    "Squeezed Into Truth",
    "Study the Squeeze Theorem.",
    "limits",
    researched("squeezeTheorem"),
  ),
  sequentialReturn: achievement(
    "Sequential Return",
    "Study Sequential Characterization.",
    "limits",
    researched("sequentialCharacterization"),
  ),
  limitsMastered: achievement(
    "Limits Mastered",
    "Complete the Limits chapter.",
    "chapterCompletion",
    completed("limits"),
  ),
  boundController: achievement(
    "Bound Controller",
    "Own 360 total Study Work items.",
    "limits",
    totalBuildings(360),
  ),
  arbitrarilyClose: achievement(
    "Arbitrarily Close",
    "Complete all major Limits research.",
    "limits",
    allResearched([
      "limitNotation",
      "epsilonDeltaDefinition",
      "squeezeTheorem",
      "sequentialCharacterization",
    ]),
  ),
};

function achievement(name, description, category, condition, reward = getDefaultReward(category, condition)) {
  return {
    name,
    description,
    category,
    condition,
    reward,
  };
}

function understanding(amount) {
  return {
    type: "understandingReached",
    amount,
  };
}

function owned(buildingId, amount) {
  return {
    type: "buildingOwned",
    buildingId,
    amount,
  };
}

function totalBuildings(amount) {
  return {
    type: "totalBuildingsOwned",
    amount,
  };
}

function researched(upgradeId) {
  return {
    type: "upgradePurchased",
    upgradeId,
  };
}

function completed(chapterId) {
  return {
    type: "chapterCompleted",
    chapterId,
  };
}

function allResearched(upgradeIds) {
  return {
    type: "allUpgradesPurchased",
    upgradeIds,
  };
}

function getDefaultReward(category, condition) {
  if (condition.type === "buildingOwned" && condition.buildingId) {
    return productionReward(condition.buildingId, 1.005);
  }

  if (category === "chapterCompletion") {
    return globalReward(1.005);
  }

  return globalReward(1.003);
}

function globalReward(value) {
  return {
    label: `All Study Work produces x${formatMultiplier(value)} Understanding.`,
    effects: [
      {
        type: "globalProductionMultiplier",
        value,
      },
    ],
  };
}

function productionReward(buildingId, value) {
  return {
    label: `${formatBuildingName(buildingId)} produce x${formatMultiplier(value)} Understanding.`,
    effects: [
      {
        type: "buildingProductionMultiplier",
        target: buildingId,
        value,
      },
    ],
  };
}

function formatBuildingName(buildingId) {
  return buildingId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatMultiplier(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}
