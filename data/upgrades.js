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
  sequenceDefinition: concept(
    "Sequence Definition",
    "sequences",
    1000000000,
    "Defines sequences as functions from N into R.",
    "A sequence is a function a: N -> R. Written (a_n). The domain is always the natural numbers.",
    chapter("sequences"),
    buildingMultiplier("definitions", 2),
  ),
  boundedSequences: concept(
    "Bounded Sequences",
    "sequences",
    1800000000,
    "Exercises produce x1.4 Understanding.",
    "A sequence is bounded if all its terms remain inside some fixed interval.",
    researched("sequenceDefinition"),
    buildingMultiplier("exercises", 1.4),
  ),
  monotoneSequences: concept(
    "Monotone Sequences",
    "sequences",
    3000000000,
    "Examples produce x1.5 Understanding.",
    "A sequence is monotone if it only moves upward or only moves downward.",
    researched("boundedSequences"),
    buildingMultiplier("examples", 1.5),
  ),
  sequenceConvergence: concept(
    "Convergence",
    "sequences",
    5200000000,
    "All Study Work produces x1.45 Understanding.",
    "a_n -> L means: eventually, every term is within epsilon of L.",
    researched("monotoneSequences"),
    globalMultiplier(1.45),
  ),
  divergentSequences: concept(
    "Divergence",
    "sequences",
    8500000000,
    "Proof Attempts produce x1.2 Understanding.",
    "Not every infinite process settles. Some sequences escape, oscillate, or refuse to approach a limit.",
    researched("sequenceConvergence"),
    buildingMultiplier("proofAttempts", 1.2),
  ),
  limitOfASequence: concept(
    "Limit of a Sequence",
    "sequences",
    13000000000,
    "All Study Work produces x1.35 Understanding.",
    "The limit is not where the sequence is, but where it is forced to go.",
    researched("sequenceConvergence"),
    globalMultiplier(1.35),
  ),
  monotoneConvergenceTheorem: concept(
    "Monotone Convergence Theorem",
    "sequences",
    35000000000,
    "Lemmas produce x2 Understanding.",
    "Every bounded monotone sequence converges. The limit is forced by order and boundedness.",
    researched("limitOfASequence"),
    buildingMultiplier("lemmas", 2),
  ),
  cauchySequences: concept(
    "Cauchy Sequences",
    "sequences",
    70000000000,
    "Proof Attempts produce x1.35 Understanding.",
    "A sequence is Cauchy if its terms eventually get arbitrarily close to each other.",
    researched("monotoneConvergenceTheorem"),
    buildingMultiplier("proofAttempts", 1.35),
  ),
  subsequences: concept(
    "Subsequences",
    "sequences",
    120000000000,
    "Lemmas produce x2 Understanding.",
    "A subsequence keeps infinitely many terms of the original sequence, in their original order.",
    researched("cauchySequences"),
    buildingMultiplier("lemmas", 2),
  ),
  eventuallyAlways: concept(
    "Eventually Always",
    "sequences",
    170000000000,
    "Proof Attempts cost 8% less.",
    "In Analysis, eventually means there exists N such that all later terms obey the rule.",
    researched("subsequences"),
    costMultiplier("proofAttempts", 0.92),
  ),
  cauchyCriterion: concept(
    "Cauchy Criterion",
    "sequences",
    240000000000,
    "Lemmas carry convergence proofs, with Theorems gaining a smaller finishing boost.",
    "In a complete space, Cauchy sequences converge. This is where R proves its strength.",
    researched("eventuallyAlways"),
    buildingMultiplier("lemmas", 1.6),
    buildingMultiplier("theorems", 1.25),
  ),
  bolzanoWeierstrass: concept(
    "Bolzano-Weierstrass Theorem",
    "sequences",
    350000000000,
    "Lemmas and Theorems surge together, and all production improves.",
    "Every bounded sequence in R has a convergent subsequence. Compactness, foreshadowed.",
    researched("cauchyCriterion"),
    buildingMultiplier("lemmas", 1.8),
    buildingMultiplier("theorems", 1.7),
    globalMultiplier(1.25),
  ),
  limitNotation: concept(
    "Limit Notation",
    "limits",
    800000000000,
    "Definitions produce x2 Understanding.",
    "lim_{x -> a} f(x) = L names the value a function approaches, not necessarily the value it takes.",
    chapter("limits"),
    buildingMultiplier("definitions", 2),
  ),
  epsilonDeltaDefinition: concept(
    "Epsilon-Delta Definition",
    "limits",
    2000000000000,
    "Proof Attempts produce x1.4 Understanding.",
    "For every epsilon > 0, there exists delta > 0 such that 0 < |x-a| < delta implies |f(x)-L| < epsilon. Rigor will become important soon.",
    researched("limitNotation"),
    buildingMultiplier("proofAttempts", 1.4),
  ),
  puncturedNeighborhoods: concept(
    "Punctured Neighborhoods",
    "limits",
    3500000000000,
    "Definitions and Proof Attempts produce more Understanding.",
    "A limit studies what happens near a point, not necessarily at the point.",
    researched("epsilonDeltaDefinition"),
    buildingMultiplier("definitions", 1.3),
    buildingMultiplier("proofAttempts", 1.3),
  ),
  limitLawsLinearity: concept(
    "Limit Laws - Linearity",
    "limits",
    6000000000000,
    "Examples produce x1.4 Understanding.",
    "The limit of a sum is the sum of the limits. Limits respect addition and scalar multiplication.",
    researched("puncturedNeighborhoods"),
    buildingMultiplier("examples", 1.4),
  ),
  limitLawsProducts: concept(
    "Limit Laws - Products",
    "limits",
    10000000000000,
    "Lemmas produce x1.5 Understanding.",
    "If the limits exist, the limit of a product is the product of the limits.",
    researched("limitLawsLinearity"),
    buildingMultiplier("lemmas", 1.5),
  ),
  limitLawsQuotients: concept(
    "Limit Laws - Quotients",
    "limits",
    18000000000000,
    "All Study Work produces x1.15 Understanding.",
    "Quotients preserve limits as long as the denominator does not approach zero.",
    researched("limitLawsProducts"),
    globalMultiplier(1.15),
  ),
  oneSidedLimits: concept(
    "One-Sided Limits",
    "limits",
    20000000000000,
    "Examples produce x1.5 Understanding.",
    "The left-hand and right-hand limits may disagree. A true two-sided limit requires both.",
    researched("limitLawsQuotients"),
    buildingMultiplier("examples", 1.5),
  ),
  infiniteLimits: concept(
    "Infinite Limits",
    "limits",
    25000000000000,
    "Exercises produce x1.6 Understanding.",
    "The input escapes to infinity while the function approaches a finite value.",
    researched("oneSidedLimits"),
    buildingMultiplier("exercises", 1.6),
  ),
  squeezeTheorem: concept(
    "Squeeze Theorem",
    "limits",
    35000000000000,
    "Exercises produce x2.2 and all production improves.",
    "If g(x) <= f(x) <= h(x), and both outer functions approach L, then f must approach L too.",
    researched("infiniteLimits"),
    buildingMultiplier("exercises", 2.2),
    globalMultiplier(1.5),
  ),
  boundControl: concept(
    "Bound Control",
    "limits",
    40000000000000,
    "Exercises produce x1.5 Understanding.",
    "Analysis often works by controlling error rather than computing exact values.",
    researched("squeezeTheorem"),
    buildingMultiplier("exercises", 1.5),
  ),
  sequentialLimits: concept(
    "Sequential Limits",
    "limits",
    50000000000000,
    "Lemmas produce x2 Understanding.",
    "Limits of functions can be tested through every sequence approaching the input point.",
    researched("boundControl"),
    buildingMultiplier("lemmas", 2),
  ),
  eventuallyNear: concept(
    "Eventually Near",
    "limits",
    55000000000000,
    "All Study Work produces x1.15 Understanding.",
    "Near enough means there is a neighborhood where the desired statement always holds. Challenge mode coming later: choose delta for a given epsilon.",
    researched("sequentialLimits"),
    globalMultiplier(1.15),
  ),
  sequentialCharacterization: concept(
    "Sequential Characterization",
    "limits",
    65000000000000,
    "Proofs, Lemmas, and Theorems all accelerate as function limits and sequence limits align.",
    "lim_{x -> a} f(x) = L iff every sequence x_n -> a with x_n != a satisfies f(x_n) -> L.",
    researched("eventuallyNear"),
    buildingMultiplier("proofAttempts", 1.25),
    buildingMultiplier("lemmas", 1.6),
    buildingMultiplier("theorems", 1.8),
    globalMultiplier(1.3),
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
  if (isParentGroup(target)) {
    return {
      type: "parentGroupProductionMultiplier",
      targetParent: target,
      value,
    };
  }

  return {
    type: "buildingProductionMultiplier",
    target,
    value,
  };
}

function synergyMultiplier(target, source, valuePerOwned) {
  if (isParentGroup(target) || isParentGroup(source)) {
    return {
      type: "parentTierSynergyProductionMultiplier",
      targetParent: target,
      sourceParent: source,
      valuePerOwned,
    };
  }

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
  if (isParentGroup(target)) {
    return {
      type: "parentGroupCostMultiplier",
      targetParent: target,
      value,
    };
  }

  return {
    type: "buildingCostMultiplier",
    target,
    value,
  };
}

function isParentGroup(target) {
  return [
    "definitions",
    "examples",
    "exercises",
    "proofAttempts",
    "lemmas",
    "theorems",
  ].includes(target);
}
