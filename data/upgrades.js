export const UPGRADE_DEFINITIONS = {
  peanoAxioms: concept(
    "Peano Axioms",
    "naturalNumbers",
    80,
    "Formal foundations double the value of each Definition.",
    "Five axioms. From them, arithmetic begins.",
    owned("definitions", 1),
    buildingMultiplier("definitions", 2),
  ),
  successorFunction: concept(
    "Successor Function",
    "naturalNumbers",
    180,
    "The next natural number strengthens Definitions.",
    "Every n in N has a successor S(n).",
    researched("peanoAxioms"),
    buildingMultiplier("definitions", 1.15),
  ),
  mathematicalInduction: concept(
    "Mathematical Induction",
    "naturalNumbers",
    420,
    "A repeatable proof method strengthens all production.",
    "Prove the base case. Prove the inductive step. Conclude for all n in N.",
    researched("successorFunction"),
    globalMultiplier(1.3),
  ),
  additionAsIteration: concept(
    "Addition as Iteration",
    "naturalNumbers",
    900,
    "Repeated successors make Examples more productive.",
    "Addition is iteration of the successor operation.",
    researched("mathematicalInduction"),
    buildingMultiplier("examples", 1.45),
  ),
  multiplicationRepeatedAddition: concept(
    "Multiplication as Repeated Addition",
    "naturalNumbers",
    2200,
    "Structured repetition strengthens Exercises.",
    "Multiplication packages repeated addition into a new operation.",
    researched("additionAsIteration"),
    buildingMultiplier("exercises", 1.3),
  ),
  wellOrderingPrinciple: concept(
    "Well-Ordering Principle",
    "naturalNumbers",
    5200,
    "Natural order strengthens all production.",
    "Every nonempty subset of N has a least element.",
    researched("multiplicationRepeatedAddition"),
    globalMultiplier(1.35),
  ),
  additiveInverses: concept(
    "Additive Inverses",
    "integers",
    18000,
    "Negative numbers sharpen Definitions.",
    "For every a in Z, there is an element -a such that a + (-a) = 0.",
    chapter("integers"),
    buildingMultiplier("definitions", 1.35),
  ),
  divisibility: concept(
    "Divisibility",
    "integers",
    40000,
    "Structural reasoning makes each Example more productive.",
    "a divides b if there exists k in Z such that b = ak.",
    researched("additiveInverses"),
    buildingMultiplier("examples", 1.25),
  ),
  primeNumbers: concept(
    "Prime Numbers",
    "integers",
    80000,
    "Prime patterns make Examples reinforce Definitions.",
    "A prime has exactly two positive divisors: 1 and itself.",
    researched("divisibility"),
    synergyMultiplier("definitions", "examples", 0.05),
  ),
  euclideanAlgorithm: concept(
    "Euclidean Algorithm",
    "integers",
    140000,
    "A constructive algorithm strengthens Exercises.",
    "Repeated division reveals the greatest common divisor.",
    researched("primeNumbers"),
    buildingMultiplier("exercises", 1.25),
  ),
  fundamentalTheoremArithmetic: concept(
    "Fundamental Theorem of Arithmetic",
    "integers",
    240000,
    "Unique prime factorization strengthens all production.",
    "Every integer greater than one factors uniquely into primes.",
    researched("euclideanAlgorithm"),
    globalMultiplier(1.25),
  ),
  modularArithmetic: concept(
    "Modular Arithmetic",
    "integers",
    400000,
    "Congruence classes make Examples more efficient.",
    "Integers can be compared by their remainders modulo n.",
    researched("fundamentalTheoremArithmetic"),
    costMultiplier("examples", 0.93),
  ),
  fractionDefinition: concept(
    "Fraction Definition",
    "rationalNumbers",
    600000,
    "Ratios strengthen Definitions.",
    "A rational number is represented by a/b with a in Z and b not equal to 0.",
    chapter("rationalNumbers"),
    buildingMultiplier("definitions", 1.2),
  ),
  equivalenceClasses: concept(
    "Equivalence Classes",
    "rationalNumbers",
    950000,
    "Equivalent fractions refine Examples.",
    "Different fractions may represent the same rational number.",
    researched("fractionDefinition"),
    buildingMultiplier("examples", 1.3),
  ),
  decimalExpansion: concept(
    "Decimal Expansion",
    "rationalNumbers",
    1500000,
    "Repeating decimals strengthen Exercises.",
    "Every rational number has an eventually repeating decimal expansion.",
    researched("equivalenceClasses"),
    buildingMultiplier("exercises", 1.28),
  ),
  densityOfQ: concept(
    "Density of Q",
    "rationalNumbers",
    2400000,
    "Dense packing strengthens all production.",
    "Between any two distinct rationals lies another rational.",
    researched("decimalExpansion"),
    globalMultiplier(1.28),
  ),
  qIsCountable: concept(
    "Q is Countable",
    "rationalNumbers",
    3800000,
    "Enumeration reduces the cost of Examples.",
    "The rationals are infinite, yet they can be listed.",
    researched("densityOfQ"),
    costMultiplier("examples", 0.92),
  ),
  irrationalitySqrt2: concept(
    "Irrationality of sqrt(2)",
    "rationalNumbers",
    6000000,
    "The first visible gap strengthens all production.",
    "No rational number squares to two.",
    researched("qIsCountable"),
    globalMultiplier(1.35),
  ),
  irrationals: concept(
    "Irrationals",
    "realNumbers",
    18000000,
    "Naming the gaps strengthens Definitions.",
    "Not every point on the number line is rational.",
    chapter("realNumbers"),
    buildingMultiplier("definitions", 1.3),
  ),
  suprema: concept(
    "Suprema",
    "realNumbers",
    28000000,
    "Least upper bounds strengthen Examples.",
    "The supremum is the least of all upper bounds.",
    researched("irrationals"),
    buildingMultiplier("examples", 1.4),
  ),
  infima: concept(
    "Infima",
    "realNumbers",
    42000000,
    "Greatest lower bounds strengthen Exercises.",
    "The infimum is the greatest of all lower bounds.",
    researched("suprema"),
    buildingMultiplier("exercises", 1.4),
  ),
  completenessAxiom: concept(
    "Completeness Axiom",
    "realNumbers",
    65000000,
    "Completeness strengthens all production.",
    "Every nonempty set bounded above has a supremum in R.",
    researched("infima"),
    globalMultiplier(1.4),
  ),
  archimedeanProperty: concept(
    "Archimedean Property",
    "realNumbers",
    95000000,
    "Natural numbers reach beyond every fixed bound.",
    "For every real x, some n in N satisfies n > x.",
    researched("completenessAxiom"),
    globalMultiplier(1.25),
  ),
  nestedIntervals: concept(
    "Nested Intervals",
    "realNumbers",
    140000000,
    "Nested intervals strengthen Exercises.",
    "A shrinking chain of closed bounded intervals retains a common point.",
    researched("archimedeanProperty"),
    buildingMultiplier("exercises", 1.45),
  ),
  cantorTheorem: concept(
    "Cantor's Theorem",
    "realNumbers",
    210000000,
    "Uncountability strengthens all production.",
    "The real numbers cannot be placed in one-to-one correspondence with N.",
    researched("nestedIntervals"),
    globalMultiplier(1.45),
  ),
};

function concept(name, chapterId, cost, description, flavor, unlock, ...effects) {
  return {
    name,
    chapterId,
    cost,
    description,
    flavor,
    unlock,
    effects,
  };
}

function owned(buildingId, amount) {
  return {
    type: "buildingOwned",
    buildingId,
    amount,
  };
}

function researched(upgradeId) {
  return {
    type: "upgradePurchased",
    upgradeId,
  };
}

function chapter(chapterId) {
  return {
    type: "chapterUnlocked",
    chapterId,
  };
}

function buildingMultiplier(target, value) {
  return {
    type: "buildingProductionMultiplier",
    target,
    value,
  };
}

function synergyMultiplier(target, source, valuePerOwned) {
  return {
    type: "buildingSynergyProductionMultiplier",
    target,
    source,
    valuePerOwned,
  };
}

function globalMultiplier(value) {
  return {
    type: "globalProductionMultiplier",
    value,
  };
}

function costMultiplier(target, value) {
  return {
    type: "buildingCostMultiplier",
    target,
    value,
  };
}
