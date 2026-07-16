# Effects and conditions

## Effect definition

```ts
interface EffectDefinition {
  id: string;
  source: { kind: "upgrade" | "milestone" | "artifact" | "method"; id: string };
  activation: ConditionDefinition;
  target: EffectTarget;
  operation: "flatAdd" | "groupAddPercent" | "namedMultiply" | "replaceFormula" | "setExponent" | "cap";
  value: GameNumber | number | FormulaRef;
  stackingGroup: string;
  priority: number;
  cap?: GameNumber;
  reset: ResetLayer;
  display: { short: string; accessible: string };
}
```

Apply in locked order: base → flat unit additions → grouped additive percentages → named multiplicative categories → formula replacement → exponent → cap. Sort by priority then stable effect ID. Validation rejects missing source/target/group, incompatible units, duplicate unique replacements, unbounded reductions, cycles, and non-finite results. Activation requires source ownership/validation; locked/unowned sources never apply.

## Conditions

Use an exhaustive AST: `all`, `any`, `not`, resource comparison, content status, project/node/artifact status, milestone, chapter status, setting/capability, and explicit constant. Every condition supports:

- boolean evaluation;
- progress `{current,target,ratio}` where meaningful;
- reviewed short and accessible descriptions;
- dependency-ID extraction;
- reachability/cycle validation;
- future localization message ID/parameters.

No arbitrary executable callbacks in content. Formula/condition registries use reviewed stable IDs. Tests cover truth tables, boundary equality, ordering, descriptions, dependency extraction, cycles, invalid IDs, ownership activation, display decomposition, reset, and finite results.

