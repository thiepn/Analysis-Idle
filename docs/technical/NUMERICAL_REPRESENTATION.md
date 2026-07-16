# Numerical representation

## Range envelope

Natural Numbers targets <`1e12`; first four chapters envelope <`1e90`; initial campaign planning envelope <`1e220`; optional postgame may exceed `1e308`. These are architecture envelopes, not balance forecasts.

Phase 1 uses native JavaScript `number` behind opaque `GameNumber` operations: parse/construct, add/subtract/multiply/divide/pow/log, compare/min/max/clamp, finite assertions, canonical string codec, and separate formatter. UI/content cannot perform direct arithmetic or depend on a library object.

JavaScript integers above `2^53−1` are not exact and magnitudes around `1.8e308` overflow. Migration gate: before any reachable magnitude exceeds `1e280`, an economically meaningful increment is lost to precision, or layered exponentials are designed, compare a decimal/break-infinity/log backend and run save/replay migration tests. [MDN safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).

All operations reject NaN/Infinity/invalid strings. Formatting never converts invalid numbers to a plausible zero. Cost/production calculations test monotonicity, round-trip serialization, boundary precision, and backend-independent fixtures.

