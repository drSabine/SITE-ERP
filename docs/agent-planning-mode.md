# Planning Mode

> For: architecture, audits, redesigns, new modules.
> **Last updated:** [date]

---

## Protocol

1. **Build context.**
   - [agents.md](agents.md) — stack + hard rules
   - [notes/domain-rules.md](notes/domain-rules.md) — relevant section
   - [dev-traits/LEARN.md](dev-traits/LEARN.md) — past patterns + lessons
   - Actual source files (Models, Services, Controllers, Pages)
2. **Check [plans/](plans/)** — already proposed?
3. **Security pass** — see [dev-traits/SECURITY.md](dev-traits/SECURITY.md). New endpoint = route middleware + policy + validation.
4. **Write plan:**
   1. What exists (cite source)
   2. What changes (steps)
   3. Risks / rules to honor
   4. Files to create / modify
   5. Affected consumers
5. **Verify before building:** `npm run build` is green now.

---

## Architecture cheat sheet

```
Routes
  /admin/*     → role:admin
  /[role]/*    → role:[role]     ← fill in as roles are defined

Layers
  Controller → Service → Model
  Auth: route middleware → policy → service rule
```

---

## Anti-patterns

| Don't | Do |
|---|---|
| Plan from docs alone | Read source first |
| Plan separate Create/Edit pages | Modal-first |
| Plan unpaginated index queries | Always paginate with `withQueryString()` |
| Assume unscoped queries | Scope by ownership / tenant / context |
| Change only the requested file | Plan updates for every consumer |
