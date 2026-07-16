# Natural Numbers vertical-slice GDD

## Chapter promise

Build the natural numbers from zero and successor, use recursion to define operations, learn why induction works, and connect ordinary induction, strong induction, Well-Ordering, and least-counterexample reasoning. The chapter is a planning game with optional mathematical depth—not a quiz.

## Convention and source notes

v2 fixes `N = {0, 1, 2, …}`. Zero makes additive/multiplicative recursion and identity elements consistent. “Peano-style” means a documented formulation with zero, successor closure/injectivity, zero not a successor, and an induction principle; the number/count of axioms is formulation-dependent. Content sources: Terence Tao, *Analysis I*, Natural Numbers; Herbert Enderton, *A Mathematical Introduction to Logic*, Peano arithmetic; and the Open Logic Project treatment of arithmetic/induction. Exact player copy receives review before production.

Mathematical rules:

- induction is part of the chosen foundation, not derived from successor alone;
- recursive addition/multiplication require a recursion principle; “repeated addition” is intuition, not the full definition;
- multiplication depends on addition, but Well-Ordering does not mathematically depend on multiplication;
- ordinary induction, strong induction, Well-Ordering, and least-counterexample reasoning are equivalent in the intended standard setting with stated background assumptions;
- strong induction may require multiple base cases/configurable node shapes.

## Chapter state

Starts with 3 Attention, zero stocks, no Insight, Formalize visible, one guided goal, and no chapter/future-system navigation. Precision and Intuition are capped by milestone-scaled configuration sufficient for roughly two visible projects. One project slot unlocks after the opening guided project. Fourth Attention unlocks mid-chapter. Chapter-local stocks, active/queued work, and allocations reset at Publication.

## Exact progression stages

1. **Opening:** all 3 Attention guide-assigned to Formalize; acknowledge the zero convention; Precision begins under 30 seconds.
2. **Second activity:** `nn.project.zero_successor` reveals Explore/Intuition and the first 3/0 vs 2/1 trade-off.
3. **First project:** Peano Frame exposes the dedicated project slot and dependency-map list.
4. **First milestone/control:** rate ledger shows marginal rates, caps, and visible-project ETA.
5. **Recursion:** Primitive Recursion unlocks queue-one.
6. **Operations:** Addition and multiplication create a fork; the player selects which requirement vector to prepare first.
7. **Approach choice:** Induction Walkthrough introduces Formal/Exploratory/Constructive outputs.
8. **First keystone:** Recursion Template or Lemma Reuse changes later project structure.
9. **Automation:** completion behavior, then reserves; fourth Attention expands planning.
10. **Proof-chain system:** strong induction, Well-Ordering, and least counterexample form parallel/linked nodes.
11. **Capstone:** Equivalence Map requires using relationships, not a currency threshold alone.
12. **Publication:** preview ledger, confirm Foundations of the Natural Numbers, and open the next chapter shell.

## Induction Chain mechanic

Node types are `statement`, `baseCase`, `inductionHypothesis`, `inductionStep`, `counterexample`, `reusableLemma`, `equivalenceEdge`, and `closure`. Projects select a schema; strong induction can require multiple base cases. Dependencies validate before work starts. Player decisions are resource allocation, project/approach order, lemma/template reuse, queue/reserve policy, and optional Insight use.

There are no random/destructive failures. A missing assumption or invalid dependency pauses the affected node with a plain-language explanation and highlights the required prior result. Automation may start funded validated nodes only. The visual graph uses shape + label + state, SVG title/description, and a fully operable ordered-list alternative.

## Capstone

`nn.project.equivalence_capstone` asks the player to assemble directed implications: ordinary induction → Well-Ordering; Well-Ordering → least-counterexample reasoning; strong induction → ordinary induction; ordinary induction → strong induction. Required method artifacts must be assigned to matching edges. Completion awards final Understanding and unlocks Publication; raw stocks alone cannot complete it.

## Active/offline behavior

Insight interventions map to base case, step trace, and counterexample reveal. No timed input. Offline simulation runs configured allocations/project queue until a decision, cap, failed rule, capstone, or Publication availability. Return summary targets the exact blocked node/control.

## UI hierarchy

Overview: next decision, two stocks/rates, Understanding, Insight, Attention allocation, active project. Projects: requirements/ETA/approach/output. Map: simplified graph plus text list. Automation appears when earned. Publication preview appears only after the capstone is near. Achievements/archive live under Records and are never opening clutter.

## Completion gates

All required projects complete; all capstone implication edges have valid method artifacts; no unresolved core dependency; Publication ledger validates. Balance thresholds are in `NATURAL_NUMBERS_BALANCE.md`; exact catalogues are companion documents.

