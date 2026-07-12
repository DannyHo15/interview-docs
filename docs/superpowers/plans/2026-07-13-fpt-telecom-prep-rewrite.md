# FPT Telecom Prep Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi đè `docs/cv/interview_prep_fpt_telecom.md` bằng tài liệu prep sâu (theo OptiSigns style), tập trung EVN GENCO3 + domain viễn thông.

**Architecture:** 4 phần prose — Bối cảnh & pitch → 5 case study EVN (template làm-gì/vì-sao/trade-off/câu nói mẫu/follow-up) → 4 thuật ngữ domain + câu trả lời mẫu → Behavioral + câu hỏi hỏi lại. Mỗi case study có map JD trực tiếp, đánh dấu `⚠️ Suy luận` ở chỗ suy luận.

**Tech Stack:** Markdown (Docusaurus), không code.

## Global Constraints

- File đích: `docs/cv/interview_prep_fpt_telecom.md` (ghi đè toàn bộ)
- Không đổi `sidebars.ts` (đã đăng ký `cv/interview_prep_fpt_telecom`)
- Không lặp nội dung `docs/frontend/` (React/TS kinh điển) hay `docs/frontend-system-design/04-dashboard.md`
- Mọi chỗ suy luận phải có `⚠️ Suy luận` để user xác nhận
- Phong cách Việt-Anh song ngữ như `docs/cv/interview_prep_optisigns_vi.md` (giải thích VN, thuật ngữ kỹ thuật giữ EN)
- Verification: `bun run build` pass + self-check 5 thành phần template mỗi case study
- Commit convention (theo git log): `docs(cv): rewrite FPT Telecom prep — depth on EVN + telco domain`

---

## File Structure

| File | Hành động | Trách nhiệm |
|------|-----------|-------------|
| `docs/cv/interview_prep_fpt_telecom.md` | Ghi đè | Tài liệu prep duy nhất cho role này |

Một file, một trách nhiệm: prep phỏng vấn FPT Telecom Frontend.

---

### Task 1: Phần 1 — Bối cảnh role & chiến lược position

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (ghi đè từ đầu)

**Nội dung cụ thể cần viết:**

- [ ] **Step 1: Viết phần 1**

Ghi đè file với phần mở + phần 1. Nội dung:

**Tiêu đề:** `# Chuẩn bị phỏng vấn — FPT Telecom`
**Sub:** `## Front-End Developer (React) · INFMN (Hạ tầng Miền Nam) · HCMC`

**Blockquote bối cảnh (1 đoạn ~120 từ):**
- Role là FE thuần, build dashboard giám sát hạ tầng viễn thông (CPE, Wi-Fi, network, QoE).
- Đơn vị: Trung tâm Phát triển & Quản lý Hạ tầng Miền Nam (INFMN) — vận hành mạng phía Nam.
- JD cốt lõi 2 thứ: 2+ năm React+TS + kinh nghiệm Dashboard/xử lý dữ liệu lớn.

**Chiến lược position (1 đoạn ~80 từ):**
- Pitch "frontend chuyên dashboard phức tạp + xử lý dữ liệu lớn" — KHÔNG pitch full-stack (tránh cảm giác sẽ chán role thuần).
- Bằng chứng chính: EVN GENCO3 (dashboard 25+ module, ECharts, RBAC).

**Bảng ánh xạ CV↔JD (4 dòng):**

| Yêu cầu JD | Bằng chứng CV |
|---|---|
| Dashboard application | EVN GENCO3 — 25+ module, Ant Design Pro |
| Data visualization (chart) | ECharts (time-series, gauge, heatmap) ở EVN; TradingView ở Avatar48 |
| Xử lý dữ liệu lớn | TanStack Query + memoize selector + virtualization (NNG) |
| React + TS 2+ năm | 4 năm full-stack TS, frontend xuyên suốt |

**Câu pitch mở (blockquote):**
> "Em là frontend developer 4 năm kinh nghiệm, chuyên xây dashboard phức tạp và xử lý dữ liệu lớn. Dự án tiêu biểu là EVN GENCO3 — dashboard enterprise 25+ module với ECharts, RBAC, multi-tab keep-alive. Em đang tìm role frontend tập trung vào dashboard/data-viz, nên role ở INFMN rất match."

---

### Task 2: Phần 2.1 — Case study ECharts cho time-series với dataset lớn

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

**Nội dung cụ thể:**

- [ ] **Step 1: Viết case 2.1**

**Header:** `## 1. EVN GENCO3 — bảo vệ từng quyết định kỹ thuật`

**Intro ngắn (2 câu):** Mỗi quyết định dưới đây trình bày theo cấu trúc OptiSigns: làm gì → vì sao → trade-off nói thật. Mọi chỗ suy luận có đánh dấu để bạn xác nhận lại trước khi dùng trả lời.

**Case 2.1:** `### 1.1 Dùng ECharts (canvas renderer) cho time-series với dataset lớn`

**JD match (blockquote):** `> 📌 JD match: "Trực quan hóa dữ liệu: biểu đồ time-series..." + "ứng dụng xử lý dữ liệu lớn"`

**Bối cảnh:** EVN GENCO3 hiển thị nhiều chart time-series (thông lượng, công suất, tải theo thời gian) trên cùng một dashboard. Mỗi chart có thể tới hàng nghìn điểm dữ liệu.

⚠️ *Suy luận dựa trên stack ECharts — xác nhận: em dùng canvas renderer (mặc định) hay SVG? Dataset lớn cỡ nào (hàng nghìn hay hàng chục nghìn điểm)?*

**Làm gì:** Cấu hình ECharts với `renderer: 'canvas'` (mặc định), bật `progressive` + `progressiveThreshold` cho series có nhiều điểm. Dùng `appendData()` khi update real-time thay vì `setOption` lại toàn bộ.

**Vì sao:**
- Canvas render vẽ trực tiếp lên pixel — độ phức tạp không phụ thuộc số lượng DOM node, nên 10.000 điểm vẫn mượt. SVG thì mỗi điểm = 1 DOM element → browser nặng.
- `progressive` chia data thành chunk, render từng phần qua nhiều frame → không block UI thread.
- `appendData` chỉ thêm điểm mới vào series hiện có, không tính lại toàn bộ option — phù hợp dashboard real-time.

**Trade-off (nói thật):**
- Canvas không thao tác được từng element bằng CSS/DOM event như SVG → nếu cần hover từng điểm thì phải dùng ECharts `triggerEvent` (vẫn được nhưng kém trực quan hơn SVG).
- Canvas không scale tốt khi cần export vector (PDF/SVG) — phải render lại bằng SVG mode khi export.

**Câu nói mẫu (đọc to):**
> "Ở EVN GENCO3 em dùng ECharts với canvas renderer cho các chart time-series có nhiều điểm dữ liệu. Lý do là canvas vẽ thẳng lên pixel nên 10.000 điểm vẫn mượt, còn SVG thì mỗi điểm là một DOM node nên browser sẽ nặng. Em cũng bật progressive rendering để chia data thành chunk, không block UI. Khi update real-time thì dùng appendData thay vì setOption lại toàn bộ — chỉ thêm điểm mới vào. Trade-off là canvas khó style từng điểm bằng CSS và khó export vector, nên lúc cần export PDF em chuyển sang SVG mode."

**Follow-up có thể bị đào:** "AppendData hay setOption merge — khác biệt thực sự?"
→ `appendData` chỉ append data array, không trigger full option diff; `setOption` merge re-diff toàn option. Với update dạng "thêm 1 điểm mới mỗi giây" thì appendData rẻ hơn rõ rệt. Nhưng nếu cần đổi cả config (đổi loại chart, đổi trục) thì phải setOption.

---

### Task 3: Phần 2.2 — Case study State cho 25+ module (Zustand slice)

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết case 2.2**

**Case:** `### 1.2 Zustand slice per module cho dashboard 25+ module`

**JD match:** `> 📌 JD match: "ứng dụng dạng bảng điều khiển (Dashboard)" — dashboard nhiều module`

**Bối cảnh:** EVN GENCO3 có 25+ module (báo cáo, giám sát, cấu hình...). Mỗi module có state riêng (filter, selection, form tạm). Cần tránh state global khổng lồ khó maintain.

⚠️ *Suy luận — xác nhận: em có chia slice theo module không, hay dùng 1 store chung? Có dùng persist middleware không?*

**Làm gì:** Mỗi module = 1 Zustand slice riêng, compose vào store tổng qua `combine`. Selector dùng `shallow` equality để component chỉ re-render khi field mình subscribe thay đổi.

**Vì sao:**
- Slice per module → state của module A không nằm chung object với module B → component module A không re-render khi module B đổi.
- Zustand không cần provider (không Context hell), hook-based, TS-friendly — ít boilerplate hơn Redux cho dashboard cỡ này.
- `shallow` selector equality: `useStore(s => s.moduleA.filter, shallow)` — chỉ re-render khi `filter` đổi tham chiếu, không phải mỗi lần store update.

**Trade-off (nói thật):**
- Không có DevTools + time-travel debugging mạnh như Redux Toolkit — phải dùng middleware `zustand/middleware` devtools (yếu hơn).
- Cross-module state (vd: filter chung ảnh hưởng nhiều module) phải lift lên slice riêng → đôi khi lúng túng đặt state ở slice nào.
- Slice per module = nhiều file → onboarding người mới cần hiểu cấu trúc.

**Câu nói mẫu (đọc to):**
> "Em chia state theo slice per module — mỗi module 25+ có Zustand slice riêng, compose vào store tổng. Lý do là state module A không nằm chung object với module B, nên component module A không bị re-render khi module B đổi. Selector dùng shallow equality để chỉ subscribe đúng field mình cần. So với Redux thì Zustand ít boilerplate và không cần provider, phù hợp dashboard cỡ này. Trade-off là DevTools yếu hơn và cross-module state phải lift lên slice chung — đôi khi phải nghĩ kỹ đặt state ở đâu."

**Follow-up:** "25 module × state mỗi module → store có quá nặng không?"
→ Store tổng chỉ giữ reference tới các slice, mỗi slice tự quản data. Zustand store thực ra là 1 object — không "nặng" theo số module. Vấn đề thực sự là cross-module state: em giải quyết bằng cách lift filter chung lên slice `shared`, các module subscribe slice đó.

---

### Task 4: Phần 2.3 — Case study Multi-tab keep-alive + memory leak

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết case 2.3**

**Case:** `### 1.3 Multi-tab keep-alive + chống memory leak`

**JD match:** `> 📌 JD match: Dashboard UX — user vận hành mở nhiều tab giám sát song song`

**Bối cảnh:** EVN GENCO3 dùng giao diện multi-tab (giả Admin Ant Design Pro). User mở nhiều tab module song song. Yêu cầu: chuyển tab không mất state (filter, scroll position, form tạm).

⚠️ *Suy luận — xác nhận: em dùng `react-activation`, Ant Design Pro KeepAlive, hay custom portal?*

**Làm gì:**
- Dùng `react-activation` (`<KeepAlive>` wrapper) — unmount tab không destroy DOM thật, chỉ ẩn bằng CSS.
- Quản lý list tab active trong Zustand slice `tabs` (path, label, key).
- Giới hạn max tab cached (mặc định 10) — LRU evict tab cũ nhất khi vượt.
- Cleanup listener (socket, interval) trong `useEffect` cleanup — nhưng vì KeepAlive không unmount thật nên phải dùng `useActivate`/`useUnactivate` hook của react-activation.

**Vì sao:**
- Khi chuyển tab, nếu unmount thật thì state (scroll, form) mất hết → UX tệ cho dashboard vận hành.
- `react-activation` giữ DOM tree ẩn, restore ngay khi quay lại — gần như tức thì.
- LRU evict: 10 tab cached thì OK, nhưng 50 tab → memory tăng → phải evict tab cũ nhất.

**Trade-off (nói thật):**
- Memory: mỗi tab cached giữ nguyên DOM + state → 10 tab = 10 lần DOM tree. Phải giới hạn max + evict.
- Listener leak: vì component không unmount thật, `useEffect` cleanup không chạy → phải dùng `useUnactivate` để dọn socket/interval khi tab bị ẩn. Đây là bug rất dễ gặp.
- `react-activation` là thư viện bên thứ 3, phụ thuộc version React — đã từng break khi lên React 18 Strict Mode.

**Câu nói mẫu (đọc to):**
> "Em dùng react-activation để keep-alive các tab — khi chuyển tab, DOM không bị destroy, chỉ ẩn đi, nên state như scroll position và form tạm được giữ nguyên. Quản lý list tab trong Zustand slice, giới hạn max 10 tab cached rồi LRU evict. Điểm dễ bug nhất là cleanup listener: vì component không unmount thật nên useEffect cleanup không chạy, em phải dùng useUnactivate hook để dọn socket và interval khi tab bị ẩn. Trade-off là memory tăng theo số tab cached nên phải evict, và react-activation phụ thuộc version React."

**Follow-up:** "Tab bị evict rồi user quay lại — state mất hết, xử lý sao?"
→ Khi evict, persist state quan trọng (filter, selection) vào sessionStorage hoặc query string → khi user mở lại tab, restore từ đó. State ít quan trọng (scroll position) chấp nhận mất.

---

### Task 5: Phần 2.4 — Case study RBAC

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết case 2.4**

**Case:** `### 1.4 RBAC — route guard + component directive`

**JD match:** `> 📌 JD match: Dashboard nội bộ đội vận hành — chắc chắn cần phân quyền theo role/vùng miền`

**Bối cảnh:** EVN GENCO3 là dashboard enterprise nội bộ — nhiều role (admin, operator, viewer) + quyền khác nhau per module.

⚠️ *Suy luận — xác nhận: em có dùng permission string kiểu "report:read" không? Source of truth là backend trả trong user profile?*

**Làm gì:**
- Model: `role → permissions[]`, permission = `action:resource` (vd: `report:read`, `user:write`).
- Frontend 2 lớp:
  - Route guard: check permission trước khi vào route, redirect nếu thiếu.
  - Component directive: `<HasPermission action="user:write">{<Button/>}</HasPermission>` — ẩn nút nếu không có quyền.
- Source of truth: backend trả `permissions[]` trong user profile sau khi login → cache Zustand slice `auth`.
- Backend middleware check permission per API (frontend check chỉ là UX, không phải security).

**Vì sao:**
- Tách role và permission: role là nhóm, permission là chi tiết → thêm role mới không phải đổi code.
- Frontend check chỉ để ẩn UI (UX), security thật ở backend — không bao giờ trust frontend.
- Component directive tái sử dụng được, không lặp logic check ở nhiều nơi.

**Trade-off (nói thật):**
- Frontend và backend phải đồng bộ permission list — nếu backend thêm permission mà frontend chưa cập nhật thì UI không ẩn đúng.
- Permission string "report:read" có thể nổ (proliferate) khi module nhiều → cần naming convention chặt.
- User có nhiều role → phải union permission (deny-by-default, allow nếu 1 role có) — đôi khi khó lý giải cho user.

**Câu nói mẫu (đọc to):**
> "Em thiết kế RBAC theo model role-to-permission: mỗi role maps sang list permission dạng action:resource, ví dụ report:read hay user:write. Frontend có 2 lớp check — route guard trước khi vào route, và component directive HasPermission để ẩn nút theo quyền. Source of truth là backend trả permissions trong user profile sau login, em cache vào Zustand. Quan trọng là frontend check chỉ là UX, security thật nằm ở backend middleware — em không bao giờ trust frontend. Trade-off là phải đồng bộ permission list giữa frontend và backend, và naming convention phải chặt để không bị proliferate."

**Follow-up:** "User có 2 role, 1 role có quyền read, role kia không — kết quả?"
→ Union permission, deny-by-default: nếu 1 trong các role có quyền thì allow. Lý do: gán role là để cấp thêm quyền, không phải để thu hồi.

---

### Task 6: Phần 2.5 — Case study Tối ưu render real-time

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết case 2.5**

**Case:** `### 1.5 Tối ưu render khi data real-time thay đổi liên tục`

**JD match:** `> 📌 JD match: Dashboard giám sát mạng = dữ liệu update liên tục; tránh re-render toàn bộ`

**Bối cảnh:** Dashboard vận hành (giống INFMN sẽ build) có dữ liệu update liên tục — thiết bị rớt mạng, throughput đổi. Nếu re-render toàn dashboard mỗi update → giật lag.

⚠️ *Suy luận — EVN có phần real-time không, hay chủ yếu polling? Xác nhận cơ chế update.*

**Làm gì:**
- Granular state update: chỉ update đúng data slice thay đổi. Dùng TanStack Query với `queryKey` theo resource ID (vd: `['device', deviceId]`) → chỉ chart của device đó re-render.
- `React.memo` + shallow compare props cho component chart → không re-render khi props data không đổi.
- Throttle/batch update: nếu data tới quá nhanh (vd: 10 lần/giây), gộp update mỗi 500ms bằng `lodash.throttle` hoặc custom buffer.
- ECharts `setOption` với `notMerge: false` → chỉ patch phần thay đổi, không vẽ lại toàn chart.

**Vì sao:**
- Dashboard có nhiều widget độc lập — update widget A không nên kéo widget B re-render.
- TanStack Query cache theo key → update 1 key chỉ trigger subscriber key đó.
- Throttle giảm số re-render từ 10/giây xuống 2/giây — mắt người không nhận ra khác biệt, CPU giảm rõ.

**Trade-off (nói thật):**
- Throttle = độ trễ dữ liệu (tối đa 500ms) — với dashboard cảnh báo sự cố thì cần cân nhắc: alert phải realtime, chart thì throttle OK.
- Granular update đòi hỏi thiết kế queryKey cẩn thận — sai key thì update không tới đúng widget.
- `React.memo` lạm dụng → overhead so sánh props lớn hơn lợi ích re-render tiết kiệm.

**Câu nói mẫu (đọc to):**
> "Dashboard real-time thì vấn đề lớn nhất là tránh re-render toàn bộ mỗi update. Em giải quyết theo 3 lớp: thứ nhất, granular update — TanStack Query cache theo queryKey theo resource ID, nên update 1 device chỉ trigger chart của device đó. Thứ hai, React.memo kết hợp shallow compare để component chart không re-render khi data không đổi. Thứ ba, throttle update — nếu data tới 10 lần/giây em gộp lại mỗi 500ms, mắt người không nhận ra khác biệt mà CPU giảm rõ. Trade-off là throttle tạo độ trễ, nên với alert em giữ realtime, chỉ throttle phần chart."

**Follow-up:** "Alert realtime mà chart throttle — user thấy alert nhưng chart chưa update,矛盾?"
→ Alert và chart là 2 luồng riêng: alert push ngay qua WebSocket/SSE, chart update qua throttled state. Nếu user click alert để xem chart thì force refetch chart ngay (bypass throttle) — đảm bảo nhất quán.

---

### Task 7: Phần 3 — Domain viễn thông (CPE/Wi-Fi/Network/QoE)

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết phần 3**

**Header:** `## 2. Domain viễn thông — hiểu dữ liệu dashboard hiển thị`

**Intro (2 câu):** Phần này phân biệt bạn với ứng viên khác. Hiểu CPE/Wi-Fi/QoE là gì → trả lời "em tưởng tượng dashboard này hiển thị gì" cực tự tin.

**4 block, mỗi block theo template:**

**Block CPE:**
- **Là gì:** Customer Premises Equipment — thiết bị đặt tại nhà khách hàng (router ONT, modem, Wi-Fi AP) do FPT cấp.
- **Dữ liệu dashboard hiển thị:** trạng thái online/offline, model, firmware version, uptime, lỗi phần cứng, vị trí địa lý.
- **Trong EVN em đã xử lý tương tự:** trạng thái thiết bị điện (online/offline, uptime) — cùng pattern giám sát thiết bị.

**Block Wi-Fi:**
- **Là gì:** mạng không dây tại nhà khách hàng.
- **Dữ liệu:** tín hiệu (RSSI/dBm), băng tần 2.4G/5G, số thiết bị kết nối, throughput, dead-zone.
- **Trong EVN:** giám sát thông lượng/suy hao tín hiệu — cùng loại chart time-series.

**Block Network:**
- **Là gì:** hạ tầng lõi/phân phối của FPT.
- **Dữ liệu:** bandwidth sử dụng, packet loss, latency, trạng thái link, topology.
- **Trong EVN:** giám sát tải mạng điện — bandwidth/throughput time-series.

**Block QoE:**
- **Là gì:** Quality of Experience — điểm trải nghiệm khách hàng, mashup nhiều metric.
- **Dữ liệu:** điểm QoE tổng hợp (0–100), tỷ lệ hài lòng, rớt mạng, IPTV giật.
- **Trong EVN:** KPI tổng hợp trải nghiệm — cùng concept aggregate score.

**Câu trả lời mẫu hoàn chỉnh — "Em sẽ thiết kế dashboard giám sát mạng như thế nào?":**

> "Em sẽ chia dashboard theo hierarchy 3 tầng. Tầng 1 — tổng quan: topology map hiển thị trạng thái mạng toàn khu vực + KPI QoE tổng hợp (gauge 0–100). Tầng 2 — drill-down theo khu vực: list CPE ở khu vực đó, chart time-series thông lượng/latency. Tầng 3 — chi tiết từng CPE: trạng thái, firmware, lịch sử sự cố. Chart chính là time-series cho throughput/latency, gauge cho QoE, heatmap cho mật độ thiết bị. Phần alert realtime qua WebSocket — khi thiết bị rớt mạng thì push ngay. Phần chart thì throttle để tránh giật. Em từng làm pattern tương tự ở EVN GENCO3 — dashboard 25+ module với ECharts, nên tiếp cận này quen thuộc."

---

### Task 8: Phần 4 — Behavioral + câu hỏi hỏi lại

**Files:**
- Modify: `docs/cv/interview_prep_fpt_telecom.md` (append)

- [ ] **Step 1: Viết phần 4**

**Header:** `## 3. Behavioral + câu hỏi hỏi lại`

**3 câu behavioral (bảng):**

| Câu hỏi | Nên dẫn bằng |
|---|---|
| Giới thiệu bản thân | [Câu pitch ở phần 1 — frontend chuyên dashboard, EVN GENCO3 là bằng chứng] |
| Vì sao chọn FPT Telecom / INFMN? | FPT Telecom tiên phong Internet VN; INFMN vận hành hạ tầng quy mô lớn → dashboard em build phục vụ vận hành thật, tác động hàng triệu khách hàng. Em thích build tool nội bộ có impact thực tế. |
| Bug khó nhất / thách thức lớn? | [Chọn 1: multi-tab keep-alive memory leak (case 1.3) HOẶC tối ưu render real-time (case 1.5)] |

**5 câu hỏi hỏi lại (numbered list):**
1. Dữ liệu CPE/Wi-Fi/QoE push real-time (WebSocket/SSE) hay pull (polling)? Tần suất refresh?
2. Dashboard phục vụ khoảng bao nhiêu user nội bộ? Lượng CPE đang giám sát cỡ nào?
3. Đội đang dùng thư viện chart nào? Có design system riêng không?
4. API đã có sẵn (REST/GraphQL) hay frontend góp phần định nghĩa contract? Backend dùng gì?
5. Có yêu cầu alert real-time khi thiết bị rớt mạng không? Em sẽ cần xử lý WebSocket/SSE?

**Footer (1 câu):** Đừng hỏi lương/phúc lợi ở vòng kỹ thuật — để dành vòng HR/offer.

---

### Task 9: Build verify + self-check

**Files:**
- Test: `bun run build`

- [ ] **Step 1: Chạy build**

Run: `cd /Users/thanhdanh/Danny/PROJECT/interview/interview-docs && bun run build`
Expected: `[SUCCESS] Generated static files in "build".` — không lỗi.

- [ ] **Step 2: Self-check 5 thành phần template mỗi case study**

Kiểm tra file `docs/cv/interview_prep_fpt_telecom.md`:
- Mỗi case (1.1–1.5) có: JD match + bối cảnh + làm gì + vì sao + trade-off + câu nói mẫu + follow-up?
- Mọi chỗ suy luận có `⚠️ Suy luận`?
- Không lặp nội dung `docs/frontend/`?

- [ ] **Step 3: Commit**

```bash
git add docs/cv/interview_prep_fpt_telecom.md docs/superpowers/
git commit -m "docs(cv): rewrite FPT Telecom prep — depth on EVN + telco domain"
```
