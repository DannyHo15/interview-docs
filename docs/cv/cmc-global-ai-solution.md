# 🤖 CMC Global — Senior Python (AI Solution) — Prep File

> File prep riêng cho role **Senior Python (AI Solution)** tại **CMC Global** (khác với FE/RN).
> Cấu trúc: **verdict → map CV↔JD → chiến lược position → pitch gửi HR → câu hỏi + câu trả lời mẫu → checklist brush-up → câu hỏi hỏi lại.**
> 🔥 = gần như chắc chắn hỏi. ⚠️ = câu phòng thủ (trả lời trước khi bị hỏi).

---

## 0. Verdict — Đáp ứng một phần (~55–65%)

**Match rất tốt ở phần AI Builder (MCP + Claude Code + GenAI + RAG)** — đúng tinh thần "Builder" JD cần. **GAP lớn ở Python depth + bậc Senior + enterprise AI platform (Vertex AI/Amazon Q).**

→ **Nên apply**, nhưng **position là "AI Solution Builder", KHÔNG phải "Python dev"**. Lead bằng MCP/Claude Code/GenAI trước khi tới "gate Python".

| Match | Gap |
|-------|-----|
| Claude Code, MCP, subagent orchestration (hiếm, JD nêu đích danh) | 🐍 Python depth — không có project Python featured |
| GenAI integration (Gemini/OpenAI/Vercel AI SDK) | Senior level (4 năm = mid-senior) |
| API (REST), vector DB exposure, full lifecycle/CI | Enterprise low-code AI (Vertex AI/Amazon Q/Relevance AI) |
| AWS cơ bản (S3/SES/SNS/DynamoDB) + K8s | AI security guardrails (PII/prompt injection) |
| Learning agility (Web3 từ 0), leadership (lead team 4) | Agent Ops (drift/cost monitoring) |

---

## 1. Map chi tiết CV ↔ JD

| JD yêu cầu | Match | Bằng chứng CV |
|---|---|---|
| Claude Code, GitHub Copilot, AI-augmented dev | ✅🔥 | "AI-Augmented Development: Claude Code, Codex, Cursor, Copilot; CLAUDE.md/AGENTS.md authoring; MCP server integration; subagent delegation; spec-driven & TDD" |
| **MCP servers** (JD nêu rõ) | ✅🔥 | Đã integrate + build MCP servers, orchestrate subagent |
| GenAI tools, agents, non-agentic automation | ✅ | InspectAI (Gemini + GCP NLP), AI Communication (Vercel AI SDK), GenCodify AI microservice, LoLamBenhAn AI form-fill (Gemini + Groq fallback) |
| API integration REST/GraphQL + MCP | ✅🟡 | REST mạnh; GraphQL chỉ trong folder prep (CV không nêu project rõ) |
| Vector DB, RAG pipelines | 🟡 | "vector databases" + GenCodify "vector database support" — nhưng **không nêu RAG pipeline tường minh** |
| Gemini for Enterprise | 🟡 | Dùng Gemini API nhiều (InspectAI, LoLamBenhAn) |
| AWS (preferable) | 🟡 | S3/SES/SNS/DynamoDB + K8s deploy — cơ bản |
| Version control, full lifecycle | ✅ | GitLab CI, Nx, Turborepo, EAS |
| SME / facilitator / leadership | ✅ | Lead team 4 (NNG pen-test) |
| Measure value (hours saved, error rate) | ✅ | Mindset metric: 8s→1s, 3 high/13 medium/8 low vulns |
| **Python** (title, core) | ❌⚠️ | Chỉ trong skills list, **không project featured**. Django listed, không demo |
| Vertex AI / Amazon Q / Relevance AI | ❌ | Chưa từng dùng enterprise low-code AI platform |
| AI security guardrails (PII, prompt injection) | ❌ | Chưa nêu |
| Agent Ops (drift, cost) | ❌ | LLMOps — chưa có |

---

## 2. Chiến lược position — "AI Solution Builder"

**Core message (dùng trong intro / cover letter / câu "tell me about yourself"):**
> "Em là Full-Stack SWE 4 năm, nhưng **gần đây chuyên sâu AI integration** — đã build nhiều solution GenAI (Gemini, OpenAI, Vercel AI SDK), **tích hợp & xây MCP servers**, và làm **AI-augmented development** với Claude Code/subagent orchestration ở mức authoring CLAUDE.md/AGENTS.md. Đúng tinh thần 'Builder' mà role này cần — kết hợp low-code platform + coding Python để ship agent/automation có đo lường được giá trị."

**Nguyên tắc:**
1. **Lead bằng AI/MCP/Claude Code** trong 30 giây đầu → recruiters thấy depth trước khi gate Python.
2. **Đừng** position "Python backend dev" → bạn sẽ thua các ứng viên Python 8-10 năm.
3. **Pre-empt câu Python** (xem mục 4.1) — thành thật, reframe bằng learning agility.
4. **Đóng gói 4 project AI lên đầu** (InspectAI, AI Communication, GenCodify AI svc, LoLamBenhAn) để che phần TS-heavy.

---

## 3. Pitch / Cover letter — gửi Mr. Bac (dvbac1@cmcglobal.vn)

> Gửi ngắn qua email/Zalo, lead bằng góc AI Builder. KHÔNG mở bằng "em ứng tuyển vị trí Senior Python".

---

**Subject:** Ứng tuyển AI Solution Builder — MCP + GenAI + Claude Code (Hồ Thành Danh)

Chào anh Bac,

Em là Hồ Thành Danh, SWE 4 năm, đọc JD **Senior Python (AI Solution)** và thấy match cao ở đúng phần "Builder" mà team cần:

- **MCP servers + Claude Code + AI-augmented dev** ở mức authoring spec (CLAUDE.md/AGENTS.md), subagent orchestration — em đã tích hợp & xây thực tế. Đây là combo mà em thấy JD nêu đích danh.
- **GenAI integration** đã ship production: pipeline real-time NLP (Gemini + GCP Natural Language — InspectAI), Vercel AI SDK multi-model (OpenAI + Gemini — AI Communication), AI microservice với vector DB (GenCodify), AI form-fill với fallback chain (Gemini → Groq).
- **API + cloud**: REST integration, AWS (S3/SES/SNS/DynamoDB), K8s deploy, full CI lifecycle.
- **Learning agility**: tự học Web3 từ 0 → ship Avatar48 (Solana bonding curve, CQRS 38+ modules) trong vài tháng — cùng tốc độ ramp em sẽ apply cho Python depth + Vertex AI/Amazon Q.

Về Python: em có trong toolkit (cùng TS/Go), vài năm gần đây主力 TypeScript theo product team. Em muốn trao đổi trực tiếp để anh thấy em fit ở góc **AI Solution Builder** (low-code + coding) hơn là thuần Python backend.

Em có thể gọi bất cứ lúc nào anh tiện. CV đính kèm.

Cảm ơn anh,
Hồ Thành Danh — +84 396 626 628

---

## 4. Câu hỏi phỏng vấn + câu trả lời mẫu

### 4.1 ⚠️🔥 "Your CV is mostly TypeScript, but this is a Senior Python role. How comfortable are you with Python?"

**(Câu quan trọng nhất — phải trả lời xuất sắc)**

**Điểm cần cover:**
- **Thành thật nhưng không tự hạ:** "Python nằm trong toolkit cùng TS/Go. 2-3 năm gần đây主力 TypeScript vì product team cần. Nhưng em đã viết Python (Django, scripts, automation) và model mental (async, microservice, DI) giống hệt TS."
- **Reframe theo JD:** "Role ghi rõ 'low-code **and** coding' + Claude Code/MCP — strength của em nằm đúng lớp **AI Builder**, gần như **language-agnostic**. Python em productive trong vài tuần."
- **Bằng chứng ramp speed:** "Web3 từ con số 0 → ship Avatar48 (Solana, bonding curves, CQRS) trong vài tháng. Cùng learning agility áp dụng cho Python depth."
- **Cam kết cụ thể:** "2 tuần đầu em sẽ build 1 reference RAG service bằng **FastAPI + LangChain** để align đúng stack team."
- **KHÔNG** nói dối "em rành Python lắm" — interviewer sẽ test ngay (viết 1 hàm/decorator/async).

**Follow-up hiểm:** "Viết cho tôi 1 decorator cache trong Python" / "asyncio vs threading khác gì?" → **phải chuẩn bị thật** (xem checklist mục 5).

---

### 4.2 🔥 "Tell me about your MCP server experience."

**(Đây là điểm mạnh nhất — exploit tối đa)**

**Điểm cần cover:**
- **Định nghĩa:** MCP (Model Context Protocol) = protocol chuẩn để LLM/agent gọi **tools** + đọc **resources** từ nguồn ngoài, thay vì tích hợp bespoke từng cái.
- **Kinh nghiệm thực tế:** em đã **integrate + build MCP servers**, kết nối LLM (Claude) với data source/tool ngoài theo protocol chuẩn (DB, search, Figma, file system, API). Kết hợp **subagent orchestration** (delegation task cho sub-agent chuyên biệt).
- **Tại sao match JD:** JD ghi "design integrations via API (REST/GraphQL) **and MCP servers** enabling AI workflows" — đúng chuyên môn em.
- **Value:** MCP chuẩn hóa integration → agent gọi tool an toàn, có schema, tái dùng được giữa nhiều LLM.

**Follow-up:** "Khi nào chọn MCP vs function calling thông thường?" → MCP khi cần **share tool giữa nhiều client/agent**, có discovery, tách tool server khỏi LLM app; function calling đủ cho 1 app đơn.

---

### 4.3 🔥 "How would you build a RAG pipeline for our internal company data?"

**Điểm cần cover (đầy đủ pipeline, thể hiện depth):**

```
Ingest → Chunk → Embed → Store → Retrieve → Rerank → Generate → Guard → Evaluate
```

1. **Ingest:** document loader (PDF, Confluence, Notion, DB, ticket) — incremental sync.
2. **Chunk:** semantic chunking (theo heading/section) + overlap, không chunk cứng theo char count.
3. **Embed:** `text-embedding-gecko` (Vertex) / OpenAI embedding.
4. **Store:** vector DB — **pgvector** (Postgres, đơn giản nếu đã có) hoặc Vertex Vector Search / Pinecone (scale).
5. **Retrieve:** **hybrid search** (vector + BM25 keyword) → top-k candidate.
6. **Rerank:** reranker model (cohere/cross-encoder) → top-n chính xác.
7. **Generate:** prompt = system + retrieved context + question → Gemini; **bắt buộc citation** (source reference).
8. **Guard:** PII filter + prompt injection check trước/sau (xem 4.5).
9. **Evaluate:** **RAGAS** (faithfulness, answer relevancy, context precision), retrieval recall@k, A/B test vs baseline.
10. **Ops:** re-index khi data đổi (event-driven), cache query phổ biến, track cost.

**Tie CV:** "Em đã build GenCodify AI microservice với vector DB + Gemini/OpenAI — cùng pattern retrieve-augment, giờ thêm bước eval + guardrail cho enterprise."

**Follow-up:** "Embedding cũ khi model update → sao?" → re-embed toàn bộ + version index, dual-run一段时间 để so sánh.

---

### 4.4 🔥 "Have you used Vertex AI / Amazon Q / Relevance AI?"

**(Thành thật — đừng bịa)**

**Điểm cần cover:**
- **Thành thật:** "Chưa dùng 3 platform enterprise đó cụ thể."
- **Nhưng transfer được:** "Em đã dùng **Gemini API + Google Cloud Natural Language** (InspectAI — real-time NLP pipeline). Vertex AI là managed layer phía trên Gemini/imbbeding/model garden — **API pattern transfer trực tiếp**, em ramp trong vài ngày."
- **Amazon Q / Relevance AI** là low-code agent platform → "em sẽ evaluate capability (knowledge base connector, guardrail built-in, RAG sẵn) vs build-from-scratch trước khi chọn — đúng tư duy 'low-code **and** coding' của JD."
- **Cam kết:** "Tuần đầu em sẽ setup 1 POC trên Vertex AI Agent Builder + 1 trên Amazon Q để compare, rồi recommend."

---

### 4.5 🔥 "How do you handle AI security — PII and prompt injection?"

**Điểm cần cover (đúng 2 keyword JD: PII sanitization + prompt injection):**

**PII:**
- Detect: regex + **NER** + tool chuyên dụng (**Google Presidio**) → tìm name/email/phone/ID.
- Sanitize: **mask/redact** PII **trước** khi gửi tới LLM; hoặc dùng Vertex AI với **data residency + no-training** cho data nhạy cảm.
- Log: không log raw PII vào trace (hash thay vì raw).

**Prompt injection:**
- **Instruction hierarchy:** system prompt tách bạch, mark user input là "untrusted data" (delimeter rõ).
- **Input detection:** pattern/jailbreak classifier, detect "ignore previous instructions".
- **Output filtering:** content moderation, grounding (citations), block nếu output cố gọi tool nguy hiểm.
- **Tool use least-privilege:** scope tool hẹp, **human-in-the-loop** cho action phá hủy (delete, transfer), confirmation prompt.
- Framework: **OWASP LLM Top 10** làm checklist.

**Tie JD:** "Đây đúng 2 thứ JD liệt kê — PII/data sanitization + prompt injection mitigation + compliance. Em sẽ dựng guardrail layer reusable cho mọi agent."

---

### 4.6 🔥 "How do you measure the value of an AI solution?" (Value Realization)

**Điểm cần cover (JD: hours saved, error rate reduction):**
- **Baseline before/after:** log thời gian manual vs automated, error rate pre/post, **adoption** (weekly active user của agent).
- **Outcome, không vanity:** tránh "query count" → focus **hours saved × loaded cost**, **error reduction %**, **cycle time**.
- **Cost vs value:** cost/query (token) vs value/query → ROI. Route model rẻ (Gemini Flash/Haiku) cho task đơn, đắt cho task khó.
- **Dashboard + cadence:** review định kỳ với AI Value Stream lead, iterate dựa feedback user.
- **Tie CV:** "Em từng đo 8s→1s (FE perf) và 3/13/8 vulns (security) — cùng mindset baseline → metric → iterate."

---

### 4.7 🔥 "Agent Ops — how do you monitor drift and cost?"

**Điểm cần cover (JD: monitor performance, drift, cost = Agent Ops):**
- **Drift:**
  - Eval set cố định → chạy định kỳ → score giảm = drift (model hoặc data đổi).
  - Input distribution shift detection (user query thay đổi pattern).
  - Answer quality sampling (human review sample).
- **Cost:**
  - Token usage/request, cache query phổ biến (semantic cache), **model routing** (cheap vs premium theo task).
  - Budget alert + quota per user/team.
- **Tooling:** **Langfuse / LangSmith** cho tracing + eval; log latency p95, error rate, tool-call success rate.
- **Tie:** "Em sẽ dựng observability layer (trace mọi agent call) + alert khi drift/cost vượt ngưỡng."

---

### 4.8 🔥 "Walk me through an agent you built."

**Điểm cần cover (chọn project phù hợp nhất):**
- **InspectAI** (sole engineer): audio meeting → STT streaming → Gemini + GCP NLP analyze (toxicity, sentiment, policy) → flag real-time → dashboard. Đây là **pipeline AI + automation** đúng kiểu JD ("non-agentic automation" + "AI-driven workflow").
- **GenCodify AI microservice:** AI service với vector DB + Gemini/OpenAI cho generate/edit code.
- **L honesty:** "Kinh nghiệm agent của em thiên về **pipeline/automation + AI-augmented orchestration** (subagent qua Claude Code). Cho **tool-calling agent** thuần, em sẽ dùng pattern **MCP + function calling** + guardrail."

**Follow-up:** "Agent gọi tool sai/toxic — xử lý?" → guardrail output + human approval + log + retry với context fix.

---

### 4.9 🔥 "Why this role / why CMC Global?"

**Điểm cần cover:**
- **Role:** đúng ngã rẽ em muốn — từ full-stack product → chuyên sâu **AI Solution Builder** (low-code + coding), đo lường được value. Combo MCP/GenAI/RAG em đã có nền.
- **CMC Global:** quy mô enterprise + onsite quốc tế (US/Europe/Asia) + AI Guild (cộng đồng AI nội bộ) → môi trường grow AI depth nhanh.
- **Semiconductor client context:** domain mới (em thích domain challenge — đã chứng minh Web3 từ 0).

---

### 4.10 Behavioral — Learning Agility (JD nêu rõ "high Learning Agility")

**Q: "Tell me about a time you had to learn a completely new technology fast."**
- **STAR:** Web3/Solana từ 0 → trong vài tháng ship Avatar48 (bonding curve, CQRS 38+ modules, on-chain integration). Quy trình: đọc docs chính → build POC nhỏ → iterate → ship production.
- **Lesson:** em có framework học nhanh — "docs chính trước, POC ngay, không tutorial sinkhole."
- **Apply role:** "Cùng phương pháp em ramp Python depth + Vertex AI/Amazon Q trong 2-4 tuần đầu."

---

## 5. ✅ Checklist brush-up (nếu qua vòng, cày gấp)

| Chủ đề | Phải nắm | Priority |
|---|---|---|
| **Python** | FastAPI (async, Pydantic), decorator, context manager, `asyncio` vs threading vs multiprocessing, typing, venv/poetry | 🔥🔥🔥 |
| **RAG** | LangChain **hoặc** LlamaIndex, chunking strategy, pgvector/Pinecone, reranking, **RAGAS** eval | 🔥🔥🔥 |
| **Vertex AI** | Gemini API on Vertex, Agent Builder, Vector Search, embeddings, model garden | 🔥🔥 |
| **Amazon Q / Relevance AI** | Try free tier, hiểu capability (KB connector, guardrail built-in) | 🔥🔥 |
| **MCP** | Nắm vững protocol (tool/resource/prompt server), viết 1 MCP server Python mẫu (official SDK) | 🔥 (đã có nền) |
| **AI security** | OWASP LLM Top 10, **Presidio** (PII), prompt injection defense, guardrail framework | 🔥🔥 |
| **Agent Ops** | **Langfuse/LangSmith**, eval set, drift detection, cost/token optimization, model routing | 🔥🔥 |
| **AWS** | Bedrock (nếu JD nhắc), Lambda cho automation, S3, IAM least-privilege | 🔥 |

> **POC đề nghị (tự build trước phỏng vấn, đưa link GitHub):**
> 1 MCP server Python + 1 RAG mini-service (FastAPI + pgvector + Gemini) + guardrail PII cơ bản (Presidio). Có cái này = chứng minh **đáng tin** dù CV TS-heavy.

---

## 6. Câu hỏi nên HỎI LẠI interviewer (role-specific)

**Technical:**
- 🔥 *"AI roadmap hiện tại ưu tiên use-case nào? Team đã standardize trên platform nào (Vertex/Amazon Q) hay evaluate từng case?"* → biết stack thực tế + show tư duy ROI.
- *"Knowledge Layer hiện tại thế nào — đã có vector DB/RAG hay build từ đầu? Data source chính (Confluence/DB/ticket)?"* → biết scope "Builder" thật.
- *"Stack Python của team — FastAPI? Django? Có framework agent nội bộ (LangChain/custom)?"* → signal mình align + biết phải ramp gì.

**Process / Org:**
- *"AI Guild hoạt động thế nào — em sẽ là SME cho team nào, bao nhiêu Champion/Initiative Owner?"* → đúng JD "Activate the AI Guild".
- *"How do you currently measure value of AI solutions — đã có baseline/metrics hay em sẽ dựng?"* → show outcome-thinking.

**Growth:**
- *"Onsite opportunity (US/Europe/Asia) — role này có path onsite không?"* → CMC Global selling point.
- *"6 tháng đầu, success cho role này trông như thế nào?"*

---

## Ghi chú cuối

- File này = **chiến lược + phản biện**, không phải kịch bản học thuộc.
- **Câu 4.1 (Python gap) là quyết định** — luyện đến khi trả lời tự nhiên, thành thật, không phòng thủ thái quá.
- **Câu 4.2 (MCP) + 4.3 (RAG) là hook ăn điểm** — khai thác tối đa.
- Nếu interviewer là Python purist → khó; nếu interviewer là AI Builder mindset → bạn fit.
- **POC GitHub (mục 5)** = vũ khí mạnh nhất để che gap Python — ưu tiên build trước phỏng vấn.

---

🔗 [Quay lại danh sách folder](../) · [CV Deep-Dive](./cv-deep-dive.md)
