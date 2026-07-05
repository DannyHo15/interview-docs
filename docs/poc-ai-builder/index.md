# RAG + MCP — AI Builder POC

A small, **runnable** portfolio project demonstrating the "AI Builder / AI Solution"
skill set the CMC Global role asks for:

- **RAG** (Retrieval-Augmented Generation) over a **pgvector** Postgres store
- **Hybrid retrieval**: vector (cosine over HNSW) + keyword (ts_rank), fused via **RRF**
- **PII guardrail** (Microsoft Presidio + deterministic regex fallback) on **both** the
  query and the generated answer
- An **MCP server** (Model Context Protocol) exposing the knowledge base as tools that
  Claude Code / Claude Desktop can call directly
- A **FastAPI** HTTP surface for the same operations
- **Dependency injection** so the whole suite is unit-tested with fakes — **tests pass
  with no API key and no database**

The domain is intentionally concrete (semiconductor fab documents with planted PII) so
the guardrail has something to redact.

---

## Architecture

```
            ┌───────────────┐    stdio     ┌─────────────────────────┐
  Claude ─► │  MCP server   │ ───────────► │                         │
  Code      │ (mcp_server)  │              │                         │
            └───────────────┘              │      RAGService         │
                                           │  (chunk → embed →       │
            ┌───────────────┐   HTTP       │   retrieve → guardrail  │
  REST  ──► │   FastAPI     │ ───────────► │   → generate)           │
            │   app/api.py  │              │                         │
            └───────────────┘              └───────────┬─────────────┘
                                                        │
                          ┌──────────────┬──────────────┼──────────────┐
                          ▼              ▼              ▼              ▼
                    GeminiEmbedder   GeminiLLM    PIIGuardrail    Postgres +
                    (text-           (gemini-     (Presidio +     pgvector
                     embedding-004)   2.0-flash)   regex)         (HNSW + GIN)
```

```
app/
├── config.py      pydantic-settings (.env loader)
├── chunking.py    pure text→chunks  (unit-tested)
├── guardrail.py   PII detect+redact (Presidio + regex fallback)
├── embeddings.py  Gemini embed client (google-genai)
├── llm.py         Gemini generate client (google-genai)
├── db.py          asyncpg + pgvector: hybrid search, RRF-ready hits
├── rag.py         RAGService: ingest / retrieve / ask  (DI-friendly)
└── api.py         FastAPI: /health /documents /ingest /ask
mcp_server/
└── server.py      MCP server: tools ask_rag / search_docs / ingest_doc / list_docs
scripts/
├── init_db.py     create/verify schema
└── ingest.py      bulk-ingest a folder of .txt docs
tests/             no-key, no-DB unit + integration tests
```

---

## Quickstart

### 1. Prerequisites

- Python 3.11+
- Docker (for Postgres + pgvector)
- A Google AI Studio **Gemini API key** (free tier works) for real runs

### 2. Install

```bash
make venv          # create .venv
make install       # pip install -r requirements.txt
cp .env.example .env
# edit .env: paste GEMINI_API_KEY=...
```

### 3. Run the database

```bash
make up            # docker compose up -d  (pgvector on :5432)
make init          # create schema (CREATE EXTENSION vector; + table + indexes)
```

### 4. Ingest the sample docs

```bash
make ingest        # embeds sample_docs/*.txt and stores them
```

### 5. Use it — pick one of three surfaces

**FastAPI (REST):**
```bash
make serve         # uvicorn app.api:app --reload  →  http://localhost:8000/docs
```

**MCP server (for Claude Code / Claude Desktop):**
```bash
make mcp           # python -m mcp_server.server  (stdio transport)
```
Then add to your client config:
```jsonc
{
  "mcpServers": {
    "rag-builder-poc": {
      "command": "python",
      "args": ["-m", "mcp_server.server"],
      "cwd": "/absolute/path/to/poc-ai-builder",
      "env": { "GEMINI_API_KEY": "..." }
    }
  }
}
```

**Tests (no key, no DB needed):**
```bash
make test
```

---

## Tests — designed to pass without a key or DB

The RAGService takes its dependencies by injection, so the test suite fakes the
embedder, LLM, and database. This proves the logic (chunking, hybrid fusion, RRF,
two-sided PII redaction) without spending tokens or needing Docker:

| Test file            | What it locks down                                         |
|----------------------|------------------------------------------------------------|
| `test_chunking.py`   | boundary-aware splits, overlap, no dropped content         |
| `test_guardrail.py`  | regex redacts email / VN+US phone / employee & ticket IDs  |
| `test_rag_mock.py`   | RRF dedup, **query-side + answer-side** PII redaction, ingest flow |

```
pytest
# ===== 13 passed in \&lt;1s =====
```

---

## Why this stack (mapped to the job)

| Job ask                              | Where this POC shows it                          |
|--------------------------------------|--------------------------------------------------|
| RAG / Knowledge Layer                | `rag.py` hybrid retrieve + RRF, `db.py` pgvector |
| LLM integration (Gemini / Vertex)    | `embeddings.py`, `llm.py` (google-genai SDK)     |
| AI security (PII, prompt injection)  | `guardrail.py` two-sided redaction, citation-only grounding |
| MCP / Claude Code / agentic tooling  | `mcp_server/server.py` — 4 tools, stdio transport |
| Production Python (FastAPI, async)   | `api.py` lifespan, asyncpg pool, settings via env |
| Engineering rigor (tests, DI)        | `tests/` pass with **no key / no DB**            |

---

## Configuration

`.env` (see `.env.example`):

| Var                | Default                              | Meaning                         |
|--------------------|--------------------------------------|---------------------------------|
| `GEMINI_API_KEY`   | _(empty)_                            | Google AI Studio key            |
| `DATABASE_URL`     | `postgresql://rag:rag@localhost:5432/rag` | pgvector DSN               |
| `EMBEDDING_MODEL`  | `text-embedding-004`                 | embedder (768-dim)              |
| `EMBEDDING_DIM`    | `768`                                | must match schema `vector(768)` |
| `GEN_MODEL`        | `gemini-2.0-flash`                   | generation model                |
| `TOP_K`            | `5`                                  | chunks returned per query       |
| `RERANK_WITH_LLM`  | `false`                              | reserved for a rerank stage     |

---

## Notes & next steps

- **Rerank**: `RERANK_WITH_LLM` is reserved. A production add-on would re-rank the
  RRF top-N with a cross-encoder before grounding.
- **Eval**: the natural next piece is a RAGAS-style eval harness (faithfulness /
  answer-relevancy / context-precision) over a golden Q&A set.
- **Agent Ops**: latency / cost / drift telemetry can be layered in `RAGService.ask`.
- The PII guardrail deliberately degrades gracefully: if Presidio's spaCy model isn't
  installed, it falls back to regex so the service never hard-fails on a missing dep.
