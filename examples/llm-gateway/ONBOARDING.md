# Onboarding — LLM Gateway (example)

> Tài liệu học dự án, sinh từ [knowledge graph](../../.understand-anything/knowledge-graph.json).
> Đối tượng: mới tới ví dụ `examples/llm-gateway/`, muốn hiểu kiến trúc trong ~20 phút trước khi đọc code.

Ví dụ này là một **LLM Gateway tối thiểu chạy được** (Bun + Elysia + Vercel AI SDK): một lớp mỏng đứng trước OpenAI/Google, gánh các mối lo **ngang** (secret, auth, rate-limit, quota, fallback, cost, observability) để app gọi không phải lặp lại. Đi kèm [mục 6 — LLM Gateway](../../docs/ai-engineering/06-streaming-multi-provider.md).

---

## 1. Project Overview

| | |
|---|---|
| **Tên** | `llm-gateway-example` |
| **Ngôn ngữ** | TypeScript (ESM) |
| **Runtime** | Bun |
| **Framework / SDK** | Elysia · Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`) |
| **Mô tả** | Gateway mỏng trước OpenAI/Google: tập trung secret, auth per-app, rate-limit, quota token/tháng, fallback Gemini→GPT, đo cost, log 1 dòng JSON/request. |

**Chạy thử nhanh:**

```bash
cd examples/llm-gateway
bun install
cp .env.example .env      # điền key thật
bun run dev               # http://localhost:4000
bun test                  # check rate-limit
```

---

## 2. Architecture Layers

Sáu lớp, từ ngoài vào trong. Mỗi request chỉ đi qua **một đường duy nhất**: `HTTP entry → handle()`.

| Lớp | Vai trò | File chính |
|---|---|---|
| **Documentation** | Bản đồ concern → code, hướng dẫn chạy | `README.md` |
| **Configuration** | Manifest + env (secret provider, port) | `package.json`, `.env.example` |
| **HTTP entry & auth** | Facade Elysia: `x-api-key` → app, định nghĩa route | `src/index.ts` + 2 endpoint |
| **Gateway core** | Cổng: limit → quota → fallback → cost → log | `src/gateway.ts` |
| **Policy primitives** | Logic chính sách thuần, test độc lập | `src/ratelimit.ts` |
| **Tests** | Khóa "money path" rate-limit | `src/gateway.test.ts` |

> **Đặc điểm kiến trúc:** trạng thái **in-memory** (Map đơn lẻ trong module). Các comment `ponytail:` đánh dấu đúng chỗ cần thay khi lên prod (Redis cho limit, Postgres cho usage/audit). Đây là ví dụ giáo dục, không phải bản production.

---

## 3. Key Concepts

- **Centralized secret** — App chỉ cầm `x-api-key` của gateway; key provider (OpenAI/Google) nằm trong `.env` phía server, app không bao giờ thấy. Quản lý key (rotate/revoke) tập trung một chỗ.
- **Provider fallback chain** — Chuỗi provider có thứ tự: Gemini 2.0 Flash → GPT-4o-mini, mỗi call có timeout 20s. Lỗi → thử provider kế; chỉ trả `502` khi **tất cả** fail. *(ponytail: bản demo fallback mọi lỗi; prod chỉ nên fail-over lỗi tạm 5xx/429/timeout, không fallback lỗi input.)*
- **Fixed-window rate limit** — Đếm request/phút trong một cửa sổ 60s; hết ngạch → `429`. Tách hẳn ra file riêng, thuần, inject clock để test không cần timer.
- **Monthly token quota** — Mỗi app có `monthlyTokenBudget`; vượt → `402`.
- **Cost tracking** — Bảng giá USD/1M-token theo model; mỗi request ước tính cost, gom per-app thành dashboard-lite ở `GET /metrics`.
- **Observability** — Mỗi request emit đúng 1 dòng JSON ra stdout (`{t, app, provider, tokens, ms, ok, fallback}`).
- **Dependency direction** — `index.ts → gateway.ts → ratelimit.ts`. `gateway.test.ts → ratelimit.ts`. Không có chu kỳ.

---

## 4. Guided Tour (thứ tự đọc đề nghị)

Đọc theo tour này để xây dựng mental model từ ngoài vào trong:

1. **Overview & concern map** — `README.md`. Bảng map từng concern (secret, auth, rate-limit, quota, fallback, cost, observability) tới đúng file/hàm. Đọc trước để biết "chỗ này ở đâu".
2. **Stack & deps** — `package.json`. Thấy Bun + Elysia + AI SDK. Lưu ý: ví dụ dùng `generateText` (không stream) để token usage/cost có sẵn ngay cuối call.
3. **HTTP entry & auth** — `src/index.ts`. `.derive()` gắn `app` vào context sau khi check `x-api-key` (sai → 401). `POST /v1/chat` → `handle`, `GET /metrics` → `metrics`.
4. **The gate** — `src/gateway.ts`, hàm `handle()`: rate-limit (429) → quota (402) → chuỗi provider timeout 20s + fallback → ghi usage/cost → log. Toàn bộ request đi qua hàm này.
5. **Pure policy primitive** — `src/ratelimit.ts`, hàm `rateLimit()`. Bài học thiết kế: truyền `now` vào thay vì gọi `Date.now()` bên trong = khác biệt giữa code phụ thuộc thời gian **test được** và **không test được**.
6. **Tests & secrets** — `src/gateway.test.ts` khóa money-path rate-limit (cho qua tới rpm rồi chặn, reset qua window mới). Cuối cùng `.env.example` giữ secret tập trung — chính là concept mà cả gateway xoay quanh.

---

## 5. File Map

### Documentation
- **`README.md`** — Map concern → code, lệnh chạy/test/curl, và danh sách các thứ **cố tình bỏ** (streaming, guardrail, RBAC, audit, HA) — đọc để biết giới hạn phạm vi ví dụ.

### Configuration
- **`package.json`** — Manifest Bun/ESM, deps AI SDK + Elysia, scripts `dev`/`start`/`test`.
- **`.env.example`** — Template `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `PORT`. Server-side only.

### HTTP entry & auth (`src/index.ts`, *simple*)
- Facade Elysia. `POST /v1/chat` validate body `{messages:[{role,content}]}` → `handle`, map `GateError` ra status. `GET /metrics` trả usage per-app. Listen `PORT` (mặc định 4000).
- Endpoint: `POST /v1/chat` (chat chính), `GET /metrics` (dashboard-lite).

### Gateway core (`src/gateway.ts`, *moderate* — hotspot)
- Hàm / kiểu chính: `handle()` (cổng chính), `appByKey()` (tra app theo key), `metrics()`, `estimateCost()`, `bump()` (cập nhật usage), `withTimeout()` (race timeout), `log()`. Kiểu: `AppConfig`, `GateError`, `Usage`.

### Policy primitives (`src/ratelimit.ts`, *simple*)
- `rateLimit(win, rpm, now)` — fixed-window, trả `{allowed, win}`. Thuần, không dependency. Kiểu `Window`.

### Tests (`src/gateway.test.ts`, *simple*)
- 2 test bun:test: cho qua tới đúng rpm rồi chặn; reset khi sang window mới.

---

## 6. Complexity Hotspot

> **`src/gateway.ts` — hàm `handle()`** là nơi duy nhất có độ phức tạp đáng kể (moderate). Phần còn lại của ví dụ đều *simple*.

Vì sao cẩn thận:
- Vòng lặp fallback trên `CHAIN`: mỗi provider `try/catch`, track `i > 0` để đếm fallback, bắt `lastErr` để surface `502`.
- Nguồn trạng thái chia sẻ: `windows`, `usage`, `APPS`, `CHAIN` đều là singleton module-level — đọc/ghi trong cùng hàm. Hiểu rõ trước khi refactor.
- 3 đường lỗi khác status: `429` (limit), `402` (quota), `502` (provider fail) — đều qua `GateError`.
- Toàn bộ state là in-memory; các điểm `ponytail:` chỉ rõ nơi cần thay (Redis/Postgres) khi lên prod.

**Cách tiếp cận đề nghị:** đọc tuần tự theo comment đánh số `// ---- 1.` … `// ---- 6.` trong file — tác giả đã chia sẵn: registry → rate-limit → cost → provider chain → gate → observability.

---

## Khi đã hiểu rồi, thử thách tiếp

- Đổi `generateText` → `streamText` + `toDataStreamResponse`, cộng token ở callback `onFinish` (mục "Cố tình bỏ" trong README).
- Thêm guardrail (PII/moderation) hoặc prompt template dùng chung — chèn trước/sau `handle`.
- Refactor fallback: chỉ fail-over lỗi tạm (5xx/429/timeout), không fallback lỗi input (4xx do caller).
