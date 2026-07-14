# GenCodify Studio — Low-code Website Builder (Microservices)

> **Role:** Backend engineer — microservices architecture, AI service, deployment.
> **Stack:** NestJS · Nx monorepo · RabbitMQ + gRPC · PostgreSQL + pgvector · Redis · Firebase · S3/MinIO · Vercel AI SDK + Google Vertex · Yjs CRDT + Hocuspocus · Docker + K8s (GKE) · Bitbucket Pipelines.
> **Tại sao ăn điểm VNG AIT:** System design sâu (microservices + 3 transport khác nhau), **AI service tách riêng = đúng pattern "shared AI solution"**, RAG/memory tiered, CRDT collab.

---

## 1. Bài toán (elevator)

Low-code website builder: user mô tả yêu cầu bằng chat → AI sinh design + code → publish. Cần scale theo team, multi-user collab real-time, AI pipeline phức tạp (tool calling + memory + image gen).

> **Câu neo:** *"Hệ thống tách 8 microservices với 3 loại transport khác nhau — RabbitMQ cho CRUD, gRPC cho AI streaming, WebSocket cho collab. Em thiết kế AI service riêng để reuse cho nhiều product surface."*

---

## 2. Microservices architecture

| Service | Transport | Trách nhiệm |
|---|---|---|
| **api-gateway** | HTTP (4050) | Entry point, JWT auth, route tới RMQ/gRPC services |
| **identity** | RabbitMQ | Firebase auth, JWT issue, user/role/session, OTP |
| **ai** | **gRPC (50051)** | Chat, generation, tool calling, memory, RAG |
| **project** | RabbitMQ | Project/workspace/domain/font CRUD |
| **design** | **Hocuspocus WS (4002)** | Yjs CRDT collab (RabbitMQ **bị comment** — chỉ chạy collab) |
| **asset** | RabbitMQ | File upload S3, image processing, builder files |
| **worker** | RabbitMQ | Background jobs, mail, cron (scaffold) |

> **Trade-off ăn điểm:** *"Không dùng 1 transport cho tất cả. RabbitMQ không stream được — AI response là token-by-token nên phải gRPC server-streaming. Collab cần low-latency 2 chiều nên Hocuspocus WebSocket riêng."*

---

## 3. API Gateway

- HTTP server port 4050, global prefix `/apis`, CORS regex `gencodify.ai`.
- Register **4 ClientProxy RabbitMQ** + **1 gRPC client AI** trong `app.module.ts`.
- **JWT auth ở gateway** (không phải service): `JwtStrategy` passport-jwt HS256, check Redis blocklist `block:{token}`.
- Mỗi RMQ queue có `messageTtl` + `maxLength` (backpressure).

**Redis vai trò:** refresh token store, JWT blocklist khi logout, OTP cache 5 phút, email verify jti.

> **Câu đào:** *"Auth tập trung ở gateway để service tin tưởng gateway — không re-auth mỗi hop. Trade-off: gateway là SPOF cho auth, nhưng dễ horizontal scale."*

---

## 4. AI Service — điểm cốt lõi 🔥

### 4.1 CQRS (Command → Handler)
Controller gRPC nhận → `commandBus.execute(new UnifiedChatCommand(...))` → Handler → `aiService.unifiedChat()`. Commands: `unified-chat`, `stream-text`, `generate-object`, `generate-text`, `health-check`.

### 4.2 Vercel AI SDK + Google Vertex (KHÔNG native)
```ts
import { streamText, generateImage, Output } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
this.vertex = createVertex({ apiKey: process.env.GOOGLE_VERTEX_API_KEY });
```
Model: `GEMINI_2_5_FLASH`, `GEMINI_3_FLASH`, `IMAGEN_3` (image gen).

### 4.3 Tool calling (4 tools)
Registry tập trung `tools/index.ts` `createToolSet`:
- **pexelsSearch** — stock image search
- **analyzeImageRequirements** — decide khi nào cần ảnh
- **generateImage** — Imagen 3 + upload S3
- **updateDesignSystem** — persist design decision vào memory (Zod schema `category/confidence/reason`)

### 4.4 `unifiedChat` pipeline (entry point chính)
1. Load context (workingContext + recentHistory)
2. Build system prompt + design context
3. `streamText` với `tools` + `Output.object({schema})` + `stopWhen: stepCountIs(10)` (multi-step agent loop)
4. Emit `action_chunk` qua RxJS Observable
5. Save user/assistant message + increment message count (trigger distillation)

**Streaming:** gRPC server-streaming → Gateway expose **SSE** (`@Sse()` decorator). Lý do AI tách gRPC.

---

## 5. Memory / RAG — Tiered Memory System 🔥

**KHÔ dùng pgvector cho RAG chủ lực** (entity tồn tại nhưng memory service dùng **fact-based**).

### 3 tầng memory
| Tầng | Cấu hình | Vai trò |
|---|---|---|
| **Short-term** | 10 messages gần nhất chưa archived | Context gần |
| **Long-term facts** | `AiMemoryEntity` key-value, group theo category (STYLE/LAYOUT/FUNCTIONAL/BRAND/CONTENT), UPSERT atomic | Kiến thức stable về user |
| **Summary** | `conversation.lastSummary` | Distill old messages |

### Distillation pipeline (điểm hay)
Khi `messageCount >= 15` → async `distillHistory()`:
1. Mutex `distillationLocks: Set<string>` chống race.
2. **Trong 1 AI call làm 2 việc** (`generateSummaryWithFactCheck`): (a) summarize old messages, (b) **detect obsolete facts** → return `obsoleteKeys[]` → xóa facts cũ.
3. Archive old messages, reset count.

> **Trade-off ăn điểm:** *"Gọi AI summarize tốn token, nhưng tiết kiệm context window dài hạn. Em phát hiện facts cũ conflict với quyết định mới → AI tự detect obsolete trong cùng call — không cần 2 lần gọi."*

---

## 6. Design collab — CraftJS + Yjs CRDT + Hocuspocus

⚠️ **Debt quan trọng:** Design service `main.ts` có block RabbitMQ **bị comment out**. Service chỉ chạy Hocuspocus WebSocket server port 4002 khi `CollabService.onModuleInit()`.

```ts
this.hocuspocusServer = new Server({
  port: 4002,
  extensions: [
    new Database({
      fetch: async ({ documentName }) => repo.findOneBy({ id: documentName }),
      store: async ({ documentName, state }) => repo.save({
        designId: documentName,
        state: Buffer.from(state),  // Yjs Uint8Array → Postgres bytea
      }),
    }),
  ],
});
```

Yjs document state persist vào PostgreSQL `bytea`. Auth `onAuthenticate` **chưa secure** (comment out — TODO).

> **Câu đào:** *"Yjs CRDT cho multi-user edit concurrent — conflict-free. State là binary Uint8Array, persist bytea. Trade-off: không query được nội dung trực tiếp, phải deserialize."*

---

## 7. Auth flow — Identity + Firebase + JWT

```
Client (Firebase idToken) ──▶ Gateway ──RMQ──▶ Identity
                                              │ verifyIdToken (Firebase Admin)
                                              │ issueTokensAndCache:
                                              │   - access JWT HS256 {id, roleIds, sessionId}
                                              │   - refresh JWT {sessionId, hash, jti}
                                              └─ cache refresh:{userId} Redis
```

- **Token issuance ở Identity, validation ở Gateway.**
- **OTP brute-force protection:** max 5 attempts, `timingSafeEq` chống timing attack.
- **Refresh rotation:** old refresh token add blocklist sau khi issue mới.

> **Câu neo:** *"Firebase cho social login (Google), JWT cho app session. Gateway validate 1 lần, service tin tưởng. Logout = blocklist token Redis với TTL = expiry."*

---

## 8. Asset / File storage

**S3-compatible** (`@gencodify/s3-storage`): `@aws-sdk/client-s3` với `forcePathStyle` + custom endpoint → MinIO hoặc S3 thật.

- **Context-based storage** enum: `PROJECT/WORKSPACE/SYSTEM/PUBLIC/TEMP`.
- **Multipart upload** cho file >100MB (partSize 10MB, `@aws-sdk/lib-storage`).
- **Image processing** đa size variants qua `sharp` (`AssetSize` enum).
- **Builder files** upload song song (concurrency 5), detect `index.html` → `indexUrl` để deploy static site.
- **Presigned URL** download (expiresIn 3600s) — đúng [Case 7](../case-studies/presigned-url-upload.md).
- **CDN:** ưu tiên `cloudfrontDomain` → fallback S3 endpoint.

---

## 9. Infra & deployment

| Khía cạnh | Chi tiết |
|---|---|
| **Docker** | Multi-stage `base → deps → builder (pnpm nx build) → production`, `ARG APP_NAME` mỗi service, cache pnpm |
| **Compose** | `docker-compose.cloud.yml`: 9 service network `gencodify-network` (subnet `168.25.0.0/24`), image từ GCP Artifact Registry |
| **CI/CD** | Bitbucket Pipelines, branch `main`: 7 service build song song → push Artifact Registry → `kubectl set image` + `rollout status` |
| **K8s** | Namespace `gencodify-core`, deploy qua `kube-config.yaml` từ secret |

> **⚠️ Sửa claim:** KHÔ phải ECR (AWS) — là **GCP Artifact Registry**. KHÔ phải "Rancher 3 namespace" — pipeline deploy **1 namespace** `gencodify-core`. (Candidate hay over-claim — phải chính xác.)

---

## 10. Câu hỏi đào sâu 🔥

### Q: "Tại sao AI dùng gRPC, CRUD dùng RabbitMQ?"
> *"RabbitMQ là request-response message queue — không stream được. AI response là token-by-token (streaming), cần gRPC server-streaming. Gateway expose SSE cho browser. Còn CRUD là one-shot request/response → RabbitMQ đủ + có DLQ/retry."*

### Q: "Memory distillation gọi AI tốn token — đáng không?"
> *"Đáng vì: (1) tránh context window phình → mỗi chat call đắt hơn nhiều lần nếu không distill; (2) detect obsolete facts trong cùng call → tiết kiệm 1 lần gọi riêng. Mutex chống race khi 2 request concurrent trigger distill."*

### Q: "Design service RabbitMQ bị comment — sao để vậy?"
> *"Debt thừa nhận. Service thực tế chỉ serve collab qua Hocuspocus. Design CRUD hiện route gateway trực tiếp qua service instance (không qua queue). Consolidate là cleanup kế tiếp — hoặc wire lại RMQ hoặc tách service design-crud vs design-collab."*

### Q: "Multi-tenant isolation thế nào?"
> *"Mỗi service DB schema riêng (database-per-service pattern). Data isolation theo `workspaceId`/`projectId` ở query layer. RBAC qua role + permission table. Trade-off: cross-tenant query khó — nhưng security boundary rõ."*

### Q: "Module Federation — em làm micro-frontend?"
> *"BE-only repo này — FE builder (CraftJS UI) ở repo riêng. Module Federation nếu có là ở FE. Em focus BE: gRPC/RMQ transport, AI service, collab."* (Trung thực — đừng over-claim.)

### Q: "Yjs CRDT vs OT (Operational Transform)?"
> *"CRDT (Yjs) không cần central server resolve conflict — math guarantee converge. OT (Google Docs) cần server authoritative transform. CRDT tốt cho P2P/decentralized + offline; OT tốt cho strong central control. Em chọn Yjs vì Hocuspocus support sẵn + offline-friendly."*

### Q: "pgvector có dùng không?"
> *"Entity `RagChunkEntity` với vector column tồn tại, nhưng memory service thực tế dùng **fact-based** (key-value UPSERT theo category), không phải similarity search. Vector search là path khác có thể activate cho semantic recall. Em nói rõ cái nào active."*

---

## 11. Gap / debt (trung thực)

- Design service RabbitMQ comment + auth `onAuthenticate` TODO.
- Worker service phần lớn scaffold — `CronService` rỗng.
- `@gencodify/gencodify-plugin` (CLAUDE.md nhắc) không tìm thấy trong `libs/`.
- Socket.IO gateway legacy (`/sockets` namespace) cho IoT sync, không phải design collab — 2 hệ thống song song.

---

## 12. Metric & impact

- **8 microservices** tách biệt, deploy độc lập, scale theo tải riêng.
- **AI service reuse** cho nhiều surface (chat, generate, image) — đúng pattern shared AI.
- **Tiered memory** giữ context window gọn → cost LLM tối ưu.

---

> **Câu chốt VNG:** *"GenCodify là bài toán system design microservices với AI ở giữa. Em tách AI service riêng (gRPC streaming), CRUD qua RabbitMQ, collab qua WebSocket — 3 transport vì 3 nhu cầu khác nhau. Memory tiered + distillation là bài tối ưu context/cost. Đúng kiểu AIT cần: shared AI service cho nhiều product surface."*
