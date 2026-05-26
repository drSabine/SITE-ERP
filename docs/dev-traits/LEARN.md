# LEARN.md — Institutional Memory

> Bugs caught, patterns learned, decisions made. Read every session.
> **Last updated:** [date]

---

## 1. Architecture Decisions

- Modal-first CRUD — no separate Create/Edit pages. All mutations happen in modals.
- Services layer mandatory — no business logic in controllers.
- Co-located hooks — every page component has a matching `use<Component>.jsx` hook in the same directory.

---

## 2. Past Bugs & Lessons

> Add entries here whenever a non-obvious bug is fixed or a pattern causes repeated problems.

### Template

```
## [Short title]
- **Symptom:** what broke
- **Root cause:** why it broke
- **Fix:** what was done
- **Rule:** what to never do again
```

---

## 3. Over-engineering Caught

> Record hooks, guards, or abstractions that were added unnecessarily and later removed.

_(empty — add entries as they occur)_

---

## 4. Schema & Migration Notes

> Record any non-obvious schema decisions (e.g. why a column is nullable, why a relation is indirect).

_(empty — add entries as they occur)_
