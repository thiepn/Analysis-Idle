# Effect stack report

Effects activate only when their explicit source is owned and their serializable activation condition is met. Operations resolve in flat, grouped-additive, multiplicative, power, and final-cap phases; ties use priority, stacking-group ordinal, then effect-ID ordinal. Preview/decomposition uses the production resolver. Locked, removed, or unowned sources contribute nothing.

Machine data: `data/effect-stack.json`.
