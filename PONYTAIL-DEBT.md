# 🐴 Ponytail Debt Ledger

> Deliberate shortcuts marked with a `ponytail:` comment. Each names its ceiling
> and the trigger to revisit, so a deferral can't quietly become permanent.
>
> Re-generate: `grep -rnE '(#|//|<!--) ?ponytail:' docs src`

Scan date: 2026-07-12. Scope: `docs/`, `src/` (excludes `build/`, `.docusaurus/`, `node_modules/`).

---

## Ledger

| File:line | Simplification | Ceiling | Upgrade trigger | Rot risk |
|---|---|---|---|---|
| `docs/frontend/08-data-fetching.md:28` | In-flight promise cache for request dedupe illustration — bare `Map`, no TTL, no eviction | No TTL / no per-query scoping / in-memory only | Add TTL + per-query cache + LRU bounds **only if** this snippet is extracted into a real library or used in production code | ⚠️ `no-trigger` — no concrete revisit trigger named. Risk: a reader copy-pastes it as production-grade |

---

**1 marker, 1 with no trigger.**

> The one marker lives inside a teaching snippet, not production code, so the
> `no-trigger` flag is low-risk in practice. Add an explicit trigger if the
> snippet ever moves out of the docs.
