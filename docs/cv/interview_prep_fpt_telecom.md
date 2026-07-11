# Chuẩn bị phỏng vấn — FPT Telecom
## Front-End Developer (React) · Trung tâm INFMN (Hạ tầng Miền Nam) · HCMC

> **Về role:** Đây là vị trí Front-End **thuần** (không phải full-stack), tập trung vào một việc cụ thể: **xây dashboard giám sát hạ tầng viễn thông** (CPE, Wi-Fi, network, QoE). Đơn vị quản lý là **Trung tâm Phát triển & Quản lý Hạ tầng Miền Nam (INFMN)** — nơi vận hành mạng lưới hạ tầng phía Nam của FPT Telecom. Bạn đang apply vào đội **build các công cụ nội bộ để vận hành/monitor mạng**.

---

## 0. Đọc JD đúng trọng tâm — đừng trả lời lan man

JD yêu cầu đúng 2 thứ cốt lõi:

1. **2+ năm React + TypeScript.**
2. **Kinh nghiệm xây dựng Dashboard / ứng dụng xử lý dữ liệu lớn.**

Ngoài ra nhắc đến JS/ES6, DOM, SASS/CSS, chuyển đổi design → code, tối ưu component, và query/xử lý dữ liệu từ database.

> 💡 **Chiến lược trả lời:** Mọi câu trả lời của bạn phải xoay quanh **2 từ khoá: Dashboard + Data Visualization**. Đừng pitch mình là full-stack — pitch mình là **frontend chuyên dashboard phức tạp**, có ngay project EVN GENCO3 (25+ module, ECharts, RBAC) làm bằng chứng. Đây là điểm match gần như hoàn hảo của bạn.

---

## 1. Ánh xạ CV → JD (bảng "match" mạnh nhất của bạn)

| Yêu cầu JD | Project của bạn | Cách dẫn |
|---|---|---|
| Dashboard application | **EVN GENCO3** — enterprise dashboard 25+ module, Ant Design Pro | "Em từng build dashboard enterprise 25+ module cho ngành điện, có RBAC, multi-tab keep-alive, i18n 3 ngôn ngữ." |
| Data visualization (chart: time-series, bar, pie…) | **EVN GENCO3** dùng **ECharts** (time-series, gauge, heatmap) + **Avatar48** dùng **TradingView** (real-time candlestick) | "Em rành ECharts cho time-series, gauge, heatmap; và TradingView cho real-time financial chart." |
| Query & xử lý dữ liệu lớn | React Query/TanStack Query (Avatar48, EVN) + pagination + filter/sort + memoize selector | "Dùng TanStack Query để fetch + cache, kết hợp `useMemo` cho các selector nặng (filter/sort trên dataset lớn)." |
| React + TypeScript 2+ năm | 4 năm full-stack TS, frontend xuyên suốt Next.js 15 / React | — |
| Tối ưu performance | NNG e-commerce **8s → 1s** (lazy load, virtualization, CDN, memoization) | Đây là câu chuyện performance mạnh nhất — dẫn khi hỏi về tối ưu. |
| Reusable component / library | EVN component reuse 25+ module, GenCodify drag-drop builder | "Em chia design-system component dùng chung, có cả kinh nghiệm build low-code drag-drop." |

> 🔥 **Câu mở đầu "Tell me about yourself" nên refactor để nhấn dashboard:**
> "Em là frontend developer 4 năm kinh nghiệm, chuyên **xây dựng dashboard phức tạp và xử lý dữ liệu lớn**. Dự án tiêu biểu là EVN GENCO3 — dashboard enterprise 25+ module với ECharts, RBAC, multi-tab keep-alive. Gần đây em cũng làm real-time chart (TradingView) cho sản phẩm Web3. Em đang tìm role frontend tập trung vào dashboard/data-viz, nên role ở INFMN rất match với hướng đi của em."

---

## 2. Domain knowledge — hiểu về CPE, Wi-Fi, network, QoE (rất ghi điểm)

Đây là phần **phân biệt** bạn với các ứng viên khác. Dashboard của đội INFMN hiển thị các loại dữ liệu viễn thông. Hiểu chúng là gì → bạn trả lời câu "em tưởng tượng dashboard này hiển thị gì" cực kỳ tự tin.

| Thuật ngữ | Ý nghĩa | Dữ liệu dashboard thường hiển thị |
|---|---|---|
| **CPE** (Customer Premises Equipment) | Thiết bị đặt tại nhà khách hàng (router ONT, modem, Wi-Fi AP) của FPT. | Trạng thái online/offline, model, firmware version, uptime, lỗi phần cứng. |
| **Wi-Fi** | Mạng không tốc độ nhà khách hàng | Tín hiệu (RSSI/dBm), băng tần 2.4G/5G, số thiết bị kết nối, throughput, dead-zone. |
| **Network** | Hạ tầng lõi/phân phối của FPT | Bandwidth sử dụng, packet loss, latency, trạng thái link, topology. |
| **QoE** (Quality of Experience) | Điểm trải nghiệm thực tế của khách hàng (mashup của nhiều metric) | Điểm QoE tổng hợp (0–100), tỷ lệ khách hài lòng, rớt mạng, thời gian xem IPTV giật. |

> 💡 **Cách dùng khi phỏng vấn:** Nếu được hỏi "Em sẽ thiết kế dashboard giám sát mạng như thế nào?" → dẫn:
> "Em sẽ chia theo **hierarchy**: tổng quan (topology map + KPI QoE tổng) → drill-down theo khu vực → chi tiết từng CPE. Chart chính sẽ là **time-series** (thông lượng/latency theo thời gian), kèm **gauge** cho QoE, **heatmap** cho mật độ thiết bị. Quan trọng nhất là **real-time** (refresh/có thể WebSocket) cho các alert, vì giám sát hạ tầng cần phản ứng nhanh."

---

## 3. Câu hỏi kỹ thuật theo trọng tâm Dashboard + Data-viz

Phần này có thể được hỏi trực tiếp hoặc qua bài live-code / design nhỏ. Trả lời gắn với kinh nghiệm thật.

### 3.1 🔥 "Anh từng dùng thư viện chart nào? So sánh?"

- **ECharts** (đã dùng ở EVN GENCO3): mạnh cho dashboard enterprise, nhiều loại chart (time-series, gauge, heatmap, sankey), performance tốt với dataset lớn nhờ canvas render + progressive rendering.
- **TradingView** (Avatar48): chuyên real-time financial chart, update từng tick, mượt cho streaming data.
- **Recharts** / **Chart.js**: nhẹ, dễ dùng cho dashboard đơn giản, nhưng chậm hơn khi dataset lớn (SVG-based).
- **D3.js**: linh hoạt nhất, custom được mọi thứ, nhưng phải tự xử lý manyual.

**Khi nào chọn gì:**
- Dashboard enterprise lớn → **ECharts** (canvas, scale tốt).
- Real-time streaming → TradingView hoặc ECharts `appendData`.
- Nhu cầu custom visual hoành tráng → D3.

### 3.2 🔥 "Dashboard load dữ liệu lớn — làm sao không giật/lag?"

**Điểm cover (đã từng làm ở NNG 8s→1s):**
- **Virtualization** (`react-window`/`@tanstack/react-virtual`) cho table/danh sách dài — chỉ render visible rows.
- **Pagination + lazy load** thay vì load all data.
- **Debounce/throttle** filter input để không query mỗi keystroke.
- **Memoize** selector nặng (`useMemo` cho filter/sort/aggregation).
- **Web Worker** nếu cần tính toán nặng (aggregation hàng nghìn điểm) mà không block UI thread.
- **Server-side aggregation**: đẩy việc tính toán về backend, frontend chỉ nhận dữ liệu đã tổng hợp sẵn.
- **Canvas-based chart** (ECharts) thay vì SVG cho số lượng điểm lớn.
- **Downsampling** dữ liệu time-series khi zoom-out (hiển thị 1 điểm / phút thay vì / giây).

### 3.3 🔥 "Làm sao update dashboard real-time mà không re-render toàn bộ?"

- **WebSocket / SSE** nhận push từ server thay vì polling.
- **Granular state update**: chỉ update đúng data slice thay đổi (vd: dùng TanStack Query với `queryKey` theo device ID → chỉ chart của device đó re-render).
- **`React.memo` + props đối chiếu nông (shallow compare)** để component chart không re-render khi data khác không đổi.
- **Throttle update** (vd: gộp update mỗi 500ms) nếu data tới quá nhanh — batch broadcast như em từng làm Socket.IO ở Avatar48.
- **Keyed updates**: ECharts hỗ trợ `setOption` với `notMerge: false` → chỉ patch phần thay đổi, không vẽ lại toàn chart.

### 3.4 "Truy vấn & xử lý dữ liệu từ database — anh làm ở frontend hay backend?"

> Đây là câu hỏi cửa. Đáp án đúng: **xử lý nặng ở backend, frontend chỉ hiển thị**. Nói thẳng:
> "Em luôn tách bạch: **backend chịu trách nhiệm query, aggregate, phân trang** — frontend chỉ nhận dữ liệu đã sẵn sàng qua REST/GraphQL. Lý do: (1) không leak SQL/DB logic ra client, (2) tận dụng index/optimization của DB, (3) tránh load dataset lớn về trình duyệt. Frontend chỉ làm việc với API contract đã định nghĩa."

### 3.5 "Thiết kế component reusable cho dashboard — approach?"

- **Composition over config**: một `<ChartCard>` chung (title, toolbar, refresh, export) nhận children chart cụ thể.
- **Config-driven**: định nghĩa dashboard bằng JSON config (loại chart, dataSource, refreshInterval) → render động — em đã tiếp cận kiểu này ở GenCodify (low-code builder).
- **Design tokens**: chart color/typography lấy từ theme tokens, không hardcode → đồng bộ với design system.

### 3.6 Câu React + TS kinh điển (xác suất cao)

Đây là vị trí React+TS, nên các câu sau gần như chắc chắn xuất hiện. Xem chi tiết ở [`frontend/`](../frontend/index.md), nhưng tóm tắt các câu dễ bị hỏi nhất:

- **`key` ở list tại sao quan trọng?** → giúp reconciliation xác định đúng node nào add/remove/update, tránh bug state lệch.
- **`useEffect` vs `useLayoutEffect`?** → effect chạy sau paint (async), layoutEffect chạy đồng bộ trước paint (dùng khi cần đo DOM trước khi render).
- **Controlled vs uncontrolled?** → controlled: React kiểm soát value qua state; uncontrolled: DOM giữ state, đọc qua ref.
- **`useMemo`/`useCallback` khi nào dùng, khi nào phản tác dụng?** → chỉ cho computation nặng + props/reference stability; lạm dụng làm tăng overhead mà không lợi.
- **TypeScript: `type` vs `interface`?** → `interface` mở rộng được (declaration merging), `type` linh hoạt (union, mapped). Dashboard data model thường dùng `interface`.
- **Generic component** (vd: `<DataTable<T>>`) → rất liên quan dashboard table — chuẩn bị kỹ.

---

## 4. Behavioral — gắn với role INFMN

| Câu hỏi | Nên dẫn bằng |
|---|---|
| **Giới thiệu bản thân** | Frontend 4 năm, chuyên dashboard phức tạp + data lớn (EVN GENCO3 25+ module). Đang tìm role tập trung dashboard/data-viz → match INFMN. |
| **Vì sao chọn FPT Telecom / INFMN?** | FPT Telecom là đơn vị tiên phong Internet VN; team INFMN vận hành hạ tầng mạng quy mô lớn → dashboard em build sẽ phục vụ quyết định vận hành thật, tác động đến hàng triệu khách hàng. Em thích build tool nội bộ có impact thực tế, không phải làm outsourcing mặt tiền. |
| **Vì sao rời công ty hiện tại?** | Tích cực: đang tìm role **frontend thuần, tập trung dashboard/data-viz** thay vì full-stack lan man. Tuyệt đối không nói xấu công ty cũ. |
| **Thách thức kỹ thuật lớn nhất?** | **NNG e-commerce 8s → 1s**: profile trước mới fix — lazy-load, virtualization, memoize selector, CDN + HTTP cache. **HOẶC** EVN GENCO3: quản lý state cho 25+ module (Zustand slice per module, multi-tab keep-alive không leak memory). Chọn câu phù hợp câu hỏi. |
| **Dự án tự hào nhất?** | EVN GENCO3 — vì phức tạp nhất ở góc dashboard: RBAC, OIDC SSO, multi-tab keep-alive, i18n, ECharts. Đặc biệt đúng trọng tâm role này. |
| **Làm việc solo vs team?** | Cả hai: sole engineer InspectAI (tự quyết architecture), lead team 4 ở NNG (fix 24 vuln pen-test). Dashboard ở INFMN chắc chắn làm team → em thoải mái. |

---

## 5. Câu hỏi nên hỏi ngược lại nhà tuyển dụng

> Hỏi ngược lại cho thấy bạn hiểu domain. Sắp xếp theo độ "ghi điểm":

1. **Dữ liệu dashboard**: "Dữ liệu CPE/Wi-Fi/QoE được push real-time (WebSocket/SSE) hay pull (polling)? Tần suất refresh mong muốn là bao nhiêu?"
2. **Quy mô**: "Dashboard phục vụ khoảng bao nhiêu user nội bộ, và lượng thiết bị CPE đang giám sát là cỡ nào?" → cho biết độ lớn bài toán performance.
3. **Stack hiện tại**: "Đội đang dùng thư viện chart nào (ECharts/Recharts/D3)? Có design system riêng không?"
4. **Backend contract**: "API đã có sẵn (REST/GraphQL) hay frontend cũng góp phần định nghĩa contract? Backend dùng gì?"
5. **Real-time**: "Có yêu cầu alert real-time khi thiết bị rớt mạng không? Em sẽ cần xử lý WebSocket/SSE không?"
6. **Team & quy trình**: "Team frontend có bao nhiêu người? Quy trình CI/CD và code review ra sao?"
7. (Vòng HR) Lộ trình thăng tiến + tech stack roadmap của INFMN.

> Đừng hỏi lương/phúc lợi ở vòng kỹ thuật — để dành vòng HR/offer.

---

## 6. Checklist ngày phỏng vấn

- [ ] **Pitch đúng trọng tâm**: frontend thuần, chuyên dashboard + data-viz. Đừng tự introduce là "full-stack" → khiến họ nghĩ bạn sẽ chán role thuần.
- [ ] **Ôn EVN GENCO3 kỹ nhất**: RBAC, OIDC SSO, multi-tab keep-alive, Zustand 25+ module, ECharts. Đây là bằng chứng gần nhất với role.
- [ ] **Ôn NNG 8s→1s**: câu chuyện performance mạnh nhất — nắm rõ từng bước (profile → lazy load → virtualization → memoize → CDN/HTTP cache → đo Lighthouse/Web Vitals).
- [ ] **Hiểu domain CPE/Wi-Fi/network/QoE** (mục 2) — phân biệt bạn với ứng viên khác.
- [ ] **Chuẩn bị câu trả lời cho 3.2 + 3.3** (large dataset + real-time update) — gần như chắc chắn hỏi.
- [ ] Ôn nhanh React + TS kinh điển (mục 3.6) — xem [`frontend/`](../frontend/index.md).
- [ ] **Mang theo 4–5 câu hỏi ngược lại** (mục 5) — đặc biệt câu về real-time + quy mô dữ liệu.
- [ ] Biết trước mức lương sàn của mình trước vòng HR (range market Mid Frontend HCMC ~15–25 triệu net; FPT Telecom thường "Thỏa thuận").

---

## 7. Lưu ý đặc thù FPT Telecom

- **FPT Telecom = văn hoá "khách hàng làm trọng tâm".** Khi nói về dashboard, luôn gắn với **"giúp đội vận hành phục vụ khách hàng tốt hơn / phát hiện sự cố nhanh hơn"** — không chỉ "dashboard đẹp".
- **Văn phòng**: INFMN ở **HCMC** (có thể gần khu Tân Thuận / Quận 7). Xác nhận địa điểm làm việc cụ thể khi vòng HR.
- **Quy trình tuyển dụng FPT Telecom**: thường 4 bước — sàng lọc hồ sơ → thi/tổng đối (nếu có) → phỏng vấn kỹ thuật (trực tiếp hoặc video call) → thông báo kết quả. Hồ sơ xét duyệt tối đa ~15 ngày làm việc; kết quả PV tối đa ~7 ngày làm việc.
- **Phúc lợi tiêu biểu**: lương cạnh tranh + lương tháng 13, thưởng hiệu suất, thưởng nghỉ mát, BHYT 100%, đào tạo phát triển. Salary đăng là "Thỏa thuận" → cần chuẩn bị range của mình.
- **Có thể có bài test/live-code** ngắn về React/TS hoặc bài nhỏ thiết kế 1 component dashboard → chuẩn bị tâm lý code chung.

---

> **Tóm tắt chiến lược 1 câu:** Bạn là frontend chuyên dashboard phức tạp + xử lý dữ liệu lớn (EVN GENCO3 là bằng chứng), hiểu domain viễn thông cơ bản, và có ngay câu chuyện performance (8s→1s) — đây là profile rất phù hợp với role INFMN. Pitch đúng trọng tâm, không lan man, là bạn đã có lợi thế lớn.
