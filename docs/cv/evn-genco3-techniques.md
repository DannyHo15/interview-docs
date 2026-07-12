# 🏭 EVN GENCO3 — Tổng hợp kỹ thuật (để ôn phỏng vấn)

> **Dự án:** Dashboard quản lý thị trường điện (EVN GENCO3), 25+ module. **Stack:** React 19 + Vite 7 + TypeScript + Ant Design 6 + Tailwind 4 + Zustand + TanStack Query + ECharts/Recharts + SignalR.
>
> **Cách dùng file:** Đây là "dự án bằng chứng" mạnh nhất của bạn cho role dashboard (xem [chiến lược FPT Telecom](./interview_prep_fpt_telecom.md)). Mỗi kỹ thuật dưới đây trình bày theo: **Là gì → Dự án làm thế nào (file thật) → Điểm nói khi phỏng vấn**. Học để khi họ đào sâu bất kỳ chỗ nào, bạn có câu chuyện thật để kể.

---

## 0. Kiến trúc tổng thể — kiến trúc 3 lớp theo module 🔥

**Là gì:** Mỗi domain nghiệp vụ (ví dụ `revenue-management`, `power-system`, `smp-management`) được chia thành 3 lớp cố định, giúp 25+ module đồng nhất và dễ mở rộng.

**Dự án làm thế nào:**

- **`src/api/{module}/`** — các hàm gọi API đã định kiểu (typed), dùng chung một `request` client (bọc Axios). Đây là nơi TanStack Query lấy dữ liệu.
- **`src/containers/{module}/`** — lớp **logic nghiệp vụ thật**: ghép các hook, biến đổi dữ liệu, lắp ráp component. Phần việc chính nằm ở đây.
- **`src/pages/{module}/`** — file entry mỏng ở tầng route, chỉ render container, được **lazy-load** bởi router.

Thêm một module mới là quy trình 6 bước cố định (tạo api → container → page → route → menu order → i18n keys cho cả 3 ngôn ngữ).

**Điểm nói khi phỏng vấn:**

> "Với dashboard 25+ module, em áp một kiến trúc 3 lớp nhất quán: lớp `api` chỉ lo gọi và định kiểu dữ liệu, lớp `container` giữ logic nghiệp vụ, lớp `page` mỏng để router lazy-load. Nhờ đồng nhất nên onboard người mới nhanh và không bị mỗi module một kiểu."

- **Follow-up "tại sao tách page và container?"** → Để tách phần định tuyến/lazy-load (page) khỏi phần logic (container). Page đổi khi routing đổi; container đổi khi nghiệp vụ đổi. Tách ra thì mỗi thứ có một lý do để thay đổi (đúng tinh thần Single Responsibility).

---

## 1. Request client tự viết — bọc Axios + builder pattern 🔥

**Là gì:** Thay vì gọi `axios` rải rác, dự án có một client tập trung (`src/utils/request.ts`) với interceptor lo mọi việc chung.

**Dự án làm thế nào:**

- **Builder pattern nhẹ:** mỗi lời gọi trả về object có `.json()`, ví dụ `request.get<T>(url).json()`. Tách rõ "tạo request" và "lấy dữ liệu", đồng thời ép kiểu trả về qua generic `<T>`.
- **Request interceptor** lo phần chung của mọi request:
  - **Gắn token** tự động từ Zustand `auth` store (hoặc cookie dự phòng): `Authorization: Bearer ...`.
  - **Gắn header ngôn ngữ** `X-Lang` từ store preferences, và `X-App-Name`.
  - **Bật loading toàn cục** bằng cách **đếm số request đang chạy** (xem mục 2).
  - **Xử lý upload:** khi body là `FormData`, **xóa `Content-Type`** để trình duyệt tự set `boundary` cho multipart — chi tiết nhỏ nhưng hay sai.
  - Có cờ `skipAuth` và `ignoreLoading` để bỏ qua khi cần.
- **Response interceptor** lo lỗi tập trung:
  - **401** → tự chuyển về trang login.
  - **428 + code `must_change_password`** → ép người dùng đổi mật khẩu.
  - Lỗi khác → hiện thông báo lỗi (bóc `errorMsg`/`message` từ nhiều dạng response) bằng Ant Design `message`.

**Điểm nói khi phỏng vấn:**

> "Em không rải axios khắp nơi mà gom vào một client. Interceptor lo token, ngôn ngữ, loading toàn cục, và xử lý lỗi tập trung — 401 tự về login, 428 ép đổi mật khẩu. Nhờ đó mỗi API module chỉ cần khai báo hàm gọi, không lặp lại logic hạ tầng."

- **Follow-up "gắn token ngoài React component thì lấy state kiểu gì?"** → Zustand cho phép đọc state ngoài React qua `store.getState()`. Interceptor không phải component nên không dùng hook được, mà gọi thẳng `useAuthStore.getState().accessToken`. Đây là một ưu điểm lớn của Zustand so với Context.
- **Follow-up "FormData sao phải xóa Content-Type?"** → Vì multipart cần một chuỗi `boundary` mà chỉ trình duyệt sinh đúng được. Nếu mình set `application/json` cứng thì server không parse được file.

---

## 2. Loading toàn cục bằng đếm request (request counting) 🔥

**Là gì:** Spinner toàn cục chỉ hiện khi **có ít nhất 1 request đang chạy**, và tắt khi **tất cả đã xong** — không bị nhấp nháy khi nhiều request chồng nhau.

**Dự án làm thế nào** (`src/utils/request/global-progress.ts`):

- Giữ một biến đếm `requestCount`. Mỗi request bắt đầu thì `+1`, xong thì `-1` (không cho xuống dưới 0).
- Chỉ **mở spinner khi đếm từ 0 → 1**, và **tắt khi về 0**. Nhờ vậy 5 request song song chỉ bật/tắt spinner một lần, không giật.
- Có `forceFinish()` để reset về 0 khi cần (ví dụ lỗi hàng loạt).

**Điểm nói khi phỏng vấn:**

> "Loading toàn cục em làm theo kiểu đếm tham chiếu: mở khi số request đi từ 0 lên 1, đóng khi về lại 0. Tránh được lỗi kinh điển là request A xong tắt spinner trong khi request B vẫn chạy."

- **Follow-up "nếu một request treo mãi thì sao?"** → Có timeout (mặc định 60s) và `forceFinish` để tránh spinner kẹt vĩnh viễn.

---

## 3. State management — Zustand (nhiều store nhỏ) + TanStack Query 🔥

**Là gì:** Tách bạch **client state** (Zustand) và **server state** (TanStack Query) — nguyên tắc quan trọng nhất về state.

**Dự án làm thế nào:**

- **Zustand** chia thành nhiều store nhỏ theo trách nhiệm (`src/store/`):
  - `auth` — token, roles (được **persist** vào localStorage qua middleware `persist`).
  - `user` — hồ sơ người dùng.
  - `access` — danh sách route/menu đã resolve theo quyền.
  - `global` — trạng thái spinner.
  - `tabs` — các tab đang mở (persist, xem mục 5).
  - `preferences` — theme, ngôn ngữ, cấu hình layout.
- **Đọc/ghi state ngoài component:** dùng `getState()`/`setState()` trong interceptor, guard, và các action — không cần hook.
- **Điều phối reset chéo store:** khi logout, `auth.reset()` gọi luôn `user.reset()`, `access.reset()`, `tabs.resetTabs()` để dọn sạch toàn hệ thống một chỗ.
- **TanStack Query** lo toàn bộ **server state**: cache, khử trùng lặp request, refetch, trạng thái loading/error. API module định nghĩa hàm fetch, container tiêu thụ qua custom hook.

**Điểm nói khi phỏng vấn:**

> "Em phân biệt rõ hai loại state: server state để TanStack Query lo (cache, dedup, refetch), còn client state (token, theme, tab, quyền) để Zustand. Zustand em chia thành nhiều store nhỏ theo trách nhiệm thay vì một store khổng lồ, và tận dụng được việc đọc state ngoài React trong interceptor."

- **Follow-up "sao không dùng Redux?"** → Zustand ít boilerplate hơn nhiều, không cần Provider bọc, đọc state ngoài component dễ, và có selector để tránh re-render thừa. Redux chỉ hơn khi cần middleware/devtools phức tạp hoặc team đã quen.
- **Follow-up "sao không nhét server data vào Zustand luôn?"** → Vì phải tự làm lại cache/refetch/dedup — những thứ TanStack Query đã làm sẵn và làm tốt. Nhét vào store rồi tự đồng bộ tay là nguồn bug.

---

## 4. RBAC + Dynamic Routing — AuthGuard 🔥🔥

**Là gì:** Người dùng chỉ thấy menu và vào được route mà **quyền của họ cho phép**. Route được **sinh động** theo quyền, hỗ trợ cả hai chế độ: quyền định nghĩa ở frontend hoặc lấy từ backend.

**Dự án làm thế nào** (`src/router/guard/auth-guard.tsx`):

- Khi vào app, `AuthGuard` gọi song song `getUserInfo()` và (nếu bật backend routing) `fetchAsyncRoutes()` bằng `Promise.allSettled` — một cái lỗi không kéo sập cái kia.
- **Sinh route theo quyền:**
  - `generateRoutesByFrontend(accessRoutes, roles)` — lọc route theo role ở frontend.
  - `generateRoutesFromBackend(menus)` — dựng route từ cấu hình menu backend trả về.
- Route sinh xong được nạp vào router động bằng `router.patchRoutes(...)` và lưu vào `access` store (cùng menu đã build).
- **Kỹ thuật chống nháy khi thêm route động:** sau khi patch route, gọi `navigate(pathname, { replace: true, flushSync: true })` để React Router match lại đúng route vừa thêm, tránh chớp trang 404.
- **Phân tầng chặn truy cập:** whitelist (route công khai) → chưa đăng nhập thì về login (nhớ đường dẫn cũ để quay lại) → phải đổi mật khẩu → kiểm role của route, không đủ quyền thì về **403**, route không tồn tại thì **404**, request lỗi thì **500**.

**Điểm nói khi phỏng vấn:**

> "Phần khó nhất về routing là phân quyền. Em làm AuthGuard sinh route động theo role — hỗ trợ cả quyền cấu hình ở frontend lẫn menu lấy từ backend. Sau khi nạp route động, em dùng `navigate` với `flushSync` để React Router match lại, tránh chớp trang 404. Không đủ quyền thì điều hướng 403, và mọi trạng thái lỗi đều có trang riêng."

- **Follow-up "vì sao dùng `allSettled` chứ không `all`?"** → `Promise.all` fail-fast: một request hỏng là hỏng hết. `allSettled` cho phép user info lỗi nhưng route vẫn dựng được (hoặc ngược lại), rồi mình xử lý phần hỏng riêng — bền hơn cho luồng khởi động.
- **Follow-up "route động lưu ở đâu để không mất khi F5?"** → Route được sinh lại mỗi lần khởi động từ user info/quyền (đã persist token), nên F5 vẫn dựng lại đúng. Không persist cả cây route (dễ lệch với backend).

---

## 5. Multi-tab keep-alive — như trình duyệt trong app 🔥

**Là gì:** Mở nhiều "tab" trong app; chuyển qua lại **giữ nguyên trạng thái** (scroll, filter, dữ liệu form) thay vì mount lại từ đầu — cực quan trọng cho dashboard vận hành, người dùng mở nhiều màn cùng lúc.

**Dự án làm thế nào:**

- **`tabs` store** (`src/store/tabs.ts`) giữ các tab đang mở trong một **`Map`** (giữ đúng thứ tự chèn), có đủ thao tác: thêm, đóng, đóng phải/trái/khác/tất cả, đổi thứ tự, phóng to. Được **persist** để F5 không mất tab.
- **`keepalive-for-react`** (`src/layout/layout-content/index.tsx`) bọc phần nội dung: component của tab bị ẩn được **giữ lại trong bộ nhớ** thay vì unmount, nên khi quay lại vẫn nguyên trạng thái. Có nút **refresh** để chủ động làm mới cache một tab.
- **Kéo-thả sắp xếp tab** bằng `@dnd-kit`.
- Khi logout, cache keep-alive được dọn theo `openTabs` để không rò rỉ bộ nhớ.

**Điểm nói khi phỏng vấn:**

> "Dashboard vận hành thì người dùng mở nhiều màn cùng lúc, nên em làm multi-tab keep-alive: mỗi tab là một entry trong store (dùng Map để giữ thứ tự, persist để F5 không mất), và dùng keepalive-for-react để giữ component tab ẩn trong bộ nhớ thay vì mount lại. Nhờ đó chuyển tab không mất filter/scroll. Em cũng lo dọn cache khi logout để không leak bộ nhớ."

- **Follow-up "keep-alive khác gì lazy render bình thường?"** → Component thường bị unmount khi rời route (mất state). Keep-alive giữ nó "sống" ẩn đi (giống `display:none` nhưng ở tầng React), nên state còn nguyên.
- **Follow-up "rủi ro của keep-alive?"** → Rò rỉ bộ nhớ nếu giữ quá nhiều tab, và dữ liệu có thể cũ (phải có nút refresh + tận dụng cache TanStack Query để làm mới). Cần giới hạn số tab hoặc dọn khi đóng.
- **Follow-up "sao dùng Map chứ không Array/Object?"** → Map giữ thứ tự chèn (cần cho thứ tự tab), tra theo key O(1), và xóa/kiểm tra tồn tại gọn hơn object.

---

## 6. Real-time bằng SignalR — reconnect & re-subscribe 🔥🔥

**Là gì:** Dashboard HMI (giám sát thiết bị) nhận dữ liệu đẩy real-time qua **SignalR** (WebSocket của .NET), tự kết nối lại và đăng ký lại khi rớt mạng.

**Dự án làm thế nào:**

- **Tạo kết nối** (`src/api/hmi/signalr.ts`):
  - `accessTokenFactory` để SignalR tự lấy token mới nhất từ Zustand mỗi lần kết nối.
  - **Auto-reconnect với backoff tăng dần:** `.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])` — thử lại ngay, rồi 2s, 5s, 10s, 30s.
  - Đăng ký/hủy đăng ký theo "tag" (mã điểm đo) qua `SubscribeTags`/`UnsubscribeTags`.
- **Provider quản lý vòng đời** (`src/containers/hmi/HmiRealtimeProvider.tsx`):
  - **Lưu tập tag đang subscribe trong `useRef`**, để khi **reconnect thì tự đăng ký lại** đúng các tag đó (`onreconnected` → `subscribeTags`).
  - **Dùng ref cho handler và status** để các callback **giữ nguyên identity** (không đổi khi status đổi) → diagram không bị reload SVG mỗi lần trạng thái kết nối nhấp nháy. Đây là kỹ thuật tránh re-render/re-bind rất tinh.
  - Có **mock mode**: khi dev không có hub thật, một bộ phát dữ liệu giả chạy đúng cùng đường dữ liệu → test UI không cần backend.
  - Callback (`subscribe`, `unsubscribe`, `onTagUpdated`) đều bọc `useCallback` với deps rỗng để ổn định.

**Điểm nói khi phỏng vấn:**

> "Màn HMI real-time em dùng SignalR. Điểm em chú ý nhất là độ bền khi rớt mạng: auto-reconnect với backoff tăng dần, và quan trọng là **lưu tập tag đang theo dõi trong ref để tự đăng ký lại sau khi reconnect** — nếu không, kết nối lại nhưng không nhận được dữ liệu. Em cũng giữ các callback ổn định bằng ref/useCallback để trạng thái kết nối nhấp nháy không làm reload lại cả sơ đồ."

- **Follow-up "sao dùng ref chứ không state cho tag/handler?"** → Vì cần đọc giá trị mới nhất trong callback mà **không muốn callback đổi identity** (state đổi → callback đổi → effect chạy lại → reload). Ref cho phép "đọc giá trị mới, giữ hàm cũ".
- **Follow-up "SignalR vs WebSocket thuần vs SSE?"** → SignalR (nền WebSocket) hợp vì backend .NET, có sẵn reconnect, hỗ trợ gọi hàm hai chiều (subscribe/unsubscribe). SSE chỉ một chiều; WebSocket thuần thì phải tự làm reconnect/subscribe.
- **Follow-up "dữ liệu tới quá nhanh thì sao?"** → Gộp/throttle cập nhật và cập nhật chart qua API mệnh lệnh thay vì setState mỗi tick (xem mục 7).

---

## 7. Data visualization — ECharts + Recharts 🔥

**Là gì:** Dự án dùng **cả hai** thư viện: ECharts cho chart nặng/nhiều loại, Recharts cho chart React gọn.

**Dự án làm thế nào** (ví dụ `can-total-chart-modal.tsx`):

- Cấu hình ECharts bằng object `option`, **bọc trong `useMemo`** với dependency là dữ liệu + theme → chỉ dựng lại option khi dữ liệu hoặc dark/light mode đổi, không dựng lại mỗi render.
- **Theming theo dark/light:** màu trục, chữ, đường lưới đọc từ bảng màu của module theo `isDark`, đồng bộ với theme toàn app.
- **Tooltip formatter** tùy biến để định dạng số theo nghiệp vụ (điện năng).
- Dữ liệu được **chuẩn hóa** trước khi vẽ (điền `0` cho ô thiếu, parse ngày bằng `dayjs`).

**Điểm nói khi phỏng vấn:**

> "Em dùng ECharts cho các chart dashboard vì nó render canvas, chịu dataset lớn, và có sẵn nhiều loại (time-series, gauge, heatmap). Cấu hình option em luôn bọc `useMemo` theo dữ liệu và theme, để chart không dựng lại vô ích. Màu sắc lấy từ theme token để đồng bộ dark/light. Recharts thì em dùng cho vài chart React đơn giản, gọn nhẹ hơn."

- **Follow-up "ECharts vs Recharts chọn sao?"** → Xem chi tiết ở [data-dashboard/01](../data-dashboard/01-charting-libraries.md). Tóm tắt: nhiều điểm/nhiều loại chart → ECharts (canvas); chart nhỏ, tích hợp JSX tự nhiên → Recharts (SVG).

---

## 8. i18n đa ngôn ngữ (3 thứ tiếng)

**Là gì:** App hỗ trợ **vi-VN (chính), en-US, zh-CN** qua `i18next` + `react-i18next`.

**Dự án làm thế nào:** File dịch trong `src/locales/`, dùng `$t("common.menu.xxx")` cho tiêu đề route và chuỗi dùng chung. Ngôn ngữ hiện tại được lưu trong preferences store và **gắn vào header `X-Lang`** mỗi request để backend trả nội dung đúng ngôn ngữ.

**Điểm nói khi phỏng vấn:**

> "App đa ngôn ngữ 3 thứ tiếng. Điểm em chú ý là đồng bộ ngôn ngữ hai đầu: frontend đổi qua i18next, đồng thời gắn `X-Lang` vào mọi request để backend trả dữ liệu đúng ngôn ngữ — không chỉ dịch nhãn tĩnh."

---

## 9. Performance — những gì thực sự làm

**Là gì:** Tập hợp kỹ thuật giữ dashboard 25+ module mượt.

**Dự án làm thế nào:**

- **Lazy-load page theo route** → chỉ tải code module khi vào, giảm bundle ban đầu.
- **Keep-alive** giữ tab (mục 5) → chuyển tab không mount lại (đổi nhanh hơn nhưng phải cân bằng bộ nhớ).
- **`useMemo` cho option chart** và các biến đổi dữ liệu nặng (mục 7).
- **TanStack Query cache** → chuyển qua lại giữa các màn không fetch lại dữ liệu còn tươi.
- **Selector của Zustand** → component chỉ re-render khi đúng slice nó cần đổi.
- **Cập nhật real-time qua ref** thay vì setState mỗi tick (mục 6) → không kéo cả cây re-render.
- Công cụ đo: `vite-bundle-visualizer` để soi bundle, `check:circular-deps` để bắt phụ thuộc vòng.

**Điểm nói khi phỏng vấn:**

> "Em tối ưu theo tầng: chia code theo route (lazy-load) để nhẹ bundle đầu; keep-alive + cache TanStack Query để chuyển màn nhanh; useMemo cho chart option; và với real-time thì cập nhật qua ref thay vì setState mỗi tick. Em đo bằng bundle visualizer và luôn quét phụ thuộc vòng."

> 💡 Ghép thêm câu chuyện **NNG 8s→1s** (profile → lazy load → virtualization → memoize → CDN/HTTP cache) khi họ hỏi sâu về performance — đó là câu chuyện mạnh nhất của bạn.

---

## 10. Chất lượng code & tooling

**Là gì:** Bộ công cụ đảm bảo chất lượng cho dự án nhiều người, nhiều module.

**Dự án làm thế nào:**

- **ESLint** với `@antfu/eslint-config` (tab, nháy đôi, chấm phẩy) + plugin React Hooks.
- **Conventional Commits** ép qua `commitlint` + `simple-git-hooks` (pre-commit chạy `lint-staged`, commit-msg kiểm định dạng).
- **Circular dependency scanner** (`ds src`) — bắt phụ thuộc vòng, một nguồn bug và bundle phình ngầm.
- **Testing:** `vitest` + `@testing-library/react` + `happy-dom`. Có test cho SignalR (`signalr.test.ts`) và provider real-time (`HmiRealtimeProvider.test.tsx`).
- **Fake server** (`vite-plugin-fake-server`) — mock API để dev không phụ thuộc backend.
- **Type safety:** TypeScript xuyên suốt, path alias `#*` → `src/*`.

**Điểm nói khi phỏng vấn:**

> "Dự án nhiều người nên em chuẩn hóa: ESLint + Prettier tự động qua git hook, commit theo Conventional Commits, quét circular dependency, và có fake server để dev song song với backend. Những phần logic quan trọng như SignalR provider em viết test bằng Vitest + Testing Library."

---

## Bảng tra nhanh — kỹ thuật ↔ file thật (để mở ra xem khi ôn)

| Kỹ thuật | File | Điểm nhấn |
|---|---|---|
| Request client + interceptor | `src/utils/request.ts` | builder `.json()`, token, X-Lang, 401/428, FormData |
| Loading toàn cục | `src/utils/request/global-progress.ts` | đếm request 0↔1 |
| Auth store (persist) | `src/store/auth.ts` | reset chéo store khi logout |
| Access store (route động) | `src/store/access.ts` | `patchRoutes`, build menu theo quyền |
| RBAC + dynamic routing | `src/router/guard/auth-guard.tsx` | `allSettled`, `flushSync`, 403/404/500 |
| Multi-tab keep-alive | `src/store/tabs.ts`, `src/layout/layout-content/index.tsx` | Map + persist, keepalive-for-react |
| Real-time SignalR | `src/api/hmi/signalr.ts`, `src/containers/hmi/HmiRealtimeProvider.tsx` | backoff reconnect, re-subscribe qua ref |
| Data-viz ECharts | `src/containers/can-management/components/can-total-chart-modal.tsx` | option trong useMemo, theme dark/light |

---

## Câu "kể về dự án phức tạp nhất" — kịch bản 90 giây

> "Dự án em tự hào nhất là dashboard quản lý thị trường điện cho EVN GENCO3 — 25+ module. Về mặt frontend nó phức tạp ở mấy điểm: **(1) phân quyền động** — route và menu sinh theo role, hỗ trợ cả cấu hình frontend lẫn menu từ backend; **(2) multi-tab keep-alive** — người vận hành mở nhiều màn cùng lúc nên em giữ trạng thái từng tab trong bộ nhớ, chuyển qua lại không mất filter; **(3) real-time HMI qua SignalR** — em xử lý reconnect và tự đăng ký lại các điểm đo sau khi rớt mạng; **(4) trực quan hóa** — ECharts cho time-series, gauge, heatmap, đồng bộ dark/light theme. Nền tảng là kiến trúc 3 lớp nhất quán cho 25+ module, Zustand cho client state, TanStack Query cho server state. Đây cũng là lý do em thấy role dashboard giám sát mạng rất khớp với mình."

---

🔗 [Chiến lược phỏng vấn FPT Telecom](./interview_prep_fpt_telecom.md) · [Data Dashboard — chiều sâu kỹ thuật](../data-dashboard/index.md) · [Frontend — React Core](../frontend/01-react-core.md)
