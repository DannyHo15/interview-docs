# Chuẩn bị phỏng vấn — VNGGames · Fullstack Developer (team AIT)

## Job code `26-AIT-3829` · HCMC · Official Tech, Software · AI-Native product engineering

> **JD gốc đã verify** (career.vng.com.vn, lấy trực tiếp). Không còn speculate.
>
> **Bản chất role (sửa lại cho chính xác):** Đây KHÔNG phải "dev build AI tool" đơn thuần. Đây là **product-engineer high-ownership**: bạn **embed với team non-tech** (ops/CS/marketing/finance/HR/game studios) → **map workflow** → **qualify use case** → **thiết kế end-to-end UX** → **build (React+TS FE, Python BE, integrations)** → **deploy** → **drive adoption** (onboard user, feedback loop, iterate tới khi team tự dùng không cần bạn) → **own quality + observability** → **productize** (feed component/SDK/pattern về shared AIT codebase). Một project **chỉ done khi team dùng nó không cần bạn**, không phải khi deploy xong.
>
> **AIT stack bạn sẽ build on top of:** AI Portal, Agent Platform, **AI Model Gateway**, Hosting Platform, **MCP servers**, RAG services, LLM APIs, agent endpoints (do AI Engineering team xây; bạn consume + feed lại product surfaces/SDK).
>
> **⚠️ Sửa lỗi quan trọng:** Python **là MUST-HAVE** (production Python backend — FastAPI/Flask/Django, async/await, background jobs). Không phải nice-to-have như mình guess ban đầu. Đây là **gap thật cần mitigate mạnh** (mục 8).

---

## 0. Mindset & chiến thuật chung

**Fact ăn mạnh nhất của bạn:** Bạn đã ship **5+ sản phẩm AI production** chéo use-case — đa số **sole engineer end-to-end đến K8s**. Bạn cũng **dùng AI tools làm default workflow** (Claude Code, Cursor, Codex, Copilot; author CLAUDE.md/AGENTS.md; MCP server integration; subagent delegation) — **đúng câu JD ghi**: *"Use AI tools as your default workflow... Ship with AI assistance (Claude Code, Cursor, Codex) as a daily habit, not a novelty."* Đây là **rất hiếm** ở candidate VN — **dẫn thẳng**.

**3 nguyên tắc khi trả lời:**
1. **Neo về sản phẩm thật**, không lý thuyết. "Ở Avatar48 em làm thế này…"
2. **Trade-off thật thà.** Senior = biết giá mỗi lựa chọn.
3. **Nói ngôn ngữ JD + thể hiện product-mindset**: không chỉ "em code được", mà "em **đã ship product tới khi user dùng thật, đo business metric**" (8s→1s, 24 vulnerability, leaderboard adoption).

**Năng lượng:** Role này chọn người **high-ownership + comfortable with ambiguity + product-driven**, không phải code-monkey. Mang năng lượng *"em đã từng embed với user, map workflow, ship tới adoption"* — đó là DNA role.

---

## 1. Elevator pitch (luyện thuộc — đã sửa cho đúng role)

> "Em là full-stack software engineer 4 năm, **TypeScript-strong across FE** (React/Next.js) **và Python ở backend** (Django, đang ramp FastAPI). Điểm mạnh rõ nhất: **ship ứng dụng AI vào production tới khi user dùng thật**. Gần 1 năm ở Metagrit em sole-engineered 3 sản phẩm: AI agent launchpad on Solana (Avatar48), real-time NLP monitoring cho Google Meet (InspectAI), và **AI browser extension cho Slack/Gmail/Google Chat** — đúng kiểu internal tool cho team non-engineering. Trước đó em build enterprise dashboard 25+ module và low-code platform microservices. Em quen **Clean Architecture, DDD, CQRS, K8s deploy, OpenTelemetry**. Và quan trọng — em **dùng Claude Code/Cursor làm workflow hằng ngày**, có author CLAUDE.md/MCP server/subagent orchestration. Role AIT đúng việc em đã làm: build AI tooling tới adoption, nên em rất hứng thú."

**3 biến thể ngắn:**
- **15s:** "Full-stack 4 năm, React/TS + Python, mạnh nhất ship production AI apps tới adoption — 5 sản phẩm, đa số sole end-to-end lên K8s. Dùng Claude Code/Cursor làm default workflow."
- **Product-mindset neo:** "Em đã làm đúng kiểu AIT cần: embed với use-case, map workflow, ship product AI tới khi team dùng thật."
- **AI-native neo:** "Em là AI-augmented dev hằng ngày — Claude Code, MCP, subagent orchestration — đúng chữ 'default workflow, not novelty' JD ghi."

---

## 2. Match map — profile → JD (đã verify theo JD gốc)

| Yêu cầu JD | Loại | Bằng chứng bạn | Project dẫn |
|---|---|---|---|
| **3+ năm fullstack, ship end-to-end tới adoption** | Must | 4 năm; product tới user thật (8s→1s, leaderboard, EMR dùng multi-clinic) | NNG, Avatar48, LoLamBenhAn |
| **React + TypeScript production** (hooks, state, suspense, accessible, Vite/Next.js) | Must | Next.js 15, React, Angular, React Native; accessible UI (Ant Design Pro, shadcn) | Avatar48 DApp, EVN GENCO3 |
| **Python backend production** (FastAPI/Flask/Django, async, background jobs) | **Must — GAP** | Django trong skills; **chưa có Python production lớn** → mitigate (mục 8) | (FastAPI demo planned) |
| **API & integration design** (HTTP/JSON, OAuth/JWT/API keys, webhooks, queues) | Must | NestJS API design, OAuth (LoLamBenhAn Google OAuth), JWT, QuickNode webhooks, RabbitMQ/BullMQ | Avatar48, GenCodify |
| **Databases** (1 relational + 1 NoSQL) | Must | PostgreSQL/MySQL + Redis/MongoDB/DynamoDB | All |
| **Deployment & ops** (Docker, CI/CD, cloud, logging, debug deployed) | Must | Docker, GitLab CI, AWS, K8s, OpenTelemetry | InspectAI, GenCodify |
| **AI fluency** (dùng Claude/ChatGPT/Codex/Gemini hằng ngày, ship với AI-assisted workflow) | Must | **Claude Code/Cursor/Codex/Copilot default workflow; CLAUDE.md/AGENTS.md author; MCP integration; subagent** | repo ai-job-search, Metagrit |
| **DSA** | Must | SE 4 năm, nền tảng OK (warm-up mục 9) | — |
| **Working style** (proactive, high-ownership, ambiguity) | Must | Sole-engineered 3 sản phẩm; led team 4 | Metagrit, NNG |
| **LLM API integration** (streaming, tool calling, structured output, failure modes) | Nice | **5 sản phẩm**; Vercel AI SDK streaming; tool calling; Groq fallback (failure mode) | InspectAI, AI Communication, LoLamBenhAn |
| **Chat UI / agent control panel / AI-native surfaces** | Nice | Avatar48 trading UI + agent flows; Angular CMS (operator console) | Avatar48 |
| **Design systems** (shadcn/ui, Radix, Ant Design, MUI) | Nice | **shadcn/ui + Ant Design** chính là stack em dùng | TypingAstro, EVN GENCO3 |
| **Observability** (OpenTelemetry, Datadog, Sentry, Langfuse, LangSmith) | Nice | **OpenTelemetry (Avatar48) + Sentry (TypingAstro)**; nói được Langfuse/LangSmith (LLM eval) | Avatar48, TypingAstro |
| **Làm việc với non-tech user** (workflow mapping, scope) | Nice | AI Communication (Slack/Gmail/Chat), InspectAI (meeting NLP) cho non-engineer | AI Communication, InspectAI |
| **Internal tools / admin panels / operator consoles** | Nice | Angular CMS (Avatar48), EVN dashboard 25+ module, review queues | EVN GENCO3, Avatar48 |
| **Consume MCP servers / AI Gateway / RAG services** | (AIT stack) | **MCP server integration** (CV skills) + RAG (GenCodify vector DB) | GenCodify, repo |
| **Productize** (reusable component/SDK/pattern về shared codebase) | (culture) | Nx/Turborepo monorepo shared packages; CLAUDE.md template | GenCodify, LoLamBenhAn |
| **Game industry / live-ops** | Nice — GAP | ❌ Không có → reframe (mục 8) | — |
| **Enablement workshop / tech writing / presenting** | Nice | Portfolio (danny.io.vn), i18n docs, README/skill authoring | — |

**Tổng verdict:** Match **~80%**. Mọi Must-have trúng trừ **Python production** (gap thật, mitigate được). Nice-to-have trúng phần lớn. DNA role (product + AI-augmented + adoption) **over-fit**.

---

## 3. Bảo vệ từng project (deep-dive — phần cốt lõi)

Cho mỗi project: **bài toán → làm gì → tại sao → trade-off → business metric.** Phần họ đào sâu.

### 3.1 AI Communication — Browser extension AI cho Slack/Gmail/Google Chat *(KHỚP AIT NHẤT)*
- **Bài toán:** Giúp nhân viên soạn/phân tích tin nhắn cross-platform bằng AI.
- **Làm gì (sole full-stack):** React+Vite+Tailwind extension; **Elysia/Bun backend**; **Vercel AI SDK** + **OpenAI + Gemini** cho compose/analyze.
- **Tại sao khớp AIT:** Đây **chính xác** prototype "internal AI tool cho team non-engineering dùng hằng ngày" — đúng DNA AIT. **Dẫn đầu tiên** khi hỏi "em build internal AI tool chưa."
- **Trade-off/sâu:** multi-provider (fallback + cost); extension sandbox security; Bun vs Node.
- **Adoption angle (JD câu "done when team uses it without you"):** nói cách em nghĩ UX sao cho non-tech user chạy được 1 click.

### 3.2 InspectAI — Real-time meeting language monitoring (Google Meet)
- **Bài toán:** Giám sát ngôn ngữ real-time trong Google Meet (compliance/safety NLP).
- **Làm gì (sole + DevOps):** **NestJS 11 + TypeORM + Redis + BullMQ**; **Gemini + Google Cloud Natural Language** NLP; **Next.js 15 + Socket.IO** add-on UI; **K8s custom manifests**.
- **Tại sao ăn điểm:** (a) AI production; (b) **real-time streaming** (audio stream → NLP pipeline); (c) **sole + DevOps** owns end-to-end; (d) **LLM + classical NLP kết hợp** — biết chọn model theo task; (e) **OpenTelemetry** (JD nice-to-have observability).
- **Trade-off/sâu:** low-latency pipeline; BullMQ cho NLP heavy không block socket; K8s manifest tự viết.
- **Câu "bug khó nhất":** chuẩn bị 1 (audio stream chunk vs NLP ordering race, hoặc K8s rollout debug).

### 3.3 Avatar48 — AI Agent token launchpad on Solana
- **Bài toán:** Platform tạo/launch AI agent token + trade + leaderboard.
- **Làm gì (full-stack):** **NestJS + CQRS 38+ module**; Solana Web3 (Metaplex/Raydium) + Uniswap SOR; **QuickNode webhook → BullMQ → Socket.IO** live trades; **OpenTelemetry**. FE: Next.js 15 (Privy, TradingView custom datafeed, OKX DEX, React Query+Zustand) + **Angular CMS** (operator console) + landing 4 locale.
- **Tại sao ăn điểm:** (a) **AI agent** = LLM + tool calling + action routing (đúng JD nice-to-have "agent control panel"); (b) event-driven (CQRS+BullMQ+webhook); (c) streaming; (d) **observability**; (e) Angular CMS = "operator console" (JD keyword).
- **Trade-off/sâu:** CQRS complexity; webhook idempotency; TradingView datafeed perf; i18n 4 locale.
- **Đừng để distract bởi blockchain** — gắt lại về AI agent + architecture. "On-chain chỉ là transport."

### 3.4 GenCodify Studio — Low-code website builder (microservices)
- **Làm gì:** NestJS microservices (Gateway + **7 service**); RabbitMQ; **Nx Module Federation** micro-frontend; **CraftJS + Yjs CRDT + Hocuspocus** collab; **AI microservice Gemini/OpenAI + vector DB**; publisher (S3+CDN); **K8s Rancher 3 namespace**.
- **Tại sao ăn điểm:** (a) **AI microservice tách riêng** = đúng pattern "shared AI solution" AIT; (b) **vector DB / RAG** (JD mention RAG services); (c) system design sâu (microservices + micro-frontend + CRDT); (d) **productize** pattern (shared packages).
- **Trade-off/sâu:** tách AI service riêng vs monolith; CRDT vs OT; Module Federation versioning.

### 3.5 LoLamBenhAn — EMR platform (DDD + AI)
- **Làm gì:** Turborepo monorepo; **Elysia/Bun + DDD**; dynamic form builder (RHF+Zod); WebSocket collab; **Gemini AI form-filling + Groq fallback**.
- **Tại sao ăn điểm:** (a) **DDD** (JD "clean testable service code"); (b) **model fallback** (Gemini→Groq) — **dẫn khi hỏi "xử lý failure mode/đắt"**.

### 3.6 NNG (2.5 năm) — performance + security + leadership
- **Làm gì:** Load **8s→1s**; **led team 4** remediate pentest (**3 high+13 medium+8 low**) cho Flotech Singapore; offline map; Angular multi-repo→Nx monorepo.
- **Tại sao ăn điểm:** (a) **code review/security**; (b) **leadership**; (c) **performance có số liệu**.

---

## 4. LLM engineering + AIT stack — technical prep (trọng tâm)

### 4.1 Streaming responses (keyword JD)
- SSE / `text/event-stream`; token incremental. OpenAI `stream:true` → SSE `data:{...}`/`[DONE]`; Anthropic `message_start`/`content_block_delta`/`message_stop`; Gemini `streamGenerateContent`. Vercel AI SDK `streamText()` → async iterable + edge runtime.
- **Cạm bẫy production:** parse SSE đúng (partial chunk buffer), AbortController cleanup khi unmount, tool-call delta accumulate, error mid-stream, backpressure.
- **Câu mẫu:** "Avatar48 stream live trade qua Socket.IO; LLM dùng `streamText`, FE consume async iterable, AbortController khi unmount. Tool-call trong stream accumulate delta arg rồi execute khi complete."

### 4.2 Function / tool calling (keyword JD)
- Pattern: prompt+`tools`(JSON schema) → model trả `tool_call`+args → **bạn** execute → return result → model tiếp tục. Multi-step = **agent loop**.
- Provider: OpenAI `tools`+`tool_choice`; Anthropic `tools`+`tool_use`/`tool_result`; Gemini `function_declarations`. Vercel AI SDK `tools`+`execute`, `maxSteps`.
- **Cạm bẫy:** Zod validate args, parallel calls, infinite loop (cap `maxSteps`), idempotency, security (confirm step cho tool nguy hiểm).
- **Ứng dụng Avatar48 AI agent:** agent gọi on-chain action (swap/create token) qua tool.

### 4.3 Structured output + failure modes (keyword JD "structured output, handling failure modes")
- **Structured output:** JSON mode / JSON schema (OpenAI structured outputs, Anthropic tool-use as schema, Gemini `responseSchema`). Dùng cho: extract data, classify, form-fill (LoLamBenhAn).
- **Failure modes & mitigation:**
  - Rate-limit/timeout → **fallback chain** (Gemini→Groq, câu chuyện LoLamBenhAn).
  - Hallucination → RAG + citation + schema constrain.
  - Cost spike → token tracking, prompt caching, model nhỏ cho task đơn giản.
  - Schema lệch → Zod validate + retry.
  - Toxic/PII → input/output guardrail.

### 4.4 MCP servers + AIT stack (JD explicit — ĐIỂM ĂN LỚN)
JD ghi bạn sẽ **consume MCP servers** + AI Model Gateway + Agent Platform + RAG services. **Danny có MCP integration experience** (CV: "MCP server integration; subagent delegation"; repo ai-job-search dùng MCP tools).
- **Nói được:** MCP (Model Context Protocol) — chuẩn expose tool/resource/context cho LLM; bạn đã **dùng + tích hợp MCP server** trong workflow Claude Code. "Em quen consume MCP server — đúng cái AIT AI Engineering team expose cho em."
- **AI Model Gateway:** abstraction đa provider + rate limit + cost + logging + fallback. Danny đã tự build pattern này (multi-provider Vercel AI SDK + Groq fallback) → nói "em đã build mini gateway, sẵn sàng consume gateway của team + feedback SDK."
- **RAG services:** Danny có (GenCodify vector DB) → mục 4.5.

### 4.5 RAG & vector DB
- Pipeline: ingest → **chunk** (semantic boundary + overlap) → **embed** → **vector DB** (pgvector/Pinecone) → query embed → cosine top-k → rerank → context+citation → LLM.
- Trade-off: chunk size, embedding model, hybrid search, reranker.
- **Câu mẫu:** "Chunk theo heading + overlap 200 token, embed, pgvector, top-10 rerank top-3 + citation."

### 4.6 Observability cho AI (JD nice-to-have — ĐIỂM ĂN)
JD liệt kê **OpenTelemetry, Datadog, Sentry, Langfuse, LangSmith**. Danny có **OTel + Sentry**.
- **Nói được:** OTel/Sentry cho app metrics (uptime/latency/error); **Langfuse/LangSmith** chuyên cho LLM trace (prompt/response/token/cost/eval). "Em dùng OTel+Sentry ở app layer; với LLM em sẽ adopt Langfuse/LangSmith để trace prompt+eval+cost — đúng pattern AIT cần."

---

## 5. Full-stack & software engineering (Must-have JD)

### 5.1 React + TypeScript deep-dive
- **Hooks:** `useEffect` cleanup/dep, `useMemo`/`useCallback` (khi nào KHÔNG dùng), `useReducer`, custom hooks. JD nêu **suspense** → biết RSC data fetching + Suspense boundary.
- **State:** Zustand (client) vs React Query (server) — tách 2 loại. JD "async data" → React Query/SWR.
- **Component architecture + accessible UI** (JD nêu) → Ant Design Pro / shadcn (Radix-based, accessible by default).
- **Next.js 15 / Vite** build toolchain (JD nêu) → App Router, RSC, streaming SSR.
- **Câu chắc hỏi:** "Server vs Client Component?" → data/DB/API key ở Server, interactivity (`useState`/event) ở Client.

### 5.2 Python backend (GAP — phải nói được)
- **Framework:** JD nêu **FastAPI / Flask / Django**. Danny có Django; **nên ramp FastAPI** (giống Elysia/Express nhất: async, type-hint, Pydantic, auto OpenAPI).
- **async/await** (JD nêu): Python `asyncio` ≈ JS event loop; `async def`, `await`, `asyncio.gather`. Nói bridge: "event loop concept em thuần từ JS, Python asyncio tương đương."
- **Background jobs** (JD nêu): Celery/RQ (Redis) ≈ BullMQ. Danny biết BullMQ → "Celery same pattern as BullMQ em dùng."
- **Testable service code** (JD nêu): pytest, dependency injection (FastAPI `Depends`), Clean Architecture (Danny đã apply).
- **Pydantic** ≈ Zod (Danny dùng Zod) → validation/schema.

### 5.3 API & integration design
- REST naming, status code, pagination (cursor vs offset), versioning, **idempotency key** cho POST, error envelope.
- **Auth** (JD nêu OAuth/JWT/API keys): Danny có Google OAuth (LoLamBenhAn), JWT (NestJS).
- **Webhook + queue** (JD nêu): QuickNode webhook→BullMQ (Avatar48); RabbitMQ (GenCodify).

### 5.4 Deployment & ops
- Docker multi-stage; K8s (Pod/Deployment/Service/Ingress/StatefulSet/ConfigMap/Secret/probe/rollout); GitLab CI; AWS; **logging + debug deployed system** (JD nêu).

### 5.5 SE practices (từng keyword JD)
- Version control (Git flow/trunk-based, PR, conventional commit); **testing** (unit/integration/e2e + **AI app eval**); **code review** (led pentest); **packaging** (Nx/Turborepo, shared pkg); **API design**.

---

## 6. System design (có thể round riêng)

### 6.1 Khả năng cao: "Thiết kế internal AI assistant cho team game live-ops"
- **Clarify:** ai dùng, use-case (tra cứu config, generate report, trả ticket player), volume, latency, data source.
- **High-level:** React chat UI (streaming) → API Gateway → **AIT AI Model Gateway** (consume, không tự build) → **RAG over game knowledge base** (docs/config/changelog via MCP/AI Portal) → **tool calling** (query player DB, trigger action) → queue cho async.
- **Neo AIT stack (ăn điểm):** *"Em sẽ consume AI Model Gateway + RAG services + MCP server của AI Engineering team, không tự build LLM layer — tập trung product surface + integration."*
- **Adoption layer (JD DNA):** onboarding flow, feedback loop, metric dashboard (hours saved, adoption rate).
- **Production:** eval pipeline, cost dashboard, guardrail, alert, observability (OTel + Langfuse).

### 6.2 "Build shared AI platform cho cả công ty" → multi-tenant, RBAC, usage quota, model catalog, prompt template mgmt, secret mgmt, audit log.

### 6.3 Framework: clarify → estimate → high-level → deep-dive → trade-off/bottleneck/scale → **production concern (observability/security/cost) + adoption metric** (JD nhấn).

---

## 7. Behavioral (STAR — thuộc 5-7 câu)

JD **high-ownership + product-to-adoption + cross-functional** → behavioral quan trọng.

### 7.1 Ownership / đi xa hơn expectation
InspectAI: sole, tự K8s, tự observability — deliver end-to-end không cần DevOps.

### 7.2 Cross-functional / non-tech user *(cực ăn AIT)*
AI Communication + InspectAI: tool cho CS/marketing/ops. **Map workflow → translate → ship tới adoption.** Cách thu requirement non-tech, hide complexity phía sau AI.

### 7.3 "Project done = team dùng không cần bạn" (JD câu signature)
Chuẩn bị 1 câu thật: ví dụ dashboard EVN hay extension AI — nói cách onboard user, viết doc/hướng dẫn, iterate theo feedback, measure adoption.

### 7.4 Conflict / bất đồng kỹ thuật
Chuẩn bị 1: thread pool vs asyncio, hoặc CQRS vs CRUD — quyết định dựa data.

### 7.5 Bug khó nhất / failure
Avatar48 race hoặc InspectAI streaming race: triệu chứng → debug → root cause → fix → bài học.

### 7.6 Leadership
NNG: led team 4, 24 vulnerability, phân task/review/tracking.

### 7.7 Học stack mới nhanh (mitigate Python)
Học Bun/Elysia, Go/Gin, K8s manifest trong khi ship. **"Em onboard Python/FastAPI trong 1-2 tuần, cùng cách em đã onboard 3 stack mới trước đó."**

### 7.8 AI-augmented workflow (JD must "default workflow, not novelty")
**Câu ăn lớn:** "Em dùng Claude Code/Cursor hằng ngày, author CLAUDE.md/AGENTS.md cho repo, tích hợp MCP server, orchestrate subagent. Đây là chữ JD 'default workflow not novelty' — em đã sống thế."

### 7.9 "Tại sao VNGGames / AIT"
"Em đã build đúng internal AI tooling tới adoption. Muốn scale lên cấp công ty — biến AI thành capability dùng chung mọi phòng ban. VNGGames AIT đúng chỗ. Và em hứng thú domain game (live-ops có nhiều use-case AI thú vị: player support bot, content moderation, auto-ticket)."

---

## 8. Gap handling (KHÔNG lảng tránh)

### 8.1 ⚠️ Python production (MUST-HAVE — gap thật, ưu tiên #1)
**Chiến lược 2 lớp: trung thực + bằng chứng:**

**(A) Frame trung thực + transferable:**
> "Em TypeScript-first (NestJS, Bun/Elysia, Next.js) với 4 năm production. Python em có Django ở skills, đọc/viết được, nhưng **chưa có Python production lớn** bằng TS. Tuy nhiên: (1) em học stack mới rất nhanh — đã onboard Go/Gin, Bun/Elysia, K8s trong khi ship; (2) Python backend cho AI app — FastAPI — rất giống Elysia/Express em thuần (async, type-hint, Pydantic≈Zod, auto OpenAPI); (3) concept LLM/AI engineering stack-agnostic. Nếu team Python, em onboard trong 1-2 tuần."

**(B) Bằng chứng (làm TRƯỚC phỏng vấn — mạnh mẽ):**
> **Build 1 mini FastAPI project: RAG chatbot over game docs** — FastAPI + OpenAI streaming + 1 tool calling + PostgreSQL/pgvector + Docker. Push GitHub. Mở phỏng vấn: *"Em vừa prototype bằng FastAPI tuần qua để prove Python capability — đây repo."* **Đây biến gap thành strength.**

**(C) Nếu bị soi "sao JD Python mà em TS-first":**
> "Đúng Python là chuẩn data/ML research. Nhưng **AI application engineering** (LLM vào web production) TS có ecosystem ngang (Vercel AI SDK, LangChain.js). Em chọn TS vì full-stack 1 ngôn ngữ, type-safe E2E. Cho team cần Python backend em bridge — và em đang ramp FastAPI chủ động."

### 8.2 Game industry / live-ops (nice-to-have — nhẹ hơn)
> "Em chưa có game trực tiếp. Nhưng role AIT = build **AI tooling**, và em đã build tooling cho domain khác (healthcare, IoT, e-commerce, blockchain) — workflow: thu requirement domain → translate → ship tới adoption. Game live-ops em hiểu đủ khái niệm (event/season, balance, player support, content moderation, telemetry). AI tooling cho live-ops (player support bot, RAG over game knowledge, auto-classify ticket) rất giống tool em đã làm."

Hỏi ngược: *"Team em phục vụ use-case nào trước?"* kéo về thế mình.

---

## 9. Coding round — dự kiến

- **Kiểu:** (a) LeetCode medium; (b) **build mini LLM feature** (streaming chat / tool calling) — khả năng cao vì role AI; (c) refactor/debug.
- **Python variant (nếu yêu cầu):** `fastapi` + `openai` SDK streaming + 1 tool. **Thực hành trước** (cùng repo mục 8.1B).
- **TS variant:** Vercel AI SDK `streamText` + 1 tool, ~15-20 dòng. Thuộc syntax.
- **DSA warm-up:** array/string/hashmap/two-pointer/BFS-DFS/DP cơ bản.

---

## 10. Câu hỏi ĐỂ HỎI HỌ (cuối PV — bắt buộc, thể hiện insight)

1. "Use-case AI đầu tiên AIT ưu tiên cho phòng ban nào, bottleneck hiện tại là gì?"
2. "Em sẽ consume AI Model Gateway/Agent Platform/MCP server thế nào? Có docs/onboarding không?" *(cho thấy hiểu AIT stack)*
3. "Stack thực tế Python thuần hay polyglot? Dev có flex chọn TS cho app layer không?" *(mitigate Python)*
4. "Cách team eval output LLM + prompt versioning? Dùng Langfuse/LangSmith không?" *(production maturity)*
5. "Metric 'adoption' / 'hours saved' team đo thế nào — em sẽ own phần nào?" *(đúng DNA JD)*
6. "Onboarding cho người mới TS-first ramp Python — mentor/expect thế nào?" *(chân thực)*
7. Culture: cách làm việc với non-engineering, agile, on-call.

---

## 11. Salary & negotiation

- **JD KHÔNG công bố salary** (verify text gốc — không có range). VNG = tier công ty lớn VN. Fullstack mid-senior HCMC 4 năm + chuyên AI production: tham khảo **~25–45M gross** (verify ITviec/VietnamWorks/Glassdoor "VNG Fullstack 2026" trước khi dùng con số).
- **Đừng nêu số đầu tiên.** Hỏi range của họ: *"Em muốn hiểu range cho vị trí trước. Với 4 năm + chuyên AI production em kỳ vọng mức competitive mid-senior HCMC."*
- **Lever:** ship production AI (hiếm) + sole end-to-end + K8s/observability + **AI-augmented default workflow** (đúng chữ JD).

---

## 12. Checklist trước phỏng vấn (T-1 ngày / T-1 tuần)

- [ ] ✅ JD gốc đã verify (career.vng.com.vn).
- [ ] **Build mini FastAPI RAG chatbot** (mục 8.1B) — biến gap Python thành strength. **Ưu tiên #1.**
- [ ] Đọc lại [portfolio](https://danny.io.vn) + đảm bảo Avatar48/LoLamBenhAn live.
- [ ] Thuộc elevator pitch (mục 1) + match map (mục 2).
- [ ] Rèn **streaming + tool calling + structured output** code mental (mục 4.1–4.3, 9).
- [ ] Chuẩn bị 7 STAR (mục 7) — nhất là **7.3 (adoption)** + **7.8 (AI workflow)**.
- [ ] Nghĩ câu trả lời gap **Python (mục 8.1) + game (8.2)** — trung thực.
- [ ] 2-3 câu hỏi hỏi lại (mục 10).
- [ ] Ngủ đủ, đến sớm 10 phút.

---

## 13. Cheat-sheet 1 trang

```
NEO MỌI CÂU VỀ: "ship production AI tooling TỚI ADOPTION cho team non-tech"
+ "AI tools là default workflow hằng ngày của em" (đúng chữ JD).

PITCH: 4 năm full-stack (React/TS strong + Python ramping), mạnh nhất ship
production AI (5 sản phẩm, sole end-to-end K8s). Dùng Claude Code/Cursor/MCP
hằng ngày. AIT = đúng việc em đã làm.

JD MUST-HAVE: React+TS✓ · Python BE (GAP→FastAPI demo) · API/integration✓ ·
DB✓ · Docker/CI/CD/cloud✓ · AI fluency(Claude/Cursor)✓✓ · DSA✓ · high-ownership✓

JD NICE (trúng): LLM streaming/tool/structured✓ · chat UI/agent panel✓ ·
shadcn/Ant Design✓ · OTel/Sentry✓ · non-tech user✓ · operator console✓ ·
MCP/RAG✓ · game(✗ reframe)

5 PROJECT DẪN: AI Communication(internal tool) · InspectAI(real-time NLP+K8s)
· Avatar48(AI agent+CQRS+streaming+OTel) · GenCodify(AI microservice+vector)
· LoLamBenhAn(DDD+Gemini/Groq fallback)

AIT STACK (consume, không build): AI Model Gateway · Agent Platform · MCP
server · RAG services · AI Portal.

LLM CORE: streamText(SSE/AbortController) · tool loop(maxSteps/Zod/idempotent)
· structured output(JSON schema) · failure mode(fallback Groq) · RAG(chunk/
embed/vector/rerank/cite) · observability(OTel+Langfuse).

GAP: Python=TS-first, ramp FastAPI 1-2 tuần (đã có demo repo). Game=reframe
(AI tooling, domain transferable).

CÂU HỎI HỌ: use-case ưu tiên? consume gateway/MCP thế nào? eval/prompt
versioning? metric adoption? Python onboarding?

SALARY: JD không công bố. Hỏi range trước, anchor mid-senior+AI production hiếm.
```

---

*Tài liệu dựng từ profile thực (Hồ Thành Danh) + **JD gốc VNGGames AIT (job code 26-AIT-3829) đã verify trực tiếp** career.vng.com.vn. Cập nhật: Python = must-have, thêm MCP/AI Gateway/adoption-driven framing.*
