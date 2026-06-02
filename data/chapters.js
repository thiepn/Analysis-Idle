export const CHAPTER_DEFINITIONS = [
  {
    id: "naturalNumbers",
    name: "Natural Numbers",
    theme: "In the beginning, there was one.",
    description: "Begin with counting, the successor operation, and induction on N.",
    transitionToNext:
      "Counting is not enough. Subtraction forces mathematics to make room for negative numbers.",
    completionBanner: "N = {1, 2, 3, ...}: the first infinity, and the foundation of all the rest.",
    implemented: true,
    unlock: {
      type: "understandingReached",
      amount: 0,
    },
    milestones: ["First Count", "Successor Function", "Proof by Induction"],
    studyWork: {
      definitions: "Counting Board",
      examples: "Number Line",
      exercises: "Induction Engine",
      proofAttempts: "Inductive Proof Drafts",
      lemmas: "Successor Lemmas",
      theorems: "Well-Ordering Theorem",
    },
    goal: {
      objective: "Reach 10,000 Understanding and establish the natural-number foundation.",
      conditions: [
        {
          type: "understandingReached",
          amount: 10000,
          label: "Reach 10,000 Understanding",
        },
        {
          type: "upgradePurchased",
          upgradeId: "wellOrderingPrinciple",
          label: "Study the Well-Ordering Principle",
        },
      ],
      reward: {
        label: "Induction Passive: x1.35 production",
        effects: [
          {
            type: "globalProductionMultiplier",
            value: 1.35,
          },
        ],
      },
    },
  },
  {
    id: "integers",
    name: "Integers",
    theme: "What lies below zero?",
    description: "Extend counting into negatives, divisibility, and prime structure on Z.",
    transitionToNext:
      "Integers count whole units. Division forces ratios, fractions, and density.",
    completionBanner:
      "Every integer factors uniquely into primes. Arithmetic has a hidden architecture.",
    implemented: true,
    unlock: {
      type: "understandingReached",
      amount: 10000,
    },
    milestones: ["Signed Numbers", "First Prime", "Euclidean Algorithm"],
    studyWork: {
      definitions: "Sign Convention",
      examples: "Divisibility Table",
      exercises: "Sieve of Eratosthenes",
      proofAttempts: "GCD Proofs",
      lemmas: "Divisibility Lemmas",
      theorems: "Unique Factorization",
    },
    goal: {
      objective: "Reach 500,000 Understanding and uncover the prime structure of Z.",
      conditions: [
        {
          type: "understandingReached",
          amount: 500000,
          label: "Reach 500,000 Understanding",
        },
        {
          type: "upgradePurchased",
          upgradeId: "fundamentalTheoremArithmetic",
          label: "Study the Fundamental Theorem of Arithmetic",
        },
      ],
      reward: {
        label: "Prime Decomposition: x1.2 production",
        effects: [
          {
            type: "globalProductionMultiplier",
            value: 1.2,
          },
        ],
      },
    },
  },
  {
    id: "rationalNumbers",
    name: "Rational Numbers",
    theme: "Between any two numbers, another number waits.",
    description: "Study fractions, decimal expansions, and the density of Q.",
    transitionToNext: "Q is dense, but it still has gaps. Completeness requires R.",
    completionBanner: "Q is dense in R. But dense is not the same as complete.",
    implemented: true,
    unlock: {
      type: "understandingReached",
      amount: 500000,
    },
    milestones: ["First Fraction", "Repeating Decimals", "Dense Everywhere"],
    studyWork: {
      definitions: "Fraction Workshop",
      examples: "Decimal Expander",
      exercises: "Density Laboratory",
      proofAttempts: "Equivalence Proofs",
      lemmas: "Density Lemmas",
      theorems: "Countability Theorem",
    },
    goal: {
      objective: "Reach 15,000,000 Understanding and expose the gaps inside Q.",
      conditions: [
        {
          type: "understandingReached",
          amount: 15000000,
          label: "Reach 15,000,000 Understanding",
        },
        {
          type: "upgradePurchased",
          upgradeId: "irrationalitySqrt2",
          label: "Prove the irrationality of sqrt(2)",
        },
      ],
      reward: {
        label: "Dense Packing: x1.3 production",
        effects: [
          {
            type: "globalProductionMultiplier",
            value: 1.3,
          },
        ],
      },
    },
  },
  {
    id: "realNumbers",
    name: "Real Numbers",
    theme: "The number line, finally complete.",
    description: "Approach irrationals, completeness, suprema, and infima on R.",
    transitionToNext:
      "With the real line established, sequences reveal how mathematical objects approach a limit.",
    completionBanner:
      "R is the complete ordered field. Every Cauchy sequence converges. Every gap is filled.",
    implemented: true,
    unlock: {
      type: "understandingReached",
      amount: 15000000,
    },
    milestones: ["The Irrational Exists", "Least Upper Bound", "Archimedean Property"],
    studyWork: {
      definitions: "Irrational Classifier",
      examples: "Supremum Finder",
      exercises: "Completeness Engine",
      proofAttempts: "Bound Arguments",
      lemmas: "Interval Lemmas",
      theorems: "Completeness Theorem",
    },
    goal: {
      objective: "Reach 500,000,000 Understanding and complete the real-number foundation.",
      conditions: [
        {
          type: "understandingReached",
          amount: 500000000,
          label: "Reach 500,000,000 Understanding",
        },
        {
          type: "upgradePurchased",
          upgradeId: "nestedIntervals",
          label: "Study Nested Intervals",
        },
      ],
      reward: {
        label: "Nested Interval Passive: x1.5 production",
        effects: [
          {
            type: "globalProductionMultiplier",
            value: 1.5,
          },
        ],
      },
    },
  },
  {
    id: "sequences",
    name: "Sequences",
    theme: "Ordered terms begin to approach infinity.",
    description: "Coming later: approach infinity through ordered terms.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 500000000,
    },
  },
  {
    id: "limits",
    name: "Limits",
    theme: "Approach becomes a mathematical promise.",
    description: "Coming later: formalize approaching behavior.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 1000000000,
    },
  },
  {
    id: "continuity",
    name: "Continuity",
    theme: "Local behavior begins to connect.",
    description: "Coming later: connect local behavior across the real line.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 10000000000,
    },
  },
  {
    id: "differentiation",
    name: "Differentiation",
    theme: "Change becomes measurable.",
    description: "Coming later: measure local rates of change.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 100000000000,
    },
  },
  {
    id: "integration",
    name: "Integration",
    theme: "Accumulation answers change.",
    description: "Coming later: accumulate change across intervals.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 1000000000000,
    },
  },
  {
    id: "infiniteSeries",
    name: "Infinite Series",
    theme: "Infinite sums ask whether they can settle.",
    description: "Coming later: decide when infinite sums behave.",
    implemented: false,
    unlock: {
      type: "understandingReached",
      amount: 10000000000000,
    },
  },
];
