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

## Final verification

Final remote verification is pending the correction push; acceptance remains REQUEST_CHANGES until both required workflows succeed.
