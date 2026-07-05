# ⚛️ 01 — React Core (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Virtual DOM & reconciliation là gì? 🔥

**Ngắn:**
- **Virtual DOM (VDOM):** bản sao cây DOM dưới dạng **JS object** trong memory. React thao tác trên VDOM (nhanh, vì chỉ JS) thay vì DOM thật (chậm, có layout/paint).
- **Reconciliation:** thuật toán React **so sánh** VDOM cũ vs mới → tính ra **diff** nhỏ nhất → chỉ cập nhật những node DOM thật sự thay đổi.

**Đào sâu:**
- VDOM node chỉ là object: `{ type: 'div', props: {…}, children: […] }`.
- React so sánh theo **heuristic O(n)**: khác `type` → thay cả subtree; cùng `type` → so props và cập nhật diff.
- **Bản chất không phải "VDOM nhanh hơn DOM"** — VDOM chỉ là lớp trung gian giúp React **batch update** và tránh layout thrashing.
- React 16+ dùng **Fiber** (xem câu 2) làm cấu trúc nội bộ thay cho VDOM cây đơn thuần.

**Gotcha:**
- "VDOM luôn nhanh hơn direct DOM" — **sai**. Direct DOM update 1 node (`el.textContent = …`) sẽ nhanh hơn; VDOM thắng khi UI phức tạp và state thay đổi rải rác.
- **Follow-up:** *"Tại sao Svelte/SolidJS không cần VDOM mà vẫn nhanh?"* → chúng **compile-time** biết chỗ nào thay đổi → update trực tiếp, không cần diff runtime.

---

## 2. Fiber architecture hoạt động thế nào?

**Ngắn:** Fiber là cấu trúc dữ liệu React 16+ dùng để biểu diễn cây component, cho phép **pause/resume** việc render → bật tính năng **concurrent** (interruptible rendering).

**Đào sâu:**
- Mỗi component = 1 **Fiber node** liên kết-linked-list với parent/sibling/child.
- Render chia thành các **unit of work** → React có thể **yield** giữa chừng về event loop (xử lý input user) rồi tiếp tục.
- 2 phase:
  - **Render phase** (có thể interrupt): tính diff — **pure**, không có side effect.
  - **Commit phase** (sync, không interrupt): apply diff lên DOM thật + chạy `useLayoutEffect`.
- `useEffect` chạy **sau commit**, async.

**Gotcha:**
- Render phase **có thể chạy lại** (Strict Mode, concurrent) → **side effect trong render = BUG** (double fetch, double increment). Đưa side effect vào `useEffect` / event handler.
- **Follow-up:** *"Tại sao React cần pause render?"* → UI 60fps; nếu render nặng 100ms, main thread bị block → input lag. Fiber cho React nhường CPU giữa chừng.

---

## 3. Tại sao `key` quan trọng? 🔥

**Ngắn:** `key` giúp reconciliation **identity** mỗi element giữa các render → biết item nào **thêm/sửa/xoá** thay vì re-render cả list.

**Đào sâu:**
- Không có `key` (hoặc dùng `index`) → React **giữ nguyên vị trí** → khi xoá item đầu, nó **re-use** node của item đầu cho item thứ 2 → props thay → **state bị trộn** (input của row A hiện giá trị row B).
- `key` phải **stable, unique, predictable** — tốt nhất là `item.id`.
- Dùng `index` chỉ OK khi list **static** (không add/remove/reorder).

**Gotcha:**
```tsx
// ❌ key={index}: đổi thứ tự → input state nhảy lung tung
{items.map((it, i) => <Row key={i} value={it} />)}

// ✅ key={it.id}
{items.map(it => <Row key={it.id} value={it} />)}
```
- **Gotcha thật:** Trong **Avatar48 DApp**, list trading history append liên tục từ WebSocket — dùng `index` sẽ re-mount row → `useEffect` bên trong chạy lại (chart mini, animation) → **lag**. Dùng `trade.id` để React reuse.
- **Follow-up:** *"Key có cần global unique không?"* → không, chỉ unique **trong sibling cùng cha**.

---

## 4. Controlled vs uncontrolled components? 🔥

**Ngắn:**
- **Controlled:** giá trị input được điều khiển bởi **React state** (`value` + `onChange`). React là "single source of truth".
- **Uncontrolled:** input giữ state nội bộ của DOM, React chỉ **đọc** qua `ref` (`defaultValue` + `useRef`).

| | Controlled | Uncontrolled |
|---|---|---|
| Source of truth | React state | DOM |
| Validate / transform | Dễ (mỗi keystroke) | Khó (đợi submit) |
| Performance | re-render mỗi keystroke | Không re-render |
| Khi dùng | Form cần validation | Form đơn giản, file input, integrate với lib không React |

**Đào sâu:**
- **LoLamBenhAn** (EMR dynamic form): dùng **React Hook Form + Zod** — RHF là **uncontrolled** ở bản chất (dùng `ref`), chỉ submit/getValues khi cần → **performance tốt** với 1000+ field, không re-render toàn form mỗi keystroke.
- Controlled thuần với 1000 field = **lag** vì mỗi keystroke setState → re-render toàn form.

**Gotcha:**
- `defaultValue` vs `value`: dùng `value` mà không có `onChange` → React warn "read-only".
- File input (`<input type="file">`) **chỉ dùng được uncontrolled** (vì lý do security, JS không set file).
- **Follow-up:** *"Khi nào nhất thiết phải controlled?"* → khi giá trị phụ thuộc state khác (vd disabled button theo form validity, hoặc format input ngay khi gõ).

---

## 5. `useRef` & `forwardRef` khi nào dùng?

**Ngắn:**
- `useRef`: giữ **mutable value** mà **không trigger re-render** khi thay; hoặc tham chiếu DOM node.
- `forwardRef`: cho phép component con **nhận ref** từ cha và forward vào DOM node bên trong.

**Đào sâu:**
- `useRef` ≠ state: đổi `ref.current` **không re-render** → tốt cho cache, timer id, value đọc sau.
- Pattern: `useRef` + `useEffect` cleanup cho **imperative API** (focus, scroll, measure).
- `forwardRef` + `useImperativeHandle`: tùy chỉnh API expose cho cha (vd `ref.current.focus()`).
- **React 19**: `ref` có thể là prop luôn (không cần `forwardRef` wrapper) — đỡ boilerplate.

```tsx
const Input = forwardRef<HTMLInputElement, Props>((props, ref) =>
  <input ref={ref} {...props} />
);
// Cha: const ref = useRef(); <Input ref={ref} />
```

**Gotcha:**
- Đừng dùng `useRef` thay `useState` cho giá trị **cần render UI** — UI sẽ không cập nhật.
- `ref` callback (function) dùng khi cần clean up observer khi unmount.
- **Follow-up:** *"Lấy kích thước element?"* → `useRef` + `getBoundingClientRect()` trong `useLayoutEffect` (trực tiếp sync trước paint), hoặc `ResizeObserver`.

---

## 6. React Synthetic Event vs native event?

**Ngắn:** React gói native DOM event thành **SyntheticEvent** — cross-browser API thống nhất, có cùng interface (`e.target`, `e.preventDefault()`, `e.stopPropagation()`).

**Đào sâu:**
- React 17+ **không** gắn listener ở `document` mà ở **root container** — fix issue event order với lib khác.
- **Event pooling** (React < 17): event object được tái sử dụng → `e` **bị null** sau callback (phải `e.persist()`). **React 17+ bỏ pooling** → không cần persist nữa.
- `e.nativeEvent` để truy cập event gốc.

**Gotcha:**
- React event **bubble qua** React tree, không phải DOM tree thực — nếu dùng `stopPropagation` ở native event trong `useEffect` → React event vẫn chạy.
- **Follow-up:** *"Tại sao không bắt event bằng `addEventListener` mà dùng onClick?"* → React gắn 1 listener ở root + map, **memory tiết kiệm** hơn gắn từng element.

---

## 7. Render phase vs commit phase?

**Ngắn:**
- **Render phase**: React gọi function component, tính VDOM diff — **pure**, **có thể interrupt** (concurrent).
- **Commit phase**: React apply diff lên DOM thật + chạy `useLayoutEffect` (sync) → sau đó `useEffect` (async).

**Đào sâu:**
- `useState` setter **không thay state ngay** — schedule render.
- **Commit phase sync** → nếu nặng sẽ block paint → jank.
- `useLayoutEffect`: chạy **sau DOM mutate, trước paint** → dùng khi cần đo layout & sửa (vd tooltip positioning). `useEffect` chạy **sau paint** → không block.

**Gotcha:**
- Side effect trong **render phase** (vd setState trong body function) = bug (infinite loop).
- **Follow-up:** *"useEffect vs useLayoutEffect khi nào?"* → đa số dùng `useEffect`. Chỉ `useLayoutEffect` khi **flicker** xảy ra (UI nháy trước khi effect sửa layout).

---

## 8. React 18 concurrent (`useTransition`/`useDeferredValue`)? 🔥

**Ngắn:** Concurrent cho React **interrupt render** → ưu tiên update cấp bách (input) hơn update nặng (list 10000 row).

**Đào sâu:**
- `useTransition`: đánh dấu update là **low priority** — trả `[isPending, startTransition]`.
- `useDeferredValue`: **defer** 1 giá trị → React render với giá trị cũ, sau đó re-render với giá trị mới.
- Ứng dụng: **search box** filter 10k items — gõ input update ngay (urgent), list filter ở background (deferred).

```tsx
const [isPending, startTransition] = useTransition();
const [query, setQuery] = useState('');
const [deferredQ, setDeferredQ] = useState('');

function onChange(e) {
  setQuery(e.target.value);              // urgent, render ngay
  startTransition(() => setDeferredQ(e.target.value));  // deferred
}
// List filter theo deferredQ → input không lag
```

**Gotcha:**
- `useTransition` **không phải magic** — chỉ re-prioritize, total work vẫn vậy. Nếu render 1 item nặng → vẫn chậm. Kết hợp `memo` + virtualization.
- **Follow-up:** *"Khác virtualization?"* → virtualization giảm số DOM node; concurrent giảm độ ưu tiên. Dùng **cả 2** cho list cực lớn.

---

## 9. Automatic batching, portals, error boundary, strict mode?

**Ngắn (4 mini concept):**
- **Automatic batching (React 18):** React gộp nhiều `setState` thành 1 re-render — kể cả trong `setTimeout`, `promise`, native event handler (React 17 chỉ batch trong event React).
- **Portal:** render children vào DOM node ở **chỗ khác** (thường `document.body`) — dùng cho modal/tooltip tránh `overflow: hidden`, `z-index` cha cắt.
- **Error Boundary:** class component `componentDidCatch` + `getDerivedStateFromError` → bắt lỗi render con, hiển thị fallback. **Hook không có** error boundary (phải dùng class hoặc lib).
- **Strict Mode:** dev-only, **double-invoke** render + effect để phát hiện side effect trong render/pure function.

**Đào sâu:**
- Automatic batching ảnh hưởng: nhiều `setState` liên tiếp = **1 re-render**, đỡ lag.
- Portal: DOM tree tách, nhưng **React tree vẫn là con** → event vẫn bubble qua React (vd `onClick` trong modal vẫn trigger cha).
- Strict Mode `useEffect` chạy 2 lần (mount → unmount → mount) → test cleanup đúng.

**Gotcha:**
- Strict Mode **chỉ dev** — production không double. Đừng "fix" bằng flag.
- Modal qua portal mà có focus trap → vẫn cần quản lý `aria`, keyboard nav.
- **Follow-up:** *"Tại sao effect chạy 2 lần?"* → React giả lập unmount/remount để bắt cleanup leak (unsubscribe, abort fetch).

---

## 10. Prop drilling & cách giải quyết?

**Ngắn:** Prop drilling = truyền prop qua **nhiều tầng** component để đến nơi cần → khó maintain, refactor đau.

**Giải pháp:**
1. **Context API** — share state tới subtree, không cần prop từng tầng.
2. **Global store** (Zustand/Redux/Jotai) — component nào cũng lấy được.
3. **Composition** (children render props, slot pattern) — đẩy prop xuống thay vì xuyên qua.
4. **React Query / server cache** — cho data server (không tự quản state).

**Đào sâu:**
- Context **re-render tất cả consumer** khi value đổi → **chia context** (theme context riêng, user context riêng) để giảm impact.
- Zustand dùng **selector** (`useStore(s => s.user)`) → chỉ re-render khi `user` đổi, không phải cả store.

**Gotcha:**
- Đừng vội thêm Redux/Zustand khi prop chỉ drill 2 tầng — đôi khi composition (`children`) gọn hơn.
- **EVN GENCO3**: 25+ module dashboard — dùng **Zustand** cho global state (user info, theme, tab state) + Context chia nhỏ cho RBAC per-module → tránh re-render toàn app khi đổi tab.
- **Follow-up:** *"Khi nào Redux thay vì Zustand?"* → Redux mạnh khi cần **DevTools middleware phức tạp**, **thunk/saga** orchestration, team đã quen. Còn lại Zustand gọn hơn.

---

🔗 [Quay lại README frontend](./index.md)
