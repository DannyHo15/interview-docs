# InspectAI — Real-time Meeting Language Monitoring

> **Role:** Sole full-stack + DevOps engineer (Metagrit).
> **Stack:** NestJS 11 · TypeORM · PostgreSQL · Redis · BullMQ · Socket.IO · Gemini AI · Google Cloud Natural Language · Recall.ai · Next.js 15 + React 19 · K8s (Kustomize + Argo CD).
> **Tại sao ăn điểm VNG AIT:** Đúng DNA "internal AI tool cho team non-engineering" (compliance/ops) — real-time NLP pipeline, hybrid classical+LLM detection, sole-own K8s, observability.

---

## 1. Bài toán (elevator)

Giám sát ngôn ngữ **real-time** trong Google Meet để phát hiện vi phạm compliance (lừa đảo tài chính, ngôn từ cấm) — client Nhật. Cần: phát hiện trong khi cuộc họp đang diễn ra, không block UI, sai số thấp (false positive tốn chi phí operator review), và **toàn bộ hạ tầng em tự ship lên K8s**.

> **Câu neo sản phẩm:** *"Hệ thống phải push cảnh báo về side panel trong vài giây sau khi user nói từ cấm — không phải sau khi họp xong."*

---

## 2. Kiến trúc tổng thể

```
Google Meet ──Add-on SDK──▶ Next.js sidepanel ──Socket.IO──▶ NestJS (port 4003)
      │                                                            │
      ▼                                                            ▼
 Recall.ai bot (joins meeting) ──WSS (port 4001)──▶ SentenceAccumulator
      │  Deepgram nova-3 transcript (ja, diarize)         │
      │                                                    ▼
      │                                          Forbidden-word regex
      │                                          + Cloud NLP moderateText
      │                                                    │ (candidates only)
      │                                                    ▼
      │                                          BullMQ queue ──▶ Gemini LLM
      │                                          (handle-detect-word-ai)  (confirm)
      │                                                    │
      │                                                    ▼
      └──────────────────────────────────── audit_log + violation_log (PG)
                                                  + socket emit `detect_valid_word_result`
```

3 port container: **4000** REST/Swagger, **4001** Recall inbound WSS, **4003** Socket.IO push tới add-on.

---

## 3. NLP Pipeline — điểm kỹ thuật cốt lõi 🔥

### Hybrid 2 tầng: Classical (rẻ) → LLM (đắt)

| Tầng | Làm gì | Tool | Tại sao |
|---|---|---|---|
| **Stage 1 — Rule engine** | Regex sweep từ `forbidden_words` + `forbidden_words_ng.detectionPattern`, NFKC normalize, Cloud NLP `moderateText` | `nlp-cloud.service.ts` `detectWordValid`, Google Cloud Natural Language | Rẻ, ms latency, lọc 90% case rõ ràng |
| **Stage 2 — LLM confirm** | Chỉ candidate qua whitelist → Gemini `thinkingBudget:0` JSON output `{status, words, risk_level}` | BullMQ worker `nlp-cloud-queue.ts`, `@google/genai` SDK | Hiểu ngữ cảnh, slang, obfuscation, điều kiện whitelist |

> **Trade-off ăn điểm:** Chỉ gọi LLM khi regex flag nhưng **không bị whitelist mode-1 gạt** → giảm 90% LLM cost. *"Em không feed mọi câu cho Gemini — chỉ candidate值得一 hỏi."*

**Sliding-window context:** Redis list (`LPUSH/RPOP`, cap 10 utterances, TTL 4h) qua `context-buffer.service.ts` → inject conversation context vào prompt. Context-enrichment pass 2 thêm utterances **sau** vi phạm để LLM đánh giá ý định thực.

### DetectionMethod enum (4 loại)
`RULE` (regex) · `DOMAIN_FILTER` (Cloud NLP) · `DOMAIN_CLASSIFIER` · `LLM`. Mỗi audit log gắn `detectedBy` → trace được path nào flag.

**Risk level:** `PASS > GRAY > YELLOW > RED` — quyết định popup hay chỉ audit.

---

## 4. Real-time data flow — Socket.IO

3 namespace trên port 4003:
- `/nlp-cloud` — **main violation push**. Client join room = `meetingCode`. Worker emit `detect_valid_word_result`.
- `/audit-log` — persist legacy path.
- `gemini-ai` — interactive scam detection cũ + batch summary 5s.

**Down events:** `detect_valid_word_result`, `gemini_detech_scam_text_result`, `gemini_valid_word_result`.
**Up events:** `gemini_detech_scam_text`, `gemini_detech_end_meeting`, `gemini_valid_word`.

> **Câu chuẩn bị:** *"Socket namespace tách theo concern — violation push / audit / legacy scam. Mỗi meeting là 1 room, worker emit tới đúng room."*

⚠️ **Trade-off / debt:** `@socket.io/redis-adapter` đã cài nhưng **chưa wire** trong `src/` → mỗi pod emit local. Khi scale multi-pod cần Redis adapter để cross-pod broadcast. Nói được đây là bước kế tiếp.

---

## 5. Recall.ai integration

Bot join meeting qua `POST /meeting/new-bot` → Recall.ai tạo bot với **Deepgram nova-3 streaming** (Japanese, diarize, smart-format). Realtime events push về WSS server của em:

- `transcript.data` (host only, filter `is_host`) → `SentenceAccumulator.addTranscript`
- `transcript.provider_data` + `speech_final` → flush sentence
- `participant_events.chat_message` → NLP payload trực tiếp
- `participant_events.speech_on` → track host id

**SentenceAccumulator** (`sentence-accumulator.service.ts`): buffer partial transcript, flush khi gặp dấu câu `。！？.!?` / gap 5s / max-age 30s / `speech_final`. Lý do: Deepgram gửi partial token liên tục, phải đợi sentence hoàn chỉnh mới detect meaningful.

> **Câu "race khó nhất":** *"Partial transcript đến không thứ tự. Em phải accumulate theo meetingId, chỉ flush khi có dấu hiệu sentence complete. Nếu xử lý từng partial → flood queue + false positive."*

---

## 6. BullMQ — vì sao queue cho NLP?

**Queue name:** `handle-detect-word-ai` (Redis-backed).

| Lý do | Chi tiết |
|---|---|
| **Decouple từ realtime stream** | Gemini chậm (1–3s) — không block transcript flow |
| **Retry + failed hook** | `@OnWorkerEvent('failed')` vẫn log audit + notify operator |
| **Cancellation** | `drainMeetingJobs()` khi end meeting → hủy job pending |
| **Backpressure** | Nếu LLM quá tải, queue buffer thay vì drop |

Cũng có RabbitMQ service riêng (direct exchange + DLQ 7-day TTL, retry max 3) nhưng **cho async messaging khác**, không phải NLP path.

> **Câu đào:** *"Sao BullMQ không RabbitMQ cho NLP?"* → BullMQ cho per-job lifecycle (completed/failed hook → audit + socket), dễ cancel khi end meeting, reuse Redis với cache. RabbitMQ mạnh routing + DLQ cho messaging dài hạn hơn.

---

## 7. K8s deployment (sole-own)

**GitOps:** Kustomize base + overlay, Argo CD sync `inspect-hub-api-development` với auto-prune + self-heal. Namespace `inspect-hub-development`.

| Resource | Cấu hình |
|---|---|
| **API Deployment** | 2 replicas (dev 1), RollingUpdate maxSurge 1 / maxUnavailable 0, 3 port (4000/4001/4003), resources 500m–1 CPU / 2–4Gi |
| **Probe** | liveness `/apis/health/live`, readiness `/apis/health/ready` |
| **PDB** | `minAvailable: 1` — chống drain tất cả pod cùng lúc |
| **Graceful shutdown** | `terminationGracePeriodSeconds: 30` — để drain queue + flush socket |
| **3 Ingress** | `apis.dev.*` (REST), `recall.dev.*` (inbound WSS, nginx websocket annotation), `nlp.dev.*` (Socket.IO) |
| **TLS** | cert-manager `letsencrypt-prod`, ingressClassName nginx |
| **Image registry** | GCP Artifact Registry `asia-southeast1-docker.pkg.dev` |

> **Câu neo DevOps:** *"Em tự viết manifest Kustomize, Argo CD auto-sync. Probe tách live vs ready để rollout không nhận traffic khi DB chưa connect. Graceful shutdown 30s để drain BullMQ."*

---

## 8. Tech stack chi tiết

- **Backend:** NestJS 11.1.6, TypeORM 0.3.26, PostgreSQL (`pg` 8.16), CQRS (`@nestjs/cqrs` 11) cho mọi module, i18n 10.
- **Redis 3 vai trò:** (1) cache (forbidden words, enriched list), (2) BullMQ queue, (3) list/hash storage (context buffer, room cache).
- **AI:** `@google/genai` 1.19 (primary), LangChain 0.3 + `@langchain/google-genai` (secondary, summarization), `@google-cloud/language` 7.2 (Cloud NLP).
- **Queue:** BullMQ 5.61, RabbitMQ (`amqplib`) + Kafka (`kafkajs`) deps present.
- **Frontend:** Next.js 15.5 Turbopack + React 19.1, Tailwind v4, Radix + shadcn, SWR, Sentry, Meet Add-ons SDK 1.2.

---

## 9. Câu hỏi đào sâu — chuẩn bị sẵn 🔥

### Q: "Sao phải tách classical NLP và LLM? Dùng LLM cho tất cả không gọn hơn?"
> *"LLM đắt + chậm. 90% utterance không vi phạm — feed hết Gemini thì cost + latency nổ. Em pre-filter bằng regex + Cloud NLP (ms, gần free), chỉ candidate đáng ngờ mới vào queue LLM. Lúc đó LLM làm đúng việc nó giỏi: hiểu context, slang, whitelist có điều kiện."*

### Q: "False positive cao thì sao?"
> *"Whitelist 2 chế độ: mode-1 (unconditional) gạt ngay ở Stage 1, mode-2 (conditional) đưa cho LLM cùng `usageCondition` — LLM quyết định theo context. Operator có thể đánh giá `EvaluationStatus: SUSPENDED` để feedback loop cải thiện rule."*

### Q: "Nếu Gemini timeout giữa chừng?"
> *"BullMQ retry. Nếu vẫn fail → `@OnWorkerEvent('failed')` vẫn ghi audit_log với `detectedBy=LLM_FAILED` để operator xem thủ công. Không bao giờ mất event."*

### Q: "Scale 1000 meeting đồng thời thì sao?"
> *"Bottleneck: Gemini rate limit + Socket.IO per-pod. Giải: (1) Gemini rate limiter ở service, (2) wire `@socket.io/redis-adapter` (đã dep, chưa wire — debt tôi note), (3) scale pod HPA theo queue depth."*

### Q: "Vì sao prompt DB-driven không hardcode?"
> *"Compliance rule đổi liên tục (luật Nhật cập nhật). Prompt Manager module cho operator sửa prompt + version mà không deploy. `getActivePromptConfig()` load từ DB, cache Redis, event `FORBIDDEN_WORDS_CHANGED` invalidate."*

### Q: "K8s rollout có làm sột cuộc họp không?"
> *"maxUnavailable: 0 + PDB minAvailable: 1 + graceful 30s drain. Socket reconnect auto (Socket.IO built-in), meeting state ở Redis nên pod mới pick up được. Recall WSS thì Recall retry."*

---

## 10. Metric & impact (neo business)

- **Latency phát hiện:** few seconds sau utterance (không phải post-meeting) → operator can thiệp real-time.
- **Cost LLM giảm ~90%** nhờ classical pre-filter.
- **Sole ship end-to-end** — từ Meet add-on tới K8s, không cần DevOps riêng.

---

## 11. Gap / debt (trung thực — interviewer thích)

- `@socket.io/redis-adapter` chưa wire → multi-pod broadcast là TODO.
- Cả BullMQ + RabbitMQ + Kafka dep tồn tại → consolidate messaging stack là cleanup kế tiếp.
- Gemini `thinkingBudget:0` đánh đổi accuracy → cần eval set để tune.

---

> **Câu chốt VNG:** *"InspectAI là bài toán real-time NLP với constraint cost + latency. Em giải bằng hybrid classical+LLM, BullMQ decouple, và sole-own K8s từ manifest tới Argo CD. Đúng kiểu AIT cần: AI tool cho team ops, tới khi họ dùng thật để giám sát cuộc họp."*
