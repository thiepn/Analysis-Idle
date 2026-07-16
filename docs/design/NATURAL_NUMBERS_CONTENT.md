# Natural Numbers content and dependency audit

## Player-facing concept notes

- **Natural-number convention:** This game includes zero in N. Other texts may begin at one; neither convention is silently assumed.
- **Successor:** each natural has a next natural; successor is injective and zero is not a successor in the selected Peano-style frame.
- **Recursion:** defines a function from a base value and successor rule; existence/uniqueness uses the stated recursion principle.
- **Addition:** `n + 0 = n`; `n + S(m) = S(n + m)`.
- **Multiplication:** `n · 0 = 0`; `n · S(m) = n · m + n`.
- **Ordinary induction:** base case plus step from n to S(n).
- **Strong induction:** the step may assume all earlier cases; in this setting it is equivalent in proving power to ordinary induction.
- **Well-Ordering:** every nonempty subset of N has a least element.
- **Least counterexample:** if a counterexample set were nonempty, its least element conflicts with the induction-style step.

## Dependency audit

| Edge | Kind | Reason |
|---|---|---|
| Peano frame → recursion | mathematical foundation | recursion principle is stated over established N |
| Recursion → addition | mathematical | recursive definition |
| Addition → multiplication | mathematical | multiplication clause uses addition |
| Peano induction → applied induction | mathematical | proof method |
| Applied induction → counterexample lab | pedagogical | examples assume the method is known |
| Induction ↔ strong induction ↔ Well-Ordering | capstone equivalence | explicit implications with assumptions |
| Multiplication → capstone | **none** | multiplication is chapter content but not a prerequisite for Well-Ordering |

## Accessibility/source contract

Each content item stores: stable ID, vetted notation source, plain-language meaning, pronunciation where needed, optional deeper note, convention/assumptions, and accessible SVG/text alternative. KaTeX input is never directly displayed; invalid notation falls back to reviewed prose. No recall exam gates progress.

