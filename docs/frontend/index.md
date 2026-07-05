# 🎨 Frontend Interview — Bộ câu hỏi kinh điển

> Bộ tài liệu luyện phỏng vấn **frontend / React / React Native**, **song ngữ Việt–Anh** (giải thích tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh: hooks, reconciliation, render, state, memo, bundle…).
> Dành cho vị trí **Frontend + React Native**, mức **Mid → Mid-Senior**, tech chính **TypeScript end-to-end** (React, Next.js, React Native, NestJS).
> Khác với [system design](../system-design/index.md) (thiết kế hệ thống lớn), phần này tập trung **kiến thức & concept** dạng *"giải thích X"*, *"khác biệt giữa A và B"*.

---

## 📂 Cấu trúc thư mục

```
frontend/
├── README.md                  ← bạn đang ở đây (catalog + lộ trình ôn)
├── 01-react-core.md           ← Virtual DOM, reconciliation, Fiber, keys, concurrent…
├── 02-state-management.md     ← useState/useReducer, Context, Zustand/Redux, React Query…
├── 03-performance.md          ← re-render, memo/useMemo, code-splitting, Web Vitals…
├── 04-typescript.md           ← type vs interface, generics, utility, discriminated unions…
├── 05-styling-css.md          ← CSS layers, Tailwind, CSS-in-JS, layout, responsive…
├── 06-browser-network.md      ← event loop, storage, CORS, WebSocket, security, rendering…
└── 07-accessibility-testing.md ← a11y, ARIA, testing-library, Vitest/Jest, Playwright…
```

---

## 📋 Catalog câu hỏi kinh điển (theo chủ đề)

### ⚛️ 1. React Core — [`01-react-core.md`](./01-react-core.md)
- **Virtual DOM** & reconciliation là gì? 🔥
- **Fiber architecture** hoạt động thế nào?
- Tại sao **`key`** quan trọng? 🔥
- **Controlled vs uncontrolled** components? 🔥
- `useRef` & `forwardRef` khi nào dùng?
- **React Synthetic Event** vs native event?
- **Render phase** vs **commit phase**?
- React 18 **concurrent** (`useTransition`/`useDeferredValue`)? 🔥
- **Automatic batching**? Portal? Error Boundary? Strict Mode?

### 🗃️ 2. State Management — [`02-state-management.md`](./02-state-management.md)
- `useState` vs `useReducer`? 🔥
- **Context** pitfalls (re-render)? 🔥
- **Zustand vs Redux vs Jotai**? 🔥
- **Server state** (React Query) vs **client state**? 🔥
- Khi nào dùng Context, khi nào global store?
- **State colocation**? Immutable update? Normalized state? Optimistic update?

### ⚡ 3. Performance — [`03-performance.md`](./03-performance.md)
- Tại sao component **re-render**? 🔥
- `memo`/`useMemo`/`useCallback` — **khi nào KHÔNG nên**? 🔥
- **React Compiler** làm gì?
- **Code-splitting** (`React.lazy`/Suspense, route-based)? 🔥
- **Bundle analysis** & tree-shaking?
- **Web Vitals** (LCP/INP/CLS)? 🔥
- Debounce/throttle? Image optimization?

### 🔡 4. TypeScript — [`04-typescript.md`](./04-typescript.md)
- `type` vs `interface`? 🔥
- **Generics**? 🔥
- **Utility types** (Partial/Pick/Omit/Record/ReturnType)?
- **Narrowing**? **Discriminated unions**? 🔥
- `unknown` vs `any`? 🔥
- `keyof`/`typeof`? Enum pitfalls? `tsconfig strict`? Type erasure?

### 🎨 5. Styling & CSS — [`05-styling-css.md`](./05-styling-css.md)
- **Specificity** & cascade? CSS layers?
- **Flexbox vs Grid**? Khi nào dùng cái nào? 🔥
- **Tailwind** vs CSS-in-JS vs CSS Modules?
- **Responsive design** (mobile-first, container queries)?
- **BEM / naming convention**?
- **Theming** (dark mode, design tokens)?

### 🌐 6. Browser & Network — [`06-browser-network.md`](./06-browser-network.md)
- **Event loop** (task/microtask)? 🔥
- **Closure** & scope? Hoisting?
- **Storage** (cookie/localStorage/sessionStorage/IndexedDB)?
- **CORS**? Preflight? 🔥
- **WebSocket vs SSE vs Polling**? 🔥
- **Critical rendering path** (DOM/CSSOM/OM)?
- **XSS / CSRF / CSP** ở frontend?

### ♿ 7. Accessibility & Testing — [`07-accessibility-testing.md`](./07-accessibility-testing.md)
- **a11y** & **ARIA** cơ bản?
- Unit test vs Integration test vs E2E?
- **Testing Library** query order (role → text)? 🔥
- **Vitest/Jest** mock?
- **Playwright/Cypress** E2E?
- TDD ở frontend thực tế thế nào?

---

## 🗺️ Lộ trình ôn (Study Roadmap)

### Level 1 — Must-know (ôn đầu tiên, 1–2 tuần)
`React Core` → `State Management` → `Performance` → `TypeScript`
> Đây là thứ **chắc chắn được hỏi** ở mọi vòng kỹ thuật frontend. React internals + hooks + re-render là "must".

### Level 2 — Senior (tuần 3–4)
`Styling/CSS` (sâu) → `Browser/Network` (event loop, storage, security) → `A11y & Testing`
> Mid-Senior bị hỏi sâu về **browser internals** + **performance metrics** + **testing strategy**.

### Level 3 — Theo stack (gắn project thật)
- **Next.js 15 / SSR / RSC**: Avatar48 DApp, LoLamBenhAn.
- **Module Federation (Nx)**: GenCodify.
- **React Native**: riêng folder [`react-native/`](../react-native/index.md).
- **Realtime (WebSocket / CRDT)**: GenCodify (Yjs), LoLamBenhAn (WebSocket).

---

## ✍️ Mẹo trả lời câu hỏi concept frontend

1. **Bắt đầu bằng 1 câu định nghĩa gọn** (elevator answer) → rồi mới đào sâu. Interviewer muốn xem bạn có hiểu bản chất không.
2. **So sánh = bảng/trade-off**: khi hỏi "A vs B", luôn nêu **khi nào dùng A, khi nào dùng B** + nhược điểm.
3. **Gắn project thật**: mỗi câu nên nhắc tới 1 dự án trong CV — VD *"Ở EVN GENCO3 dashboard 25+ modules, tôi dùng Zustand + keep-alive layout để tránh re-mount tab…"* → điểm cộng lớn.
4. **Code block nhỏ**: interviewer thích thấy code thật (đừng pseudo-code lan man).
5. **Don't bullshit**: nếu không biết, nói *"Tôi chưa rành, nhưng theo tôi hiểu thì…"* rồi suy luận — tốt hơn bịa.
6. **Follow-up**: interviewer thường đào sâu ("vậy nếu component cha re-render 1000 lần thì sao?") — chuẩn bị sẵn các gotcha (đã ghi cuối mỗi câu).
7. **React 19 / React Compiler**: cập nhật mới — đọc kỹ để có câu trả lời "hiện đại".

---

## 🎯 Gắn với CV — project nào, hỏi gì

| Project | Tech | Câu dễ bị hỏi |
|---------|------|---------------|
| **Avatar48 DApp** | Next.js 15, Privy, TradingView, OKX DEX, React Query + Zustand | SSR vs CSR, wallet auth flow, WebSocket datafeed, i18n 4 ngôn ngữ, React Query caching |
| **EVN GENCO3** | React, Vite, Ant Design Pro, TanStack Query, Zustand, ECharts | Keep-alive multi-tab, RBAC, OIDC SSO, dashboard 25+ modules performance |
| **GenCodify** | React, Nx Module Federation, CraftJS, Yjs + Hocuspocus | Module Federation remote loading, CRDT conflict, drag-drop perf |
| **LoLamBenhAn** | Next.js 15, React Hook Form + Zod, WebSocket | Dynamic form schema, RHF perf với 1000 fields, WebSocket reconnect |
| **NNG** | Angular → Nx, e-commerce | **Page load 8s → 1s** (HOW?), lazy load, caching strategy |

---

📚 **Tài liệu tham khảo:**
- *React docs* (react.dev) — bản mới nhất, có cả React 19 / Compiler.
- *Frontend Interview Handbook* (Yangshun Tay).
- web.dev — Web Vitals, performance.
- MDN — CSS, DOM, event loop.
- *Refactoring UI* — design/styling.
