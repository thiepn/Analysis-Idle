# Git handoff

Original SHA: `239d75fd0e223e91703e261d2196953a896609cb`.

Local safety refs were created successfully:

- `legacy/v1` → original SHA;
- annotated `v1.0.0-legacy` dereferences to original SHA;
- working branch `phase/00-design-lock` began at original SHA.

No refs were pushed; no PR/deploy/main change occurred. After reconciliation validation passes and the accepted Phase 0 tip is committed, create local `v2/integration` and `phase/01-deterministic-engine` at exactly that tip. Leave `phase/00-design-lock` checked out and do not implement Phase 1 in this handoff.

Owner-safe remote commands after review (never force):

```text
git push origin legacy/v1
git push origin v1.0.0-legacy
git push -u origin phase/00-design-lock
```

After validation passes and the Phase 0 commit is accepted:

```text
git branch v2/integration <accepted-phase-0-sha>
git branch phase/01-deterministic-engine <accepted-phase-0-sha>
git push -u origin v2/integration
```

If a remote `v2/integration` appears first, fetch/inspect and open a review handoff; never overwrite it.
