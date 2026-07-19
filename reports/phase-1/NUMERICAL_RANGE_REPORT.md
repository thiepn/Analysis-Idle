# Numerical range report

The Phase 1 adapter rejects non-finite numbers, negative canonical stocks, division by zero, malformed serialized numbers, and values at or above `1e+280`. Arithmetic and serialization pass through the adapter; canonical production ledgers provide exact chunk equivalence for unchanged rates. No large-number dependency is justified yet.

Machine data: `data/numerical-range.json`.
