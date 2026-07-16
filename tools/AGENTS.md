# Tooling rules

- Tools must be deterministic by default, validate inputs, produce stable ordering, and separate data from runtime metadata.
- Generated artifacts declare their source model/version and reproduce with documented commands.
- Never rewrite v1 runtime files or production paths as a side effect.
- Fail loudly on non-finite values, invalid schemas, missing artifacts, and experiment-to-production imports.

