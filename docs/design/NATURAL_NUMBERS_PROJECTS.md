# Natural Numbers projects

All numerical inputs and base work are `PROVISIONAL` tuning data (`P`). Work is measured in project-work seconds at base speed 1 work/s. Starting a project atomically reserves requirements; completion consumes them; cancel returns reserved inputs; approach changes preserve inputs and ≥90% completed work (`P`). Every project awards monotonic Understanding and an explicit artifact.

| Stable ID | Title | Dependencies | Base Precision / Intuition / work (P) | Core artifact / strategic purpose | Required tests |
|---|---|---|---:|---|---|
| `nn.project.zero_successor` | Zero and Successor | none | 12 / 0 / 45 | successor vocabulary; reveal Explore/Intuition | opening reachability, convention copy |
| `nn.project.peano_frame` | Peano Frame | zero_successor | 28 / 12 / 120 | axiom/assumption frame; project slot/map | no “five axioms” universal claim |
| `nn.project.primitive_recursion` | Primitive Recursion | peano_frame | 45 / 26 / 210 | recursion template; queue-one | recursion source note, queue determinism |
| `nn.project.addition` | Define Addition | primitive_recursion | 68 / 38 / 300 | recursive addition artifact | zero/successor clauses |
| `nn.project.addition_lemmas` | Addition Lemmas | addition, peano_frame | 92 / 44 / 360 | identity/successor/associativity lemma set | matching/reuse tests |
| `nn.project.multiplication` | Define Multiplication | addition, primitive_recursion | 85 / 62 / 420 | recursive multiplication template | dependency on addition |
| `nn.project.induction_walkthrough` | Induction Walkthrough | peano_frame, addition | 110 / 75 / 480 | first approach artifact; base/step chain | each approach viable |
| `nn.project.counterexample_lab` | Missing Base, Missing Step | induction_walkthrough | 55 / 125 / 300 | counterexamples showing both obligations matter | no quiz/failure state |
| `nn.project.strong_induction` | Strong Induction | induction_walkthrough | 135 / 95 / 540 | strong-induction method with configurable bases | equivalence wording |
| `nn.project.well_ordering` | Well-Ordering | induction_walkthrough | 150 / 105 / 600 | least-element method; unlock reserves | no multiplication prerequisite |
| `nn.project.least_counterexample` | Least Counterexample | well_ordering, counterexample_lab | 120 / 150 / 540 | contradiction/least-counterexample method | edge validation |
| `nn.project.equivalence_capstone` | Equivalent Foundations | strong_induction, well_ordering, least_counterexample, addition_lemmas | 240 / 210 / 900 | four valid implication edges; Publication trigger | cannot pass via stocks alone |

## Approach transforms

- **Formal:** requirement vector leans Precision (`+25% P`, `−10% I`); exposes obligations and emits a matching reusable lemma.
- **Exploratory:** leans Intuition (`−10% P`, `+25% I`); reveals downstream requirements/alternate edge before commitment.
- **Constructive:** balanced input (`+5%` each, `P`); decomposes work into reusable typed steps/templates.

Work is normalized by approach output value so no approach is simultaneously fastest and best downstream. Exact transforms live in data and are reported in marginal previews.

