# 🔌 06 — Streaming & Tích hợp Multi-Provider

> Đây là phần **rất hay bị đào ở role AI-Native** (ví dụ VNGGames AIT nhấn thẳng vào *"streaming responses"* và *"LLM integration Anthropic/OpenAI/Google"*). Khác các chương trước (thiên khái niệm), chương này thiên **cơ chế tích hợp production** — cái tách "người từng gọi API" khỏi "người từng ship". Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. Streaming hoạt động thế nào (SSE)? 🔥

**Định nghĩa ngắn:** Thay vì chờ model sinh xong cả câu rồi trả một lần, **streaming** đẩy **từng token ngay khi sinh** qua **SSE** (Server-Sent Events, `Content-Type: text/event-stream`). FE render dần → người dùng thấy chữ chạy sau ~1s thay vì chờ 10s.

**Giải thích sâu:**

- SSE là **một chiều** server→client, chạy trên HTTP thường, mỗi message là một dòng `data: ...` kết thúc bằng `\n\n`. Nhẹ hơn WebSocket và **đúng bài** cho luồng token LLM (chỉ cần một chiều).
- Cú pháp theo provider (nên thuộc để trả lời "anh tích hợp cả 3 provider chưa"):
  - **OpenAI:** đặt `stream: true` → nhận các chunk `data: {...}`, kết thúc bằng `data: [DONE]`.
  - **Anthropic (Messages API):** `stream: true` → **event có type**: `message_start`, `content_block_delta`, `message_stop`.
  - **Gemini:** gọi `streamGenerateContent` → trả mảng chunk.
- **Streaming không giảm tổng thời gian sinh**, nhưng giảm mạnh **time-to-first-token** → cải thiện *cảm nhận* độ trễ. Gần như luôn nên bật cho UI chat.

**Bẫy thường gặp:**

- Nhầm SSE với WebSocket. LLM stream chỉ cần một chiều → SSE gọn hơn; WebSocket dùng khi cần hai chiều (ví dụ live trades, collab).
- **Câu hỏi nối tiếp:** *"Vì sao không dùng WebSocket cho mọi thứ?"* → WebSocket nặng hơn (handshake, giữ kết nối hai chiều, cần room/reconnect logic); một chiều thì SSE đủ và đơn giản hơn.

---

## 2. Vercel AI SDK — lớp trừu tượng streaming 🔥

**Định nghĩa ngắn:** Vercel AI SDK gói phần streaming rối rắm của từng provider vào một API thống nhất: `streamText()` trả về **async iterable** để FE tiêu thụ token dần.

**Giải thích sâu:**

- `streamText()` cho `result.textStream` (chỉ text) hoặc `result.fullStream` (cả tool-call, metadata). FE `for await (const chunk of stream)` render dần.
- `streamObject()` cho **structured output streaming** — nhận JSON dần theo schema Zod.
- Chạy được trên **edge runtime** (latency thấp, gần user). `StreamData` để kèm metadata (nguồn trích dẫn, token count) cùng luồng.
- Lợi ích lớn nhất: **đổi provider = đổi một dòng** (`@ai-sdk/openai` → `@ai-sdk/google`), phần code stream/tool giữ nguyên.

**Bẫy thường gặp:**

- Tự parse SSE thủ công khi SDK đã lo hết → tốn công và dễ lỗi biên. Chỉ tự parse khi có lý do thật (provider SDK không hỗ trợ).
- **Câu hỏi nối tiếp:** *"SDK che provider thì mất gì?"* → mất truy cập một số tính năng riêng của provider (ví dụ prompt caching Anthropic, một số param Gemini); khi cần thì dùng `providerOptions` hoặc gọi SDK gốc.

---

## 3. Cạm bẫy streaming ở production 🔥

**Định nghĩa ngắn:** Bật streaming lên thì dễ; **làm nó bền ở production** mới là chỗ bị đào. Có 5 cạm bẫy kinh điển.

**Giải thích sâu:**

1. **Parse SSE đúng:** một chunk có thể tới **cắt ngang** (partial). Phải **buffer** tới khi đủ ranh giới `\n\n` mới parse, không parse từng mảnh thô.
2. **Abort/cancel:** user rời trang giữa chừng → phải hủy request (`AbortController`) để **không đốt token** tiếp và giải phóng kết nối. FE cleanup khi unmount.
3. **Tool-call trong stream:** khi model gọi tool giữa luồng, **đối số (arguments) tới từng delta** — phải **tích luỹ** đủ rồi mới execute, không execute trên mảnh dở.
4. **Lỗi giữa luồng (error mid-stream):** đang stream mà model/mạng lỗi → gửi **event error rõ ràng** cho FE, **không để kết nối treo** (client chờ vô hạn).
5. **Backpressure:** client tiêu thụ chậm hơn tốc độ đẩy → cần xử lý luồng đúng (SDK/stream API lo phần lớn, nhưng phải ý thức).

**Bẫy thường gặp:**

- Quên `AbortController` → user spam gửi/hủy làm server chạy hàng loạt generation "mồ côi", đốt tiền.
- **Câu hỏi nối tiếp:** *"Tool-call trong lúc stream xử lý sao?"* → accumulate delta argument tới khi event `tool-call` hoàn tất → validate (Zod) → execute → feed kết quả lại → tiếp tục stream câu trả lời.

---

## 4. Multi-provider — chọn provider theo task 🔥

**Định nghĩa ngắn:** OpenAI / Anthropic / Google không "cái nào tốt nhất" mà **mạnh khác nhau**. Senior = biết chọn theo **task và ràng buộc**, không trung thành một hãng.

**Giải thích sâu:**

| Provider | Mạnh ở | Hay dùng cho |
|---|---|---|
| **OpenAI** | reasoning, structured output, hệ sinh thái tool | task suy luận, JSON mode, function calling phức tạp |
| **Anthropic** | context dài, **prompt caching**, giọng an toàn | tài liệu dài, agent nhiều bước, nội dung nhạy cảm |
| **Google (Gemini)** | multimodal, hệ sinh thái Google, **giá tốt** | ảnh/âm thanh, khối lượng lớn cần rẻ |

- Lớp **abstraction** (Vercel AI SDK) giúp việc "chọn theo task" khả thi: routing request tới provider phù hợp mà không rải logic provider khắp code.
- Nói được ví dụ thật ăn điểm hơn lý thuyết: *"Em dùng OpenAI + Gemini, chọn theo task — Gemini cho multimodal/giá, OpenAI cho structured reasoning."*

**Bẫy thường gặp:**

- Trả lời "OpenAI mạnh nhất, cứ OpenAI" → mất điểm; senior nêu **trade-off**, không tuyệt đối hóa.
- **Câu hỏi nối tiếp:** *"Đổi provider tốn gì?"* → nếu có abstraction thì rẻ; nhưng khác biệt về **tokenizer, format tool-call, tính năng riêng** vẫn cần eval lại chất lượng sau khi đổi.

---

## 5. Fallback chain — chống LLM fail/rate-limit/đắt 🔥

**Định nghĩa ngắn:** **Fallback chain** = provider chính lỗi/timeout/hết quota thì **tự động chuyển** sang provider dự phòng, để dịch vụ không sập theo một nhà cung cấp.

**Giải thích sâu:**

- Mẫu điển hình (câu chuyện thật đáng kể trong phỏng vấn): **Gemini primary → Groq fallback** khi rate-limit/timeout. Pattern: `try primary → catch → try fallback → log`.
- Fallback nên kèm: **timeout hợp lý** (không chờ vô hạn provider chính), **log** để biết tần suất fallback (tín hiệu provider chính có vấn đề), và **cân nhắc chất lượng** — model fallback có thể yếu hơn, cần chấp nhận đánh đổi tạm thời.
- Đây cũng là câu trả lời tốt cho *"xử lý thế nào khi LLM fail hoặc đắt?"* — kết hợp fallback (độ tin cậy) + model routing rẻ→đắt (chi phí, xem [file 05](./05-evaluation-guardrails-production.md)).

**Bẫy thường gặp:**

- Fallback im lặng, không log → provider chính hỏng cả ngày mà không ai biết, chỉ thấy "chất lượng tự nhiên tệ đi".
- **Câu hỏi nối tiếp:** *"Fallback có ảnh hưởng tính nhất quán không?"* → Có; hai model trả giọng/format khác nhau. Nếu cần đồng nhất, ràng buộc bằng structured output + system prompt chung cho cả hai.

---

## 6. LLM Gateway — nền tảng AI dùng chung 🔥

**Định nghĩa ngắn:** Khi nhiều app trong công ty đều gọi LLM, thay vì mỗi app tự tích hợp, ta dựng một **LLM Gateway** — lớp trung gian **thống nhất** việc gọi model cho toàn tổ chức. Đây chính là "shared AI solution" mà các team kiểu AIT theo đuổi.

**Giải thích sâu:**

- Một LLM Gateway gánh các mối lo **ngang** (cross-cutting) để app không phải lặp lại:
  - **Abstraction đa provider** + **fallback chain** (mục 4–5).
  - **Rate limit & quota per team/app**, chống một app đốt hết ngân sách.
  - **Cost tracking** (token in/out theo app) + **dashboard**.
  - **Observability**: log/trace mỗi request (prompt, output, token, latency).
  - **Guardrail chung**: lọc PII, chặn nội dung độc, kiểm định output (xem [file 05](./05-evaluation-guardrails-production.md)).
  - **Quản lý secret** API key tập trung; **prompt template / version** dùng chung.
- Nâng lên tầm **platform toàn công ty**: multi-tenant, **RBAC**, model catalog, usage quota, audit log — đúng tầm nhìn "AI-Native organization".

**Bẫy thường gặp:**

- Dựng gateway quá sớm cho **một** app → over-engineer. Gateway đáng làm khi có **nhiều** app dùng chung; một app thì gọi SDK trực tiếp là đủ (nguyên tắc: đơn giản nhất mà chạy được).
- **Câu hỏi nối tiếp:** *"Gateway thành single point of failure thì sao?"* → phải HA (nhiều instance, health check), timeout/fallback, và **không** để gateway thêm latency đáng kể (mỏng, cache, gần app).

> **Câu chốt phỏng vấn:** "Streaming, multi-provider, fallback và một LLM gateway mỏng là bốn thứ em coi là 'production-ready' khi tích hợp LLM: người dùng thấy phản hồi ngay, hệ không phụ thuộc một nhà cung cấp, và toàn công ty có một điểm để đo cost/chất lượng và áp guardrail."
