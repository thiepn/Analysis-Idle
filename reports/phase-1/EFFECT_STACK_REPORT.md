# Effect stack report

Effects activate only when their explicit source is owned and their serializable activation condition is met. Stable ordering is priority ascending, stacking-group lexical, then effect-ID lexical. The preview/decomposition selector uses the same resolver as production. Locked or unowned effects contribute nothing.

Machine data: `data/effect-stack.json`.
