# 🗃️ 02 — State Management (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. `useState` vs `useReducer`? 🔥

**Ngắn:**
- `useState`: state đơn giản, update bằng cách **set giá trị mới**.
- `useReducer`: state phức tạp / nhiều field liên quan, update qua **action dispatch** → reducer function tính state kế tiếp.

| | `useState` | `useReducer` |
|---|---|---|
| Phù hợp | 1-2 giá trị độc lập | State có nhiều transition logic (form, multi-step) |
| Update | `setX(value)` | `dispatch({ type })` → reducer switch |
| Test | Khó (cần component) | Dễ (reducer là pure function) |
| Debug | Đơn giản | Action log rõ ràng |

**Đào sâu:**
- **Rule of thumb:** > 3 state liên quan hoặc update logic phức tạp → `useReducer`.
- Reducer **phải pure** — không gọi API, không mutate; side effect cho `useEffect`.

```tsx
// useState — đơn giản
const [count, setCount] = useState(0);

// useReducer — nhiều transition
type State = { status: 'idle'|'loading'|'success'|'error'; data?: T; error?: E };
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'fetch': return { ...s, status: 'loading' };
    case 'success': return { status: 'success', data: a.payload };
    case 'error': return { status: 'error', error: a.payload };
    default: return s;
  }
}
```

**Gotcha:**
- `useState` với object: **luôn spread** `setUser({ ...user, name: 'x' })` — nếu không, mất field.
- **LoLamBenhAn** (dynamic form): nhiều field + validation + dirty state → `useReducer` + React Hook Form quản lý gọn hơn useState từng field.
- **Follow-up:** *"useState khởi tạo nhiều lần?"* → dùng **lazy init** `useState(() => expensiveInit())` để init chỉ chạy 1 lần.

---

## 2. Context pitfalls (re-render)? 🔥

**Ngắn:** Context chia state tới subtree mà không prop drilling — nhưng **mọi consumer re-render khi value object đổi** (so bằng reference).

**Đào sâu:**
- `value={{ user, theme }}` — mỗi render tạo object mới → consumer re-render dù `user/theme` không đổi.
- **Fix:**
  1. `useMemo` cho value object.
  2. **Tách context** — `UserContext`, `ThemeContext` riêng → đổi theme không re-render consumer của user.
  3. **Split read/write** — 1 context chứa state, 1 chứa setter (setter hiếm đổi).
- Hoặc **bỏ Context, dùng Zustand** (selector chỉ re-render khi slice chọn đổi).

**Gotcha:**
```tsx
// ❌ Mỗi render parent → value object mới → toàn consumer re-render
<UserContext.Provider value={{ user, setUser }}>
  <App />   // App & mọi useUser() re-render dù user không đổi
</UserContext.Provider>

// ✅ Memoize
const value = useMemo(() => ({ user, setUser }), [user]);
```
- **EVN GENCO3**: RBAC theo module — không dùng 1 Context khổng lồ, mà **mỗi module có context riêng** → đổi tab/module không re-render app.
- **Follow-up:** *"Context performance problem dấu hiệu?"* → component re-render không rõ lý do → React DevTools Profiler → nhìn "Context provider" trong flame chart.

---

## 3. Zustand vs Redux vs Jotai? 🔥

**Ngắn:**
| | **Redux (Toolkit)** | **Zustand** | **Jotai** |
|---|---|---|---|
| Model | Single store + reducer | Single store + hook | Atomic state |
| Boilerplate | Nhiều (slice, configure) | Rất ít | Rất ít |
| Re-render | Selector hook | Selector hook | Atomic (chỉ atom đổi re-render) |
| DevTools | Siêu mạnh (time-travel) | Tốt (middleware) | Tốt |
| Phù hợp | Team lớn, enterprise | Đa số app | Local state fine-grained |

**Đào sâu:**
- **Redux Toolkit (RTK)** fix boilerplate của Redux cũ — `createSlice` + Immer auto immutable.
- **Zustand** = store ngoài React, hook subscribe — không Provider, **selector fine-grained** → re-render chính xác component cần.
- **Jotai** = atomic (mỗi atom là 1 state độc lập) →极佳 cho state phụ thuộc lẫn nhau, derived state.

**Khi nào chọn:**
- **Enterprise/team quen Redux** → RTK (DevTools + middleware + chuẩn).
- **App nhỏ-vừa, không cần ceremony** → Zustand.
- **State fine-grained, derived nhiều** (vd form builder) → Jotai.

**Gotcha:**
- Redux Toolkit **đã tránh được** stereotype "boilerplate hell" của Redux cũ — đừng nói Redux tệ nữa.
- **Avatar48 DApp**: Zustand cho UI state (selected token, sidebar) + React Query cho server state (price, balance) → **tách bạch** client vs server state, đơn giản hơn Redux.
- **EVN GENCO3**: Zustand cho global (user, tab, theme) — selector `useUiStore(s => s.tabs)` chỉ re-render khi `tabs` đổi.
- **Follow-up:** *"Tại sao không dùng Redux cho mọi thứ?"* → theo thời gian app phình ra, Redux thêm ceremony; Zustand gọn và đủ 80% use case.

---

## 4. Server state (React Query) vs client state? 🔥

**Ngắn:**
- **Client state**: dữ liệu app sở hữu (UI state, form input, theme, filter) → Zustand/Redux/Context.
- **Server state**: dữ liệu **từ server**, owned bởi DB (user list, product, order) → **React Query / SWR** — vì có lifecycle riêng (cache, refetch, invalidation, optimistic).

| | Client state | Server state |
|---|---|---|
| Owner | App | Server (DB) |
| Update | App set | Mutate → server → invalidate |
| Cache | Ít cần | Quan trọng (stale, refetch) |
| Conflict | Local | Multi-client, race |

**Đào sâu:**
- React Query xử lý: **caching, dedupe, background refetch, retry, optimistic, pagination, infinite scroll** — nếu tự làm bằng `useEffect + useState` sẽ rất bug.
- Key concept: `staleTime` (khi nào coi là cũ → refetch background), `cacheTime` (khi nào xoá khỏi memory).
- **Mutation** → `invalidateQueries` → refetch affected queries.

```tsx
const { data } = useQuery({
  queryKey: ['tokens', address],
  queryFn: () => fetchTokens(address),
  staleTime: 30_000,   // 30s coi là fresh
});
```

**Gotcha:**
- **Lỗi phổ biến**: bỏ dữ liệu server vào Redux rồi tự quản loading/error → trùng lặp logic React Query đã có.
- **Avatar48 DApp**: React Query cho giá token, balance wallet — `staleTime` 10s, refetch background khi focus tab. Đừng dọn state thủ công.
- **Follow-up:** *"Khi nào KHÔNG dùng React Query?"* → realtime data (WebSocket push) — kết hợp React Query cho initial + WS cho update; hoặc server-less static data dùng fetch thường.

---

## 5. Khi nào Context vs global store?

**Ngắn:**
- **Context**: state **theme/domain** cho 1 subtree rõ ràng (vd theme cho app, RBAC cho module), ít thay đổi.
- **Global store** (Zustand/Redux): state dùng **khắp app** và **thay đổi thường xuyên**, cần fine-grained selector.

**Quy tắc:**
- Ít consumer, ít update → Context.
- Nhiều consumer, update thường, cần selector → store.

**Đào sâu:**
- Context **không có selector built-in** → mọi consumer re-render khi value đổi (xem câu 2).
- Store có `useStore(s => s.x)` → chỉ component phụ thuộc `x` re-render.

**Gotcha:**
- Đừng dùng Redux/Zustand cho state mà chỉ 1-2 component cần → **colocate** ở local.
- **EVN GENCO3**: OIDC SSO user info = Zustand (dùng ở mọi module, nhưng update ít); theme/lang = Context (subtree).
- **Follow-up:** *"Theme Context hay Theme Store?"* → theme hiếm đổi, dùng Context OK; nếu có animation theme switch mượt → store để subscribe ngoài React (GSAP, document root).

---

## 6. State colocation là gì?

**Ngắn:** Đặt state **gần nơi dùng nhất** — không vội đẩy lên global. State chỉ 1 component cần → giữ ở component đó.

**Đào sâu:**
- Đẩy state lên quá cao = **re-render nhiều component không cần**.
- "Lift state up" chỉ khi **nhiều component sibling cần cùng state**.
- Đa số state nên **local** — global store chỉ cho state thực sự cross-cutting (auth, theme, cart).

**Gotcha:**
- "Use Context cho mọi thứ" → anti-pattern. Chia state theo **scope**.
- **LoLamBenhAn** dynamic form: state của 1 field giữ **trong field component**, không push lên form root — chỉ root store lưu schema và value khi submit.
- **Follow-up:** *"Khi nào lift up?"* → 2 sibling cần sync → lift lên common ancestor gần nhất.

---

## 7. Immutable update & normalized state?

**Ngắn:**
- **Immutable update**: không mutate state trực tiếp (`state.x = 1`), mà tạo object/array mới (`{ ...state, x: 1 }`). React/Redux detect change bằng **reference equality**.
- **Normalized state**: lưu collection dạng `{ byId: {}, ids: [] }` thay vì array — để update 1 item **O(1)** thay vì scan.

**Đào sâu:**
- Mutate array `arr.push(x)` → React **không thấy đổi** (cùng reference) → không re-render.
- Normalized: update item `byId[3].name = …` → tạo `byId` mới (spread), `ids` giữ nguyên → selector chỉ re-render component dùng item 3.

```tsx
// ❌ Mutate
state.users.push(newUser);   // React không re-render

// ✅ Immutable
setState({ ...state, users: [...state.users, newUser] });

// ✅ Normalized
const state = { byId: { 1: {id:1,name:'A'} }, ids: [1] };
// Update user 1:
setState({ ...state, byId: { ...state.byId, 1: { ...state.byId[1], name: 'B' } } });
```

**Gotcha:**
- Array lồng sâu: immutable update painful → dùng **Immer** (`produce`) hoặc **Immutability Helper**.
- RTK + Zustand built-in Immer → `state.x = 1` bên hook nhìn như mutate, thực ra Immer tạo object mới.
- **Follow-up:** *"Tại sao không deep clone?"* → deep clone tốn O(n) + mất reference + chậm. Shallow + spread từng tầng hiệu quả hơn.

---

## 8. Optimistic update?

**Ngắn:** Update UI **ngay lập tức** giả định request thành công, sau đó nếu thất bại → **rollback**. Cải thiện UX cảm giác "nhanh".

**Đào sâu:**
- React Query: `useMutation` + `onMutate` (cập nhật cache trước) + `onError` (rollback) + `onSettled` (invalidate).

```tsx
useMutation({
  mutationFn: likePost,
  onMutate: async (newLike) => {
    await queryClient.cancelQueries(['post', id]);
    const prev = queryClient.getQueryData(['post', id]);
    queryClient.setQueryData(['post', id], old => ({ ...old, liked: true }));
    return { prev };   // context cho rollback
  },
  onError: (_e, _v, ctx) => queryClient.setQueryData(['post', id], ctx.prev),
  onSettled: () => queryClient.invalidateQueries(['post', id]),
});
```

**Gotcha:**
- **Chỉ optimistic khi confident** (vd like, toggle). Với create order/transfer tiền → **KHÔNG optimistic** (đợi server confirm).
- **Avatar48 DApp** (OKX DEX swap): KHÔNG optimistic cho swap token (phải đợi chain confirm); nhưng **optimistic cho UI state** (disable button ngay).
- **Follow-up:** *"Conflict khi 2 user update cùng lúc?"* → optimistic + server validate + trả version mới → client reconcile (xem乐观 locking câu 8 backend).

---

## 9. Persistence (localStorage / IndexedDB)?

**Ngắn:** Lưu state để **sống qua refresh** — theme, draft, cart, last-visited.

**Đào sâu:**
- **localStorage** (~5MB, sync) cho object nhỏ (theme, token).
- **IndexedDB** (async, lớn) cho data lớn (draft form 1000 field, offline cache).
- Zustand có middleware `persist` → auto sync store với localStorage.

```tsx
const useStore = create(persist(
  (set) => ({ theme: 'dark', setTheme }),
  { name: 'app-storage', partialize: (s) => ({ theme: s.theme }) }
));
```

**Gotcha:**
- **SSR pitfall** (Next.js): `localStorage` chỉ có ở client → guard `typeof window !== 'undefined'` hoặc `useEffect`.
- **Hydration mismatch**: server render theme default → client load theme đã persist → flicker. Fix bằng `next-themes` hoặc suppressHydrationWarning.
- **Avatar48 DApp**: i18n language persist qua localStorage — nhưng phải **hydrate** trước first paint để không flicker (load trong `_app` trước render).
- **Follow-up:** *"Khi nào IndexedDB?"* → dữ liệu lớn (>5MB) hoặc structured (offline-first app, PWA). Íd dùng Dexie/idb-keyval wrapper.

---

🔗 [Quay lại README frontend](./index.md)
