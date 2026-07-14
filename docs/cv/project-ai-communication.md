# AI Communication — Browser Extension AI Backend

> **Role:** Sole full-stack (extension FE + plugin BE).
> **Stack:** Elysia + Bun · Vercel AI SDK 6 (`@ai-sdk/openai` + `@ai-sdk/google`) · Google Gemini · TypeBox · OpenAPI.
> **Tại sao khớp VNG AIT NHẤT:** Đây **chính xác** prototype "internal AI tool cho team non-engineering" — extension giúp nhân viên soạn/phân tích tin nhắn cross-platform (Slack/Gmail/Google Chat). **Dẫn đầu tiên** khi hỏi "em build internal AI tool chưa."

---

## 1. Bài toán (elevator)

Nhân viên non-tech (CS/marketing/ops) cần soạn/phân tích tin nhắn đa nền tảng (Slack/Gmail/Google Chat) bằng AI — nhưng không muốn copy-paste sang ChatGPT. Giải pháp: **browser extension** chèn AI vào đúng context, gọi **plugin BE** chuyên AI.

> **Câu neo AIT:** *"Đây đúng prototype AIT cần — tool cho team non-engineering, hide complexity phía sau 1 click. Em build cả extension FE lẫn plugin BE."*

---

## 2. Kiến trúc

```
Browser Extension (Slack/Gmail/Google Chat)
   │  content-script inject UI
   ▼
Plugin BE (Elysia + Bun, port 3030)
   │  POST /apis/v1/ai/mediate/prepare
   │  GET  /apis/v1/ai/mediate/options
   ▼
Gemini (via @ai-sdk/google, gemini-3-flash-preview)
   │  prompt-packing 2 bước
   ▼
Prompt pack (structured JSON) → trả về extension
```

**Contract rất mỏng + stateless:** extension gọi 3 REST endpoint, không auth, không session BE-side. Mọi state prompt pack client giữ.

---

## 3. Endpoint surface

| Method | Path | Mục đích |
|---|---|---|
| `GET` | `/apis/v1/ai/mediate/options` | Trả metadata option (role/audience/tone/language) cho UI dropdown |
| `POST` | `/apis/v1/ai/mediate/prepare` | Sinh **prompt pack** từ input user (gọi LLM) |
| `POST` | `/apis/v1/ai/mediate/normalize` | Chuẩn hóa tin nhắn (hiện **mock** — module chưa hoàn thiện) |

**Schema** (TypeBox, không Zod): `aiPrepareRequestDTO` `{task, source, input_text, config.{role,audience,tone,language}}` → response `aiPrepareResponseDTO` `{llm_prompt_pack.{system, instructions, user_input, output_schema}}`.

---

## 4. Prompt engineering — điểm cốt lõi 🔥

### Prompt-packing 2 bước (LLM dùng để XÂY prompt, không viết message)

Đây là thiết kế thú vị — BE không sinh message cuối ngay. Nó sinh **prompt pack** mà bước kế tiếp (FE hoặc endpoint mediate) sẽ dùng để ép LLM output structured.

**Step 1 — System prompt** (`instruction-prepare-prompts.ts`): chèn động `role/audience/tone/language` + yêu cầu "trả JSON thuần túy, không markdown code block".

**Step 2 — User prompt** (`prepare-prompts.ts`): đóng vai "Prompt Pack Builder", serialize payload thành JSON, yêu cầu output schema `{system, instructions[], user_input}`.

**Step 3 (fixed):** `service.ts` ghép thêm `output_schema` cố định `{final_text, summary, actions, risks, questions}` — contract cấu trúc mà bước mediate ép LLM tuân theo.

> **Trade-off ăn điểm:** *"Em dùng LLM làm 'prompt compiler' — sinh prompt pack có system + instructions + output_schema. Extension nhận pack rồi chạy ở context đúng (Slack thread, Gmail draft) thay vì gửi message gốc về BE. Separation of concern + privacy."*

### Ép structured output qua instruction text (KHÔNG dùng `generateObject`)

LLM trả text → `JSON.parse(text)` ở `gemini.ts:31`. Nhấn "no markdown, pure JSON" trong prompt để parse an toàn.

> **⚠️ Trade-off / risk:** Nếu LLM vẫn trả markdown code block → `JSON.parse` nổ. Production nên dùng `generateObject` của AI SDK (Zod schema) hoặc structured output mode. Đây là điểm để nói "em biết tốt hơn nhưng chọn simple path cho PoC."

---

## 5. Multi-provider — TRUNG THỰC về trạng thái

⚠️ **Quan trọng cho phỏng vấn:** Hiện trạng là **single-provider (Gemini)**. `gpt.ts` chỉ là **snippet example chết** (top-level await, không export, không import ở đâu). **KHÔ có fallback logic** thực sự.

- `gemini.ts`: load key `GOOGLE_GENERATIVE_AI_API_KEY` (throw nếu thiếu), `google("gemini-3-flash-preview")`, `generateText` → `JSON.parse`.
- `gpt.ts`: placeholder, chưa wire.

> **Câu đào (phải thành thật):** *"Hiện tại single-provider Gemini. Multi-provider là design intent — `gpt.ts` là scaffold. Nếu được hỏi 'fallback thế nào', em nói rõ: chưa implement, kế hoạch là provider-agnostic interface + retry/circuit breaker + cost routing (model rẻ cho task đơn giản)."*

> **Đừng over-claim** multi-provider/fallback — interviewer soi `gpt.ts` sẽ thấy chết. Nói gap rõ rồi nói kế hoạch implement.

---

## 6. Mediate options — bộ cấu hình UI

"Option" không phải action (compose/rewrite) mà là **config cho prompt** — 4 nhóm, mỗi nhóm có `default` + `options[]`:

| Nhóm | Options |
|---|---|
| `roles` | staff / manager / expert / support |
| `audiences` | internal team / manager (boss) / client / public |
| `tones` | professional / friendly / direct / apologetic / empathetic |
| `languages` | auto-detect / vi / en / ja |

Expose qua `GET /options`. Extension render dropdown → user config → gửi vào `POST /prepare`.

---

## 7. Elysia framework — plugin pattern

### Plugin = Elysia instance độc lập có prefix/name
```ts
const ai = new Elysia({ prefix: '/apis/v1/ai/mediate', name: 'ai-mediate' })
  .post('/prepare', ..., { body: schema, response: {201: schema}, detail: {...} })
app.use(ai).use(base)
```

### Response envelope tập trung
`response.model.ts`: `successResponse<T>` = `{success: true (literal), data, message?, timestamp}`. Error variants: `validationError`, `errorResponse`.

⚠️ **Debt:** `responseTransformPlugin` (auto-wrap qua `onAfterHandle`) **định nghĩa nhưng KHÔNG mount** trong `index.ts`. Wrap hiện tại **thủ công** trong handler (`AIService.success(response)`).

### Error handling tập trung
- `.error(ERROR_MAP)` đăng ký 9 custom error class (400/401/403/404/409/500/503).
- `.onError` → `commonErrorHandler` switch theo `code`.
- Map Elysia internal `VALIDATION` → `{success:false, error:{code:"VALIDATION_ERROR", details:[...]}}`.
- `NOT_FOUND` + default 500 cũng bọc cùng envelope format.

### TypeBox (KHÔNG Zod)
```ts
const aiPrepareRequestDTO = t.Object({ task: t.String(), ... })
type AIModel = typeof aiPrepareRequestDTO.static
```
Elysia suy luận type compile-time trực tiếp từ schema → type-safe E2E không cần Zod.

> **Câu đào:** *"Em chọn TypeBox vì Elysia infer type từ schema runtime → compile-time trong 1 bước. Zod cần thêm bước transform. Cả 2 đều validate runtime, nhưng TypeBox tích hợp sâu hơn với Elysia."*

---

## 8. Bun runtime & logixlysia

- **Bun:** `bun run --watch src/index.ts`, dùng `Bun.file().json()` native I/O cho JSON DB demo (không cần `fs`).
- **logixlysia** (`^6.1.0`): plugin logging, startup banner, log IP, ghi `./logs/app.log`, **log rotation** (maxSize 10m, interval 1d, keep 7d, compress), custom format.

> **Câu neo:** *"Bun cho startup nhanh + native file I/O. Elysia sinh ra cho Bun nên tận dụng tốc độ HTTP + type inference compile-time. Logixlysia cho structured logging + rotation."*

---

## 9. Tích hợp extension

- **CORS allow-all** (`.use(cors())` mặc định) — cần thiết vì content-script chạy origin Slack/Gmail/Google Chat phải gọi thẳng BE.
- **Không auth** BE-side (no JWT, no API key) — bảo vệ nghi ngờ nằm ở extension FE hoặc gateway app cha.
- **Không streaming** — synchronous request/response qua envelope, phù hợp extension gọi REST 1 lần.

> **⚠️ Gap rõ cho phỏng vấn:** *"BE hiện CORS allow-all + 0 auth — chấp nhận được cho PoC/extension nội bộ, nhưng production cần: (1) API key/extension-id verification, (2) rate limit per user, (3) CORS whitelist domain extension, không allow-all."*

---

## 10. OpenAPI (@elysiajs/openapi)

Mount `/docs`, tự sinh spec từ TypeBox schema khai báo ở mỗi route (`body`/`response`/`detail`). Route `/prepare` khai báo `detail.responses.201.content...schema` để Swagger render đúng envelope.

> **Demo ăn điểm:** *"Em có OpenAPI live ở `/docs` — Swagger render đúng envelope schema. Extension team consume trực tiếp doc, không cần Postman separate."*

---

## 11. Câu hỏi đào sâu 🔥

### Q: "Sao prompt-packing 2 bước thay vì generate message luôn?"
> *"Separation of concern + privacy. BE chỉ thấy metadata (task/role/tone), không thấy message gốc của user. Prompt pack chạy ở context đúng (Slack thread) phía FE. Cũng cho phép cache prompt pack theo config."*

### Q: "Multi-provider fallback em làm sao?"
> *(Thành thật)* *"Hiện chưa — single Gemini. Kế hoạch: provider-agnostic interface (`AIProvider.generate()`), retry chain Gemini→OpenAI, circuit breaker khi 1 provider rate-limit, cost routing (model rẻ cho task đơn giản). Đây là debt em biết."*

### Q: "Vì sao JSON.parse thay vì structured output mode?"
> *"PoC ưu tiên tốc độ. Production em sẽ dùng `generateObject` của AI SDK với Zod schema — parse-safe, retry khi schema lệch. `JSON.parse` instruction-text có risk markdown leak."*

### Q: "CORS allow-all nguy hiểm không?"
> *"Cho PoC/extension nội bộ thì OK. Production: whitelist domain extension (`chrome-extension://<id>`), API key header, rate limit per key. Extension ID stable khi published."*

### Q: "Vì sao Elysia + Bun không Express + Node?"
> *"Elysia type-safe E2E (TypeBox inference), Bun startup nhanh + native API. Cho plugin nhỏ AI, overhead thấp. Node/Express nếu cần ecosystem rộng hơn — trade-off."*

### Q: "`normalize` trả mock — sao?"
> *"Module chưa hoàn thiện. Kiến trúc `prepare → mediate → normalize` là design full, hiện `prepare` xong, `mediate`/`normalize` dang dở. Em nói rõ scope đã ship vs planned."*

### Q: "Extension sandbox security?"
> *"Content-script chạy sandboxed, CSP của trang host (Slack/Gmail) áp dụng. BE không auth nên nếu leak endpoint → abuse. Mitigation: API key, rate limit, extension-id verification."*

---

## 12. Gap / debt (trung thực)

- **Single-provider thực tế** — `gpt.ts` placeholder chết.
- **`normalize` mock** — module chưa ship.
- **CORS allow-all + 0 auth** — production risk.
- **`responseTransformPlugin` không mount** — duplicate envelope logic thủ công.
- **`JSON.parse` thay vì structured output** — risk markdown leak.
- **Không streaming** — extension nhận JSON nguyên khối (có thể cần cho UX "typing effect").

---

## 13. Metric & impact (neo AIT DNA)

- **Tool cho non-tech user** — đúng chữ JD "embed với team non-engineering, map workflow, ship tới adoption."
- **1-click UX** — content-script inject, không copy-paste.
- **Privacy-first** — message gốc không gửi về BE, chỉ prompt pack.

---

> **Câu chốt VNG:** *"AI Communication đúng DNA AIT — internal tool cho team non-engineering, hide AI complexity sau 1 click. Em build plugin BE với prompt-packing 2 bước (LLM làm prompt compiler) và extension FE chèn vào đúng context Slack/Gmail. Em thành thật về gap: single-provider, chưa auth, normalize mock — và nói được kế hoạch production hóa."*
