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

**Ví dụ — client tiêu thụ stream đúng cách (bẫy 2 & 4):**

```tsx
function useChatStream() {
  const controllerRef = useRef<AbortController | null>(null);

  async function send(prompt: string, onToken: (t: string) => void) {
    controllerRef.current?.abort();            // hủy request cũ nếu còn chạy
    const controller = new AbortController();
    controllerRef.current = controller;

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal: controller.signal,               // (2) abort/cancel
    });
    if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onToken(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') throw err; // (4) chỉ lỗi thật mới ném
    }
  }

  // (2) cleanup khi unmount → không để generation "mồ côi" đốt token
  useEffect(() => () => controllerRef.current?.abort(), []);
  return { send };
}
```

**Ví dụ — tự parse SSE khi buộc phải (bẫy 1: chunk mạng cắt ngang):**

```ts
// Chunk từ mạng có thể tới GIỮA một event → không parse thô, phải buffer
let buffer = '';
function feed(chunk: string, onEvent: (data: string) => void) {
  buffer += chunk;
  const parts = buffer.split('\n\n'); // các event ngăn nhau bằng dòng trống
  buffer = parts.pop() ?? '';         // phần cuối có thể chưa đủ → giữ lại chờ chunk sau
  for (const part of parts) {
    const line = part.split('\n').find((l) => l.startsWith('data: '));
    if (line) onEvent(line.slice(6)); // bỏ 6 ký tự 'data: '
  }
}

// demo: chunk tới cắt ngang "data: hel" | "lo\n\n" → vẫn ghép đúng "hello"
// feed('data: hel', console.log);      // (chưa in gì — event chưa đủ)
// feed('lo\n\ndata: world\n\n', ...);  // → in "hello" rồi "world"
```

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

> 📦 **Ví dụ chạy được:** [`examples/llm-gateway`](https://github.com/DannyHo15/interview-docs/tree/main/examples/llm-gateway) — gateway Elysia + Vercel AI SDK ~150 dòng minh hoạ đủ auth per-app, rate-limit/quota, fallback Gemini→GPT, cost tracking và `/metrics`. Bảng map từng mối lo → dòng code nằm trong README.

**Bẫy thường gặp:**

- Dựng gateway quá sớm cho **một** app → over-engineer. Gateway đáng làm khi có **nhiều** app dùng chung; một app thì gọi SDK trực tiếp là đủ (nguyên tắc: đơn giản nhất mà chạy được).
- **Câu hỏi nối tiếp:** *"Gateway thành single point of failure thì sao?"* → phải HA (nhiều instance, health check), timeout/fallback, và **không** để gateway thêm latency đáng kể (mỏng, cache, gần app).

---

## 7. Case thực tế — render stream text trên Frontend cho tối ưu 🔥

**Định nghĩa ngắn:** Mục 1–6 lo *server đẩy token*; mục này lo *FE nhận và vẽ token*. Bài toán FE: token về **rất dày** (hàng chục–trăm chunk/giây), nếu mỗi token trigger một lần **re-render + re-parse markdown** thì UI **giật/đơ**, quạt CPU kêu, cuộn nhảy loạn. Tối ưu = vẽ *cảm giác mượt* mà không vẽ *mọi token*.

**Giải thích sâu (các đòn tối ưu, từ ăn tiền nhất → phụ):**

1. **Batch token theo frame (rAF), đừng setState mỗi token.** Gom token vào một `buffer` ngoài React, mỗi `requestAnimationFrame` mới flush một lần vào state. Màn hình chỉ 60fps → vẽ hơn 60 lần/giây là phí. Đây là đòn giảm re-render mạnh nhất.

   ```tsx
   function useStreamedText(stream: AsyncIterable<string>) {
     const [text, setText] = useState("");
     useEffect(() => {
       let buffer = "";
       let raf = 0;
       const flush = () => { setText(buffer); raf = 0; };
       (async () => {
         for await (const chunk of stream) {
           buffer += chunk;
           // ponytail: gộp mọi token trong 1 frame; không cần throttle lib
           if (!raf) raf = requestAnimationFrame(flush);
         }
         flush(); // đảm bảo vẽ nốt phần cuối
       })();
       return () => raf && cancelAnimationFrame(raf);
     }, [stream]);
     return text;
   }
   ```

2. **Đọc SSE thành `AsyncIterable` để feed cho hook trên.** Đây là mảnh nối server↔hook: đọc `response.body` (ReadableStream), decode, **buffer tới ranh giới `\n\n`** rồi mới yield từng chunk (nối lại mục 3.1 — chunk có thể tới cắt ngang).

   ```tsx
   async function* readSSE(res: Response, signal: AbortSignal) {
     const reader = res.body!.getReader();
     const decoder = new TextDecoder();
     let buffer = "";
     while (true) {
       if (signal.aborted) { await reader.cancel(); return; }
       const { done, value } = await reader.read();
       if (done) break;
       buffer += decoder.decode(value, { stream: true });
       // chỉ cắt khi đủ ranh giới; phần dở giữ lại chờ chunk sau
       const parts = buffer.split("\n\n");
       buffer = parts.pop() ?? "";
       for (const part of parts) {
         const line = part.replace(/^data: /, "");
         if (line === "[DONE]") return;
         yield JSON.parse(line).delta as string; // tuỳ format provider
       }
     }
   }
   ```

3. **Đừng parse lại markdown cả bài mỗi lần.** Markdown→HTML tốn CPU và **tăng tuyến tính theo độ dài** — càng về cuối càng chậm (O(n) mỗi lần × n lần = O(n²)). Cách xử lý: tách bài thành block, các block đã “đóng” (có ranh giới `\n\n` phía sau) **memo hóa** không parse lại, chỉ block cuối đang chảy mới parse mỗi frame.

   ```tsx
   import { memo } from "react";
   import ReactMarkdown from "react-markdown";

   // block đã đóng: chỉ re-render khi source đổi (gần như không bao giờ) → parse 1 lần
   const Block = memo(({ md }: { md: string }) => <ReactMarkdown>{md}</ReactMarkdown>);

   function StreamedMarkdown({ text }: { text: string }) {
     const blocks = text.split("\n\n");
     return (
       <>
         {blocks.map((md, i) => (
           <Block key={i} md={md} /> // block cuối đổi mỗi frame, các block trên hit memo
         ))}
       </>
     );
   }
   ```

4. **Auto-scroll “dính đáy” đúng cách.** Chỉ tự cuộn xuống khi user *đang ở đáy*; nếu user cuộn lên đọc lại thì **không** giật họ xuống.

   ```tsx
   function useStickToBottom(ref: RefObject<HTMLElement>, dep: unknown) {
     const stick = useRef(true);
     useEffect(() => {
       const el = ref.current;
       if (!el) return;
       const onScroll = () => {
         stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
       };
       el.addEventListener("scroll", onScroll);
       return () => el.removeEventListener("scroll", onScroll);
     }, [ref]);
     useEffect(() => {
       if (stick.current) ref.current?.scrollTo({ top: ref.current.scrollHeight });
     }, [dep, ref]); // dep = text; chạy lại mỗi lần text đổi
   }
   ```

5. **Không giữ mảng token trong state.** Nối vào **một string tích luỹ** (như `buffer` ở đòn 1), không `setTokens([...tokens, t])` (mỗi lần copy cả mảng → O(n²) bộ nhớ + render). Text là append-only, string là đủ.

6. **Cleanup + abort khi unmount** (nối tiếp mục 3.2): rời trang/gửi câu mới → `AbortController.abort()` + `cancelAnimationFrame`, tránh setState trên component đã gỡ và tránh đốt token. Ráp cả cụm lại:

   ```tsx
   function ChatAnswer({ prompt }: { prompt: string }) {
     const [stream, setStream] = useState<AsyncIterable<string> | null>(null);
     const boxRef = useRef<HTMLDivElement>(null);
     useEffect(() => {
       const ctrl = new AbortController();
       fetch("/api/chat", {
         method: "POST",
         body: JSON.stringify({ prompt }),
         signal: ctrl.signal,
       }).then((res) => setStream(readSSE(res, ctrl.signal)));
       return () => ctrl.abort(); // unmount/prompt đổi → hủy request + reader
     }, [prompt]);

     const text = useStreamedText(stream);      // đòn 1: batch theo rAF
     useStickToBottom(boxRef, text);            // đòn 4
     return (
       <div ref={boxRef} style={{ overflowY: "auto" }}>
         <StreamedMarkdown text={text} />       {/* đòn 3: memo block đã đóng */}
       </div>
     );
   }
   ```

   > `useStreamedText` cần nhận `stream` nullable — thêm `if (!stream) return;` ở đầu `useEffect` của nó.

7. **Hiệu ứng “gõ chữ” (typewriter) là tùy chọn, không bắt buộc.** Nếu muốn mượt hơn tốc độ token thật, đệm token vào queue rồi nhả đều theo interval — nhưng cân nhắc: nó **thêm độ trễ cảm nhận**. Thường token tự nhiên đã đủ mượt, đừng thêm phức tạp khi chưa cần.

**Bẫy thường gặp:**

- `setText(prev => prev + chunk)` **mỗi token** trong `for await` → mỗi chunk một re-render, list dài là tụt frame ngay. Phải batch (đòn 1).
- Re-parse toàn bộ markdown mỗi frame trên câu trả lời dài → về cuối stream thấy **chậm dần đều**, dấu hiệu kinh điển của O(n²) parse.
- Auto-scroll vô điều kiện → user không đọc lại được đoạn trên vì bị kéo xuống liên tục.
- **Câu hỏi nối tiếp:** *"Nếu dùng Vercel AI SDK thì còn phải tự lo mấy cái này không?"* → `useChat`/`useCompletion` đã lo batching, abort, accumulate string cho bạn; phần **còn phải tự làm** thường là *auto-scroll dính đáy* và *tối ưu render markdown* (memo block đã đóng) — hai thứ SDK không quyết hộ vì thuộc về UI.

---

> **Câu chốt phỏng vấn:** "Streaming, multi-provider, fallback và một LLM gateway mỏng là bốn thứ em coi là 'production-ready' khi tích hợp LLM: người dùng thấy phản hồi ngay, hệ không phụ thuộc một nhà cung cấp, và toàn công ty có một điểm để đo cost/chất lượng và áp guardrail. Về phía FE, em batch token theo animation frame và chỉ re-parse block markdown cuối để giữ UI mượt kể cả câu trả lời dài."
