# ⚡ 03 — Performance (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Tại sao component re-render? 🔥

**Ngắn:** React re-render component khi:
1. **State** của nó thay đổi (`setState`).
2. **Props** thay đổi (cha re-render & truyền prop mới).
3. **Context** value thay đổi (nó consume).
4. **Cha re-render** (mặc dù prop không đổi) — React mặc định re-render con theo cây.

**Đào sâu:**
- React default **không** so sánh props sâu — chỉ reference equality.
- Component con không memo → re-render theo parent dù prop object cùng giá trị nhưng **khác reference**.

```
Parent render → tất cả con render (trừ con memo + props bằng reference)
```

**Gotcha:**
- Tạo object/function inline (`<Child onClick={() => …} />`) mỗi render → prop luôn mới ref → `memo` vô dụng. Fix: `useCallback`/`useMemo` hoặc defined ngoài.
- **EVN GENCO3** (25+ module): mỗi tab = route lazy + `memo` component nội dung → khi đổi tab khác, tab kia **keep-alive** (không unmount) nhưng chỉ tab active render.
- **Follow-up:** *"Làm sao debug re-render thừa?"* → React DevTools Profiler → "Why did this render?" → nhìn prop nào đổi ref.

---

## 2. `memo` / `useMemo` / `useCallback` — khi nào KHÔNG nên? 🔥

**Ngắn:**
- `React.memo(C)`: **skip re-render** nếu props bằng reference.
- `useMemo`: cache giá trị tính toán giữa các render.
- `useCallback`: cache function reference.

**Khi KHÔNG nên (anti-pattern):**
- Wrap function/state mà **không truyền cho child memo** → vô dụng (cha re-render thì cả function mới cũng chỉ tự dùng).
- Memo **tính toán rẻ** (`useMemo(() => a + b, …)`) → overhead memo > gain.
- Wrap mọi thứ "cho chắc" — **không miễn phí**: memo tốn memory + so sánh props mỗi render.

**Khi nên:**
- `memo`: child nặng + prop hay bằng ref (vd list item 1000 cái).
- `useMemo`: tính toán nặng (sort/filter 10k item, large object).
- `useCallback`: function truyền cho child đã `memo`, hoặc dependency của `useEffect`.

**Đào sâu:**
- **React Compiler (React 19)**: tự memoize → đỡ cần `useMemo`/`useCallback` thủ công. Trong tương lai, code React sẽ gọn hơn rất nhiều.

**Gotcha:**
- `useMemo` với dep `[a, b]` — nếu `a/b` là object ref mới mỗi render → useMemo recalc mỗi lần (vô dụng). Cần memo `a/b` trước.
- "Premature optimization": trước khi đo, **đừng memo**. Profile trước.
- **Follow-up:** *"Vậy React 19 có loại bỏ memo không?"* → React Compiler **auto** nhiều chỗ, nhưng vẫn cần `memo` cho API imperative / third-party.

---

## 3. React Compiler làm gì?

**Ngắn:** React Compiler (React 19, opt-in) **tự động memoize** component & giá trị — phát hiện khi nào re-render thừa và skip, không cần dev viết `useMemo`/`useCallback`.

**Đào sâu:**
- Compile-time analyze → insert memoization tương đương dev viết tay.
- Yêu cầu code **tuân thủ Rules of React** (pure render, side effect trong effect, không mutate state) — vi phạm → compiler cảnh báo.
- Có thể chạy cho code cũ (gradual adoption).

**Gotcha:**
- Không phải "magic free performance" — nếu component vi phạm pure (mutate prop, setState in render) → compiler không optimize được.
- **Follow-up:** *"Có nên migrate hết sang compiler?"* → từng phần, kết hợp với React 19; không phải drop-in replacement.

---

## 4. Code-splitting (`React.lazy` / Suspense, route-based)? 🔥

**Ngắn:** Chia bundle thành **nhiều chunk nhỏ**, load theo nhu cầu → giảm initial bundle → faster first paint.

**Cách:**
1. **Route-based**: lazy load mỗi page.
2. **Component-based**: lazy load component nặng (chart, editor) khi cần.
3. **Vendor split**: tách `node_modules` thành chunk riêng (cache lâu).

```tsx
const Dashboard = lazy(() => import('./Dashboard'));

<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

**Đào sâu:**
- Next.js: **file-system routing** auto code-split theo page. App Router (Next 13+) còn chia sâu hơn theo segment.
- **Prefetch**: Next.js tự prefetch link khi viewport gần → user click đã có sẵn.
- **Module Federation** (Nx): load bundle từ **app khác** runtime — GenCodify dùng để dynamic load "blocks" từ micro-frontend.

**Gotcha:**
- Over-split → mỗi chunk có overhead HTTP request + parse. Group hợp lý (vd 1 chunk cho cả dashboard).
- **GenCodify**: Module Federation load remote widgets — cần xử lý **version mismatch** + **shared dependency** (vd React chỉ load 1 lần).
- **Follow-up:** *"Làm sao đo cần split?"* → webpack-bundle-analyzer / Next.js `bundle-analyzer` → nhìn chunk > 200KB là suspect.

---

## 5. Bundle analysis & tree-shaking?

**Ngắn:**
- **Tree-shaking**: loại code **không dùng** khỏi bundle (dựa trên ES module static import).
- **Bundle analysis**: tool xem breakdown bundle theo module → phát hiện lib nặng / trùng.

**Tool:**
- Webpack: `webpack-bundle-analyzer`.
- Vite: `rollup-plugin-visualizer`.
- Next.js: `@next/bundle-analyzer`.

**Đào sâu:**
- Tree-shaking chỉ hiệu quả với **ESM** + **side-effect free** (`"sideEffects": false` trong package.json). CommonJS / lib có side effect → shake không được.
- Import specific: `import { get } from 'lodash'` (nếu lodash ES) → tốt hơn `import _ from 'lodash'`.
- Dùng `lodash-es`, `date-fns` (ESM) thay vì `lodash`, `moment` (không shake được).

**Gotcha:**
- `import * as lib` → **không shake được** (compiler không biết field nào dùng).
- **NNG** (e-commerce): migrate lib → moment → date-fns (ESM) + tree-shake → **giảm ~80KB**. Kết hợp lazy load → 8s → 1s.
- **Follow-up:** *"Làm sao biết lib gây bloat?"* → bundle-analyzer → nhìn phần lớn nhất → thay thế bằng lib nhẹ hơn hoặc self-implement.

---

## 6. Web Vitals (LCP / INP / CLS)? 🔥

**Ngắn:** Bộ metric Google đo **trải nghiệm user**:
- **LCP** (Largest Contentful Paint): thời gian render **nội dung lớn nhất** (thường hero image / heading). Mục tiêu < **2.5s**.
- **INP** (Interaction to Next Paint, thay FID 2024): độ trễ **tương tác** (click, key). Mục tiêu < **200ms**.
- **CLS** (Cumulative Layout Shift): tổng **dịch chuyển layout** bất ngờ. Mục tiêu < **0.1**.

**Đào sâu:**
- LCP tối ưu: preload font/image hero, SSR/cache, CDN, tránh render-blocking JS.
- INP tối ưu: giảm long task (>50ms), `useTransition` cho update nặng, web worker cho compute.
- CLS tối ưu: set `width/height` cho image/video, reserve space cho ad/embed, tránh insert DOM phía trên nội dung.

**Đo:**
- `web-vitals` npm package → report về analytics.
- Lighthouse / PageSpeed Insights / CrUX (real user data).

**Gotcha:**
- INP **không phải thời gian first interaction** — nó là **worst** interaction trong session.
- **NNG**: CLS cao vì ảnh không có dimension + banner inject sau → fix bằng reserve aspect-ratio → CLS giảm 0.3 → 0.05.
- **Avatar48 DApp**: LCP phụ thuộc TradingView library nặng → prefetch + skeleton → LCP < 2.5s.
- **Follow-up:***"Tại sao FID bị thay INP?"* → FID đo first interaction (thường nhẹ), INP đo toàn session → chân thực hơn.

---

## 7. Debounce / throttle?

**Ngắn:**
- **Debounce**: gọi function **sau** khoảng im lặng (vd user ngừng gõ 300ms) → dùng cho search box.
- **Throttle**: gọi function **nhiều nhất 1 lần / khoảng thời gian** (vd 1 lần/16ms) → dùng cho scroll/resize/mousemove.

```tsx
// Debounce search
const debouncedSearch = useMemo(
  () => debounce(q => fetch(q), 300),
  []
);
<input onChange={e => debouncedSearch(e.target.value)} />

// Throttle scroll handler
useEffect(() => {
  const handler = throttle(() => setScrollY(window.scrollY), 16);
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

**Đào sâu:**
- React 18 + concurrent: có thể thay debounce bằng `useDeferredValue` cho search (React optimize).
- Lodash `debounce`/`throttle` — nhớ **cancel** trong cleanup để tránh leak.

**Gotcha:**
- Quên cleanup → handler vẫn chạy sau unmount → setState trên unmounted → warning + memory leak.
- **Follow-up:***"Debounce vs setTimeout?"* → debounce wrap pattern tiện + cancel/resume, không reinvent.

---

## 8. Image optimization (`next/image`, lazy load)?

**Ngắn:**
- Dùng `next/image` (Next.js) hoặc `loading="lazy"` (native) → lazy load + responsive + format auto.
- Set `width/height` (hoặc `aspect-ratio`) để **tránh CLS**.

**Đào sâu:**
- `next/image` auto:
  - Convert sang **WebP/AVIF** (nhỏ hơn JPEG/PNG).
  - Generate **srcset** cho nhiều kích cỡ màn hình.
  - Lazy load mặc định (chỉ load khi gần viewport).
  - Blur placeholder.
- Đối với image host ngoài → dùng loader custom (imgix, Cloudinary).

**Gotcha:**
- `next/image` với domain ngoài → phải config `next.config.js` `images.domains`/`remotePatterns`.
- SVG thường không qua optimizer (vector nhẹ rồi), nhưng cần guard XSS nếu user upload.
- **NNG**: hero banner lớn → dùng AVIF + lazy + `priority` cho above-fold → giảm ~500KB, LCP giảm 1s.
- **Follow-up:***"Background image CSS có optimize không?"* → không, chỉ `<img>` / `next/image`. Background dùng `image-set()` + media query.

---

## 9. useMemo đo lường & khi nào thật sự cần?

**Ngắn:** Đừng useMemo "cho chắc" — **đo trước**. Quy tắc:
- Tính toán **< 1ms** → không cần memo.
- Render child nhận prop là kết quả → memo.
- Dependency là primitive ổn định → memo hiệu quả.

**Đo:**
```tsx
// Dev only
const t = performance.now();
const result = heavyCalc(data);
console.log('calc took', performance.now() - t);
```
- Hoặc React Profiler → xem "render duration" của component có `useMemo` vs không.

**Đào sâu:**
- `useMemo` tốn: so sánh dep mỗi render + memory cache. Nếu calc rẻ → memo tốn hơn gain.
- Memo "node" cho child: `useMemo(() => <HeavyChild data={x} />, [x])` → skip re-create element → skip child render nếu child memo.

**Gotcha:**
- React **không đảm bảo** cache vĩnh viễn — có thể drop memo khi memory cần (React 18+). Đừng dùng useMemo cho **logic phụ thuộc** (nó không phải `useRef`).
- **EVN GENCO3**: 25+ module dashboard → ECharts instance nặng → `useMemo` cho option object + `memo` component chart → tránh re-init chart mỗi render.
- **Follow-up:***"Khi nào đo performance?"* → trước optimize (baseline) → sau optimize (compare). Lighthouse + Profiler. **Đo, đừng đoán**.

---

🔗 [Quay lại README frontend](./index.md)
