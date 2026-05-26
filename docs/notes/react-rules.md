# react-rules.md

> React patterns for this project. React built-ins first — custom hooks only when genuinely reused.

---

## State

- `useState` for local UI state (open/closed, selected item, input value).
- `useReducer` when a component has 3+ related state fields that change together (e.g. a multi-step form). Don't reach for it for simple 1-2 field state.
- `useContext` for state that multiple unrelated components need (auth user, theme). Not for component-tree-local state.
- No direct mutation. Use `.map()`, `.filter()`, spread (`{ ...obj, field: value }`).

## Forms

Use Inertia's `useForm` for all forms that submit to the server. It gives you `data`, `setData`, `errors`, `processing`, and `post`/`put`/`patch`/`delete` for free.

```js
const { data, setData, post, processing, errors } = useForm({ name: '', email: '' });
```

- `disabled={processing}` on the submit button is all the double-submit protection needed.
- Always validate on the Laravel side — never trust raw `data` without `$request->validate()`.

## Data Fetching

One-shot load on mount:

```js
const [items, setItems] = useState([]);
useEffect(() => {
    axios.get('/api/items').then(r => setItems(r.data));
}, []);
```

Search/filter input (effect re-fires on every keystroke) — cancel the previous request with native `AbortController`. No custom wrapper needed.

```js
useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/items', { params: { q }, signal: controller.signal })
        .then(r => setItems(r.data))
        .catch(e => { if (!axios.isCancel(e)) setError(e); });
    return () => controller.abort();
}, [q]);
```

After a mutation, the controller must `redirect()->back()`. Inertia re-sends page props automatically.

## Modals

- `const [open, setOpen] = useState(false)` — no `useModal` wrapper.
- Reset form/state in the Headless UI `afterLeave` callback, not in `onClose`. `onClose` fires while the transition is still animating; `afterLeave` fires after the DOM is gone.

```jsx
<Transition show={open} afterLeave={() => reset()}>
  ...
</Transition>
```

- Use `key={entity.id}` when editing different records in the same modal to force a clean remount.

## Custom Hooks

Only extract logic to a custom hook when:
1. The exact same logic is used in 2+ components.
2. The component file is hard to read because non-JSX logic buries the JSX.

Otherwise keep it inline. A 40-line component with `useState` and an `axios` call is not too big.

## Performance (useMemo / useCallback)

- Don't add `useMemo` or `useCallback` preemptively. They add bookkeeping cost and obscure intent.
- `const total = a + b` beats `useMemo(() => a + b, [a, b])` in every way.
- Only reach for them after profiling shows a real render bottleneck.

## Navigation

- Always use Inertia's `router.visit()` / `<Link>`. Never `window.location`.
- Preserve filters on pagination: include current filter state in router params.

