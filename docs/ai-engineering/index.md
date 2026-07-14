# 🤖 AI Engineering — Nền tảng phỏng vấn GenAI/LLM

> Bộ tài liệu này dành cho các role **AI Engineer / AI Solution / LLM Application** (ví dụ CMC Global AI Solution). File này dạy bạn **trả lời sâu** khi người phỏng vấn đào từ "em có dùng ChatGPT/Vercel AI SDK" xuống tới "vector DB chọn thế nào, hallucination xử lý ra sao, cost tối ưu kiểu gì".

## Bối cảnh

Khác với backend/frontend truyền thống, phỏng vấn AI Engineer xoay quanh việc **ghép LLM vào sản phẩm thật**: không phải train model, mà là **dùng model của người khác một cách đúng, an toàn, rẻ và đo được**. Có **6 trụ cột** gần như chắc chắn bị hỏi:

| Trụ cột | Câu hỏi hay bị đào | Đọc file |
|---|---|---|
| LLM hoạt động thế nào | "Token là gì? Context window? Temperature? Vì sao model bịa?" | [01 — LLM Fundamentals](./01-llm-fundamentals.md) |
| Prompt Engineering | "Few-shot vs zero-shot? System prompt để làm gì? Structured output?" | [02 — Prompt Engineering](./02-prompt-engineering.md) |
| RAG | "RAG là gì? Chunking thế nào? Vector DB chọn ra sao? Rerank?" | [03 — RAG](./03-rag.md) |
| Agent & Tool Calling | "Agent khác chatbot chỗ nào? Function calling? MCP là gì?" | [04 — Agents & Tool Calling](./04-agents-tool-calling.md) |
| Production | "Đo chất lượng thế nào? Chống prompt injection? Giảm cost/latency?" | [05 — Evaluation, Guardrails & Production](./05-evaluation-guardrails-production.md) |
| Streaming & Multi-Provider | "Streaming/SSE thế nào? Tích hợp OpenAI/Anthropic/Google? Fallback? LLM Gateway?" | [06 — Streaming & Multi-Provider](./06-streaming-multi-provider.md) |

## Cách dùng bộ này

1. Đọc lần lượt 01 → 06, mỗi câu vẫn theo cấu trúc quen thuộc của cả site: **Định nghĩa ngắn → Giải thích sâu → Bẫy & câu hỏi nối tiếp**.
2. Ký hiệu 🔥 = câu cực hay gặp, ưu tiên thuộc.
3. Mục tiêu là **giải thích được trade-off**, không chỉ kể tên công cụ.

## Liên quan

- [PoC AI Builder](../poc-ai-builder/index.md) — dự án RAG + MCP chạy được, minh chứng thực tế cho phần lý thuyết này.
- [CV — CMC Global AI Solution](../cv/cmc-global-ai-solution.md) — chiến lược pitch cho role AI.
- [CV — VNGGames AIT](../cv/interview_prep_vnggames.md) — role AI-Native fullstack; §4 (LLM engineering) là nguồn cho chương [06 — Streaming & Multi-Provider](./06-streaming-multi-provider.md).
- [Backend — Databases](../backend/01-databases.md) — nền tảng pgvector/index sâu hơn.
