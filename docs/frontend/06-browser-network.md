# 🌐 06 — Browser & Network (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn use-case: **Avatar48** (Socket.IO realtime price), **LoLamBenhAn** (WebSocket multi-clinician), **EVN GENCO3** (multi-tab keep-alive), **AI Communication** (fetch + TanStack Query).

---

## 1. JavaScript Event Loop — call stack, microtask vs macrotask? 🔥

**Ngắn:** JS single-thread. Event loop xử lý: **call stack** (sync) → **microtask queue** → **macrotask queue**. Lặp vô hạn.

| Queue | Ví dụ | Độ ưu tiên |
|---|---|---|
| Call stack | Sync code | Cao nhất |
| Microtask | `Promise.then`, `queueMicrotask`, `MutationObserver` | Sau mỗi sync task, trước macrotask |
| Macrotask | `setTimeout`, `setInterval`, I/O, `postMessage` | Sau khi microtask rỗng |
| Render | `requestAnimationFrame`, paint | Giữa macrotask |

**Đào sâu:**
- Sau mỗi macrotask, engine drain **toàn bộ** microtask queue trước khi macrotask kế tiếp.
- `await` = syntactic sugar cho `.then()` → microtask.
- `requestAnimationFrame` chạy ngay trước paint (đồng bộ với refresh rate).
- Node.js event loop khác browser (phases: timers, poll, check, close).

**Gotcha:** `setTimeout(fn, 0)` không chạy ngay — chờ call stack rỗng + microtask queue rỗng. Promise resolve luôn chạy trước.

**Follow-up:** Block main thread thế nào? → Sync loop dài → UI freeze. Daynard: Web Worker cho CPU-heavy.

```js
console.log('1');               // sync
setTimeout(() => console.log('4'), 0);  // macro
Promise.resolve().then(() => console.log('3')); // micro
console.log('2');               // sync
// Output: 1 2 3 4
```

---

## 2. async/await vs Promise — khác biệt, lỗi thường gặp? 🔥

**Ngắn:** `async/await` = syntax hiện đại trên Promise. Code tuần tự dễ đọc, error handling bằng `try/catch`. Vẫn là Promise bên dưới.

| Tiêu chí | Promise (`.then`) | async/await |
|---|---|---|
| Readability | Callback chain | Tuần tự như sync |
| Error handling | `.catch()` | `try/catch` |
| Debugging | Stack trace mù | Stack rõ |
| Loop sequential | Khó | `for...of await` |

**Đào sâu:**
- `await` **block** function hiện tại, không block main thread (function return Promise).
- Top-level `await` (ES2022): chỉ hoạt động trong ES module.
- Sequential vs parallel: `await a(); await b();` = chậm. `Promise.all([a(), b()])` = song song.
- Error propagation: lỗi ở `await` reject → throw trong `try`.
- Quên `await` → function trả Promise pending, bug khó debug.

**Gotcha:** Loop `forEach` + `await` **không** await được — `forEach` không await callback. Dùng `for...of` hoặc `Promise.all(arr.map(async ...))`.

**Follow-up:** Khi nào KHÔNG dùng `Promise.all`? → Khi task phụ thuộc nhau (B cần kết quả A). Hoặc cần fail-fast? → `Promise.all` reject khi 1 fail; `Promise.allSettled` chờ hết.

```js
// ❌ Sai — forEach không await
urls.forEach(async url => await fetch(url));

// ✅ Đúng
for (const url of urls) await fetch(url);
// hoặc song song
await Promise.all(urls.map(url => fetch(url)));
```

**Use-case:** **AI Communication** gọi stream AI model dùng `await` tuần tự + abort signal.

---

## 3. Reflow vs Repaint — khác nhau, performance? 🔥

**Ngắn:** **Reflow (layout)** = tính lại geometry (position/size). **Repaint (paint)** = vẽ lại pixel (color/bg) không đổi layout. Reflow **đắt hơn** repaint.

| Action | Reflow | Repaint |
|---|---|---|
| Đổi `color`, `background` | ❌ | ✅ |
| Đổi `width`, `margin`, `display` | ✅ | ✅ |
| Read `offsetWidth`, `getBoundingClientRect` | ✅ (force sync layout) | — |
| Add/remove DOM node | ✅ | ✅ |

**Đào sâu:**
- Browser **batch** style change để tối ưu. Nhưng **force sync layout** khi JS read geometry giữa các write → "layout thrashing".
- `transform`, `opacity` **không** trigger reflow — compositor layer riêng. Dùng cho animation 60fps.
- `will-change: transform` hint browser tạo layer (lạm dụng → tốn memory).
- `requestAnimationFrame` để sync animation với refresh.
- CSS `contain: layout style paint` cách ly subtree khỏi reflow tổng.

**Gotcha:** Đọc `element.offsetWidth` sau khi đổi style → ép sync reflow → loop này = layout thrashing (chậm 10x).

**Follow-up:** Tối ưu scroll perf? → `transform: translate3d` (GPU), virtual list (react-window), `content-visibility: auto`.

**Use-case:** **Avatar48** TradingView dùng canvas thay vì DOM cho chart — tránh reflow; **EVN GENCO3** ECharts dùng canvas/SVG + `will-change`.

```js
// ❌ Layout thrashing
for (let i = 0; i < items.length; i++) {
  items[i].style.width = box.offsetWidth + 'px'; // read → force reflow mỗi vòng
}
// ✅ Batch
const w = box.offsetWidth;
for (const it of items) it.style.width = w + 'px';
```

---

## 4. Critical Rendering Path — browser render page thế nào?

**Ngäng:** Từ HTML → pixels: **DOM** (HTML parse) + **CSSOM** (CSS parse) → **Render Tree** → **Layout** → **Paint** → **Composite**.

**Đào sâu:**
- HTML/CSS **render-blocking**: chặn paint cho đến khi load xong.
- `defer`: script tải async, chạy SAU khi parse HTML xong (theo order). `async`: chạy ngay khi tải xong (order không đảm bảo).
- `<link rel="preload">`: tải sớm resource quan trọng (font, critical CSS).
- FOUC (Flash of Unstyled Content): HTML render trước CSS load → fix inline critical CSS.
- CLS (Cumulative Layout Shift): reserve space cho image/video (`aspect-ratio`, width/height).

**Gotcha:** `display: none` element vẫn ở DOM + CSSOM nhưng KHÔNG ở render tree → không paint. `visibility: hidden` thì paint (chiếm chỗ).

**Follow-up:** Reduce TTFB/FCP? → SSR/SSG, preload critical font, inline CSS, lazy-load image (`loading="lazy"`).

---

## 5. CORS — simple request vs preflight? 🔥

**Ngắn:** **CORS** = Cross-Origin Resource Sharing. Browser chặn cross-origin response trừ khi server gửi header cho phép. **Preflight** = request `OPTIONS` kiểm tra quyền trước khi gửi request thật.

| Loại | Khi nào | Method | Headers cần |
|---|---|---|---|
| Simple | GET/POST + "simple" headers (Content-Type: text/plain, form...) | Request thẳng | — |
| Preflight | PUT/DELETE, custom headers, JSON body | `OPTIONS` trước | `Access-Control-Allow-*` |

**Đào sâu:**
- Origin = scheme + host + port. Khác 1 trong 3 = cross-origin.
- Server response headers: `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Max-Age`, `-Allow-Credentials`.
- Cookie cross-origin: cần `credentials: 'include'` + `Access-Control-Allow-Credentials: true` + origin **KHÔNG được `*`**.
- Preflight **cache** theo `Access-Control-Max-Age` (Chrome 600s, FF 86400s).
- CORS là **browser-only** protection — server vẫn nhận request (security by obscurity vs CSRF).

**Gotcha:** `Access-Control-Allow-Origin: *` **không** hoạt động với credentials → phải specify origin chính xác.

**Follow-up:** Dev env CORS error? → Proxy qua Vite dev server (`server.proxy`) tránh CORS hoàn toàn.

**Use-case:** **EVN GENCO3** OIDC SSO cần CORS cho token endpoint; **Avatar48** OKX DEX API dùng custom headers → preflight.

```
# Preflight response
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## 6. fetch vs axios — chọn cái nào?

**Ngắn:** `fetch` = native browser API, low-level. `axios` = library wrapper, nhiều feature sẵn (interceptor, timeout, JSON parse).

| Tiêu chí | fetch | axios |
|---|---|---|
| Bundle | 0 KB (native) | ~12 KB |
| JSON parse | Manual `res.json()` | Auto |
| Error handling | Reject chỉ network err (4xx/5xx không reject!) | Reject 4xx/5xx |
| Timeout | AbortController | `timeout: 5000` |
| Interceptor | Manual wrapper | Built-in |
| Progress upload | Khó (stream) | `onUploadProgress` |

**Đào sâu:**
- fetch cần check `res.ok` manually — đây là bug phổ biến nhất.
- AbortController: native way để cancel fetch. TanStack Query dùng nó.
- axios interceptor: gắn JWT, refresh token, log request — clean.
- React Native: cả 2 đều dùng được, fetch default.

**Gotcha:** `fetch` không throw khi 500 → `if (!res.ok) throw` bắt buộc.

**Follow-up:** Auto refresh token? → axios interceptor: 401 → call refresh → retry original. Hoặc TanStack Query `retry` callback.

```js
// fetch chuẩn với error handling
const res = await fetch(url, { signal: controller.signal });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
```

---

## 7. HTTP Caching — cache-control, ETag, khi nào dùng? 🔥

**Ngắn:** HTTP cache giảm request/latency. Hai cơ chế: **freshness** (`Cache-Control: max-age`) và **validation** (`ETag`, `Last-Modified`).

| Header | Ý nghĩa |
|---|---|
| `Cache-Control: max-age=3600` | Fresh 1h, dùng cache không hỏi server |
| `Cache-Control: no-cache` | Luôn revalidate trước khi dùng cache |
| `Cache-Control: no-store` | Không cache bao giờ |
| `Cache-Control: public/private` | CDN có cache / chỉ browser |
| `ETag: "abc123"` | Hash content, gửi `If-None-Match` revalidate → 304 |
| `Last-Modified` | Timestamp, `If-Modified-Since` |

**Đào sâu:**
- **Strong cache** (max-age): browser dùng cache thẳng, không network. Hết hạn → **weak cache** (ETag): request 1 byte, server trả 304 (no body) nếu chưa đổi.
- Hash filename (Vite: `app.a1b2c.js`) + `max-age=31536000 immutable` → cache vĩnh viễn. HTML thì `no-cache`.
- Service Worker: programmable cache (Cache API).
- `Vary: Accept-Language` → cache tách theo header.

**Gotcha:** `no-cache` ≠ `no-store`. `no-cache` vẫn cache nhưng revalidate; `no-store` không lưu gì.

**Follow-up:** Deploy new version? → Hash file mới → URL mới → browser fetch mới. HTML `no-cache` để lấy entry point mới.

**Use-case:** **EVN GENCO3** Vite hash bundle + nginx cache static; **Avatar48** Next.js ISR revalidate per-page.

---

## 8. WebSocket vs SSE vs Polling — realtime chọn gì? 🔥

**Ngắn:** 3 cách push data từ server → client.

| | Polling | SSE (Server-Sent Events) | WebSocket |
|---|---|---|---|
| Direction | Client → Server (request) | Server → Client (one-way) | Bidirectional |
| Protocol | HTTP | HTTP | WS (upgrade) |
| Reconnect | Manual | Auto built-in | Manual |
| Scale | Tốn request | Tốt | Phức tạp (sticky session) |
| Use case | Legacy, simple | Notification, live feed | Chat, game, trading |

**Đào sâu:**
- Polling: đơn giản, tốn băng thông. Long-polling: server giữ request đến khi có data.
- SSE: 1 TCP connection, server push event. Giới hạn 6 connection/origin HTTP/1.1.
- WebSocket: handshake HTTP → upgrade WS. Frame-based, low latency.
- Socket.IO = wrapper trên WebSocket + fallback polling + auto reconnect + room.
- React Native: WebSocket native support; cần polyfill một số env.

**Gotcha:** WebSocket qua load balancer cần sticky session hoặc IP hash — không round-robin.

**Follow-up:** Khi nào dùng SSE thay WS? → Chỉ cần push 1 chiều (notification, stock ticker, log stream). Đơn giản hơn WS nhiều.

**Use-case:** **Avatar48** Socket.IO cho realtime price + notification; **LoLamBenhAn** WebSocket cho multi-clinician realtime sync (bệnh án cập nhật đồng thời); **EVN GENCO3** keep-alive tab bằng `BroadcastChannel` + polling interval.

```ts
// SSE
const es = new EventSource('/api/stream');
es.onmessage = e => console.log(JSON.parse(e.data));

// WebSocket
const ws = new WebSocket('wss://...');
ws.onmessage = e => console.log(e.data);
ws.send(JSON.stringify({ type: 'subscribe', channel: 'price' }));
```

---

## 9. Storage: localStorage vs sessionStorage vs IndexedDB vs cookie?

**Ngắn:** 4 nơi lưu data client-side, mục đích khác nhau.

| | localStorage | sessionStorage | IndexedDB | Cookie |
|---|---|---|---|---|
| Capacity | ~5-10 MB | ~5 MB | Hundreds MB+ | 4 KB |
| Lifetime | Vĩnh viễn | Per tab | Vĩnh viễn | Set expires |
| Sent to server? | ❌ | ❌ | ❌ | ✅ Mỗi request |
| API | Sync `getItem` | Sync | Async (Promises) | Document.cookie |
| Type | String | String | Structured (object, blob) | String |

**Đào sâu:**
- localStorage **sync** → block main thread nếu data lớn. Né dùng trong render path.
- IndexedDB async, NoSQL — cho offline app (PWA), cache phức tạp.
- Cookie: `HttpOnly` (không đọc được bằng JS → chống XSS), `Secure` (HTTPS only), `SameSite=Lax/Strict/None` (chống CSRF).
- `HttpOnly` cookie là nơi an toàn nhất cho JWT/session token.
- Service Worker + Cache API: cache response programmatically.

**Gotcha:** localStorage **không** chia sẻ giữa subdomain (`app.x.com` vs `admin.x.com`). Cần share → cookie domain `.x.com`.

**Follow-up:** Lưu JWT ở đâu an toàn? → **HttpOnly cookie** (không XSS đọc được) > localStorage (XSS lấy được). Trade-off: khó refresh từ JS.

**Use-case:** **EVN GENCO3** OIDC token trong HttpOnly cookie; **LoLamBenhAn** draft form lưu localStorage auto-save.

---

## 10. JWT ở frontend & XSS — bảo mật thế nào?

**Ngắn:** JWT = stateless token (header.payload.signature). Frontend lưu token, gắn `Authorization: Bearer <token>`. Rủi ro: **XSS** (JS độc đọc được token) nếu lưu localStorage.

| Lưu ở | XSS rủi ro | CSRF rủi ro | Refresh từ JS |
|---|---|---|---|
| localStorage | **Cao** (document.cookie?) — actually JS đọc được | Thấp | Dễ |
| sessionStorage | Cao | Thấp | Dễ |
| HttpOnly cookie | **Thấp** (JS không đọc) | Cao (cần CSRF token) | Khó |
| Memory (state) | Thấp nhất | Thấp | Mất khi refresh |

**Đào sâu:**
- XSS: inject `<script>` → đọc localStorage/sessionStorage → gửi token đi. Chống: CSP, escape input, HttpOnly.
- CSRF: mượn cookie để gửi request từ site khác. Chống: `SameSite=Lax`, CSRF token, custom header.
- Refresh token rotation: short-lived access (15m) + long-lived refresh (7d) HttpOnly.
- BFF (Backend For Frontend) pattern: token chỉ ở server-side cookie, frontend gọi qua BFF proxy.

**Gotcha:** Dấu hiệu XSS → `<img src=x onerror=alert(1)>`. React **tự escape** mặc định (JSX) — nguy cơ chính là `dangerouslySetInnerHTML` và `href` từ user.

**Follow-up:** Làm chat app cho user gửi HTML? → Sanitize với DOMPurify trước khi render, whitelist tag/attr.

**Use-case:** **Avatar48** Privy quản lý auth (token trong cookie secure); **EVN GENCO3** OIDC SSO HttpOnly + refresh rotation.

```ts
// Pattern access + refresh
// Access 15m trong memory (Zustand store)
// Refresh 7d trong HttpOnly cookie → call /refresh lấy access mới
```

---

## 11. Debounce / throttle network call — tối ưu thế nào?

**Ngắn:** Giới hạn tần suất call function. **Debounce** = chỉ chạy SAU khi user ngừng action N ms. **Throttle** = chạy tối đa 1 lần mỗi N ms (giữ rate).

| | Debounce | Throttle |
|---|---|---|
| Search box | ✅ Chờ user gõ xong | ❌ Quá nhiều call |
| Scroll/resize | ❌ Chậm cảm giác | ✅ Mượt |
| Button spam | Cả 2 OK | ✅ Rate limit |
| Typing autosave | ✅ | — |

**Đào sâu:**
- Lodash `_.debounce(fn, 300)`, `_.throttle(fn, 100)`. Hoặc viết tay với `setTimeout` + `clearTimeout`.
- React: dùng `useMemo(() => debounce(fn, 300), [])` để giữ instance. Quên memo → debounce mới mỗi render → hỏng.
- TanStack Query built-in: `staleTime`, `refetchOnWindowFocus`, auto dedupe cùng key.
- Search suggest: debounce 300ms + cancel pending request khi user gõ tiếp (AbortController).

**Gotcha:** Debounce trong React functional component — nếu không `useMemo`/`useRef`, mỗi render tạo timer mới → không accumulate.

**Follow-up:** Cancel in-flight request khi user search lại? → AbortController, hoặc TanStack Query (`signal` passed to queryFn).

**Use-case:** **LoLamBenhAn** search bệnh nhân debounce 300ms + abort; **EVN GENCO3** filter table debounce + TanStack Query dedupe.

```tsx
// React + debounce đúng
const handleSearch = useMemo(
  () => debounce((q: string) => refetch({ q }), 300),
  []
);
```

---

🔗 [Quay lại README frontend](./index.md)
