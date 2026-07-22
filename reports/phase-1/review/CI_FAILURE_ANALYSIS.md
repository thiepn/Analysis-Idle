# CI failure analysis

## Failed runs at review start

- Phase 0 validation: [run 29668727057](https://github.com/thiepn/Analysis-Idle/actions/runs/29668727057)
- Phase 1 validation (pull request): [run 29668727067](https://github.com/thiepn/Analysis-Idle/actions/runs/29668727067)
- Phase 1 validation (push): [run 29668013069](https://github.com/thiepn/Analysis-Idle/actions/runs/29668013069)

## Exact evidence

```text
fatal: not a tree object
Error: Command failed: git ls-tree -r --long 239d75fd0e223e91703e261d2196953a896609cb
fatal: not a tree object
```

The Phase 1 boundary check then emitted:

```text
one or more of the 22 v1 baseline files differ from the immutable legacy commit
Process completed with exit code 1.
```

## Root cause and correction

Both workflows used the depth-1 default of `actions/checkout`. The checked-out PR/push commit existed, but immutable legacy commit `239d75fd0e223e91703e261d2196953a896609cb` did not. Phase 0's `git ls-tree` therefore failed, while Phase 1's comparison treated the unavailable baseline as a mismatch. This was not an OS, path-case, Node, or report-digest defect.

Both checkout steps now use `fetch-depth: 0`. The actual manifest generator and 22-file boundary validator remain unchanged and fail hard. This supplies their required Git object instead of bypassing validation.

## First correction-push failure

[Phase 1 run 29955301982](https://github.com/thiepn/Analysis-Idle/actions/runs/29955301982) passed `npm run ci` and the import-boundary step, then correctly failed `git diff --exit-code -- reports/phase-1`. Ubuntu and Windows produced different final binary digits for the report-only exponent-0.75 comparator:

```diff
- "two": 1.681792830507429
+ "two": 1.6817928305074292
- "marginalThird": 0.5977142264473485
+ "marginalThird": 0.5977142264473483
```

The gameplay state and deterministic digest matched. Both comparator generators now canonicalize report-only results to 12 decimal places before JSON serialization. This preserves meaningful precision while making byte output portable; the stability gate remains unchanged.

## Second correction-push result

Phase 1 passed for both [push run 29957792669](https://github.com/thiepn/Analysis-Idle/actions/runs/29957792669) and [pull-request run 29957794810](https://github.com/thiepn/Analysis-Idle/actions/runs/29957794810). [Phase 0 run 29957795160](https://github.com/thiepn/Analysis-Idle/actions/runs/29957795160) passed its full validation command, then exposed the same final-digit portability issue in `attention-model-results.json` during its unchanged artifact-stability gate. Phase 0 allocation outputs now use the same 12-decimal canonical form, with a regression assertion covering the values from the Ubuntu diff.

## Final verification

Final remote verification is pending the correction push; acceptance remains REQUEST_CHANGES until both required workflows succeed.
