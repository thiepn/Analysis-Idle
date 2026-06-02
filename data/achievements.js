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
};

function achievement(name, description, category, condition) {
  return {
    name,
    description,
    category,
    condition,
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
