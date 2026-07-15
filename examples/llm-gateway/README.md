# LLM Gateway — ví dụ tối thiểu

Ví dụ chạy được cho [mục 6 — LLM Gateway](../../docs/ai-engineering/06-streaming-multi-provider.md).
Một lớp mỏng đứng trước OpenAI/Google, gánh các mối lo **ngang** để app không lặp lại.

## Nó minh hoạ gì (map thẳng vào doc)

| Mối lo (doc) | Ở đâu trong code |
|---|---|
| Secret tập trung | App chỉ cầm `x-api-key` của gateway; key provider ở `.env`, app không thấy |
| Auth + registry per-app | `appByKey` + `.derive` trong `index.ts` |
| Rate limit / phút | `rateLimit` (`ratelimit.ts`, pure, có test) |
| Quota token / tháng | check `monthlyTokenBudget` trong `handle` |
| Multi-provider + fallback | `CHAIN` + vòng lặp fallback trong `handle` (Gemini → GPT) |
| Cost tracking | `estimateCost` + `bump` gom token/USD per app |
| Observability | `log` — 1 dòng JSON mỗi request |
| Dashboard-lite | `GET /metrics` |

## Chạy

```bash
bun install
cp .env.example .env   # điền key thật
bun run dev            # :4000
bun test               # check rate-limit
```

## Thử

```bash
# Team A (key-team-a)
curl -s localhost:4000/v1/chat -H 'x-api-key: key-team-a' \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"chào"}]}'

# Sai key → 401
curl -s localhost:4000/v1/chat -H 'x-api-key: nope' -d '{}'

# Cost/fallback per app
curl -s localhost:4000/metrics
```

## Cố tình bỏ (thêm khi cần)

- **Streaming** — ví dụ dùng `generateText` để cost-tracking gọn (usage có ở cuối). Bản stream: đổi sang `streamText` + `toDataStreamResponse`, cộng token ở callback `onFinish`.
- **Guardrail** (PII/moderation), **prompt template/version dùng chung** — chèn trước/sau `handle`.
- **RBAC, audit log, multi-tenant, HA** — nhắc trong doc; đây chỉ là lõi.
- State in-memory → prod thay Redis (limit) + Postgres (usage/audit). Đã đánh dấu `ponytail:` tại chỗ.
