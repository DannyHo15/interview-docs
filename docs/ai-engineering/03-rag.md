# 📚 03 — RAG (Retrieval-Augmented Generation)

> RAG là câu hỏi trung tâm của mọi phỏng vấn AI Solution. Bạn có [PoC RAG + MCP chạy được](../poc-ai-builder/index.md) — hãy dùng nó làm ví dụ thật khi trả lời. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. RAG là gì và giải quyết vấn đề gì? 🔥

**Định nghĩa ngắn:** **RAG** = trước khi hỏi LLM, ta **truy xuất** (retrieve) các đoạn tài liệu liên quan từ kho riêng, rồi **nhét vào context** để model trả lời dựa trên chúng. "Đưa sách mở cho model tra" thay vì bắt nó nhớ.

**Giải thích sâu:**

- Giải 2 vấn đề lớn của LLM thuần: (1) **không biết dữ liệu riêng/mới** (knowledge cutoff), (2) **hay bịa**. RAG đưa nguồn thật vào → trả lời cập nhật và có thể trích dẫn.
- Cập nhật kiến thức = **thêm/sửa tài liệu**, không cần train lại model → rẻ và nhanh, đây là lý do RAG thắng fine-tune cho dữ liệu hay đổi.

**Luồng end-to-end — nhớ hình này là nắm cả bài:**

```text
① INGEST (làm một lần, offline):
   Tài liệu ──► Chunk ──► Embed ──► Lưu Vector DB (kèm metadata)

② QUERY (mỗi câu hỏi, real-time):
   Câu hỏi ──► Embed ──► Tìm top-k đoạn gần nhất ──► (Rerank)
           ──► Nhét đoạn vào prompt ──► LLM sinh câu trả lời + trích nguồn
```

- **Ingest** dựng sẵn kho tri thức; **Query** dùng lại kho đó cho từng câu hỏi.
- Mấu chốt: câu hỏi và tài liệu phải đi qua **cùng một embedding model** thì mới so được (xem mục 3).
- Mỗi bước trong luồng là một chỗ có thể hỏng → cũng là một chỗ để tối ưu. Các mục dưới đi lần lượt từng bước.

**Cả bước Query gói trong ~12 dòng (Vercel AI SDK):**

```ts
import { embed, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 1. Embed câu hỏi (cùng model đã dùng lúc ingest)
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: question,
});

// 2. Tìm top-k đoạn gần nhất trong vector DB (xem mục 4)
const chunks = await searchVectorDB(embedding, { topK: 5 });

// 3. Nhét context vào prompt, buộc LLM bám nguồn
const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  system: 'Chỉ trả lời dựa trên CONTEXT. Không có thì nói "không tìm thấy". Luôn trích nguồn.',
  prompt: `CONTEXT:\n${chunks.map((c) => c.content).join('\n---\n')}\n\nCÂU HỎI: ${question}`,
});
```

**Bẫy thường gặp:**

- Nghĩ RAG là một model — không, nó là **kiến trúc** ghép retrieval + generation.
- **Câu hỏi nối tiếp:** *"RAG có làm hết hallucination?"* → Giảm mạnh nhưng nếu **retrieve sai đoạn**, model vẫn bịa trên đoạn sai. Chất lượng RAG = chất lượng retrieval trước tiên.

---

## 2. Chunking — cắt tài liệu thế nào? 🔥

**Định nghĩa ngắn:** **Chunking** là cắt tài liệu dài thành các đoạn nhỏ để embed và truy xuất. Kích thước & cách cắt ảnh hưởng trực tiếp tới chất lượng.

**Vì sao quan trọng:** cắt sai → retrieve sai → cả RAG hỏng. Có **hai nguyên tắc gốc**, phần còn lại chỉ là cách thực hiện chúng:

1. **Đừng cắt giữa câu/ý.**
2. **Một chunk chỉ nên chứa một chủ đề.**

### Nhìn ví dụ trước — cắt ẩu vs cắt khéo

Cùng một tài liệu chính sách ngắn:

```markdown
# Chính sách đổi trả
Khách được đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.
Sản phẩm phải còn nguyên tem và hóa đơn.

# Phí vận chuyển
Đơn trên 500k được miễn phí ship.
Đơn dưới 500k tính phí 30k toàn quốc.
```

**❌ Cắt ẩu — fixed-size** (cắt cứng ~60 ký tự, kệ nghĩa):

```text
Chunk 1: "# Chính sách đổi trả\nKhách được đổi trả trong vòng 30 ngày kể từ"
Chunk 2: " ngày nhận hàng.\nSản phẩm phải còn nguyên tem và hóa đơn.\n\n# Phí"
Chunk 3: " vận chuyển\nĐơn trên 500k được miễn phí ship.\nĐơn dưới 500k tính..."
```

Hai lỗi: (1) "…30 ngày kể từ **ngày nhận hàng**" bị cắt đôi giữa chunk 1–2; (2) chunk 2 **trộn hai chủ đề** (đổi trả + phí ship). Hỏi *"đơn 400k phí ship bao nhiêu?"* dễ trúng nhầm chunk 2.

**✅ Cắt khéo — theo cấu trúc** (mỗi heading = 1 chunk):

```text
Chunk 1  (heading = "Chính sách đổi trả"):
  "Khách được đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.
   Sản phẩm phải còn nguyên tem và hóa đơn."

Chunk 2  (heading = "Phí vận chuyển"):
  "Đơn trên 500k được miễn phí ship. Đơn dưới 500k tính phí 30k toàn quốc."
```

Mỗi chunk **trọn một ý**, kèm metadata heading để lọc/trích nguồn. Hỏi phí ship → trúng thẳng chunk 2. Đây thường là kết quả retrieval tốt nhất cho docs có cấu trúc.

### Kích thước bao nhiêu là vừa?

- **Quá to** (cả trang): vector loãng nghĩa, tốn token, kéo theo nhiễu.
- **Quá nhỏ** (một câu trơ): mất ngữ cảnh, câu trả lời cụt.
- Khởi đầu thực dụng: **~200–500 token/chunk**. Không có con số vàng — phải **đo bằng eval retrieval** rồi mới chỉnh (xem mục 6).

### Các cách cắt phổ biến

| Cách | Size ổn định? | Giữ ngữ nghĩa? | Chi phí | Khi nào dùng |
|---|---|---|---|---|
| **Fixed-size** (cắt cố định N token/ký tự) | ✅ | ❌ | Rẻ | Baseline, văn bản đồng nhất |
| **Recursive** (đa tầng separator `\n\n` → `\n` → `. ` → space) | ✅ | Trung bình | Rẻ | Default, đa số trường hợp; mặc định LangChain |
| **Structure-aware** (theo heading Markdown / thẻ HTML / AST code) | ❌ | ✅ | Rẻ | Docs có cấu trúc — thường cho retrieval tốt nhất |
| **Sentence-based** (nhóm N câu/chunk) | ✅ | Trung bình | Rẻ | FAQ, văn bản ngắn |
| **Semantic** (embed từng câu → cắt khi similarity giảm đột ngột) | ❌ | ✅✅ | Vừa | Văn bản tự do, dài; tôn trọng ranh giới chủ đề |
| **Late chunking** (embed cả doc bằng long-context model rồi mới cắt) | — | ✅✅ | Cao | Cần giữ context toàn cục cho từng chunk |
| **Agentic** (LLM tự quyết chỗ cắt) | ❌ | ✅✅✅ | Đắt | PoC, dữ liệu phức tạp; hiếm dùng production |

Đọc bảng theo nhu cầu: **recursive** là default an toàn; có heading/HTML/code thì lên **structure-aware**; văn bản tự do dài thì cân nhắc **semantic**. Late/agentic để dành khi thật sự cần.

### Hai kỹ thuật gần như luôn nên bật

**① Overlap — chống mất ngữ cảnh ở ranh giới.** Cho hai chunk liền nhau **lặp ~10–20%** phần giáp ranh, để câu bị cắt không mất nghĩa.

Đoạn gốc: *"…Bảo hành 12 tháng. Không áp dụng cho lỗi do người dùng như rơi vỡ, vào nước."*

```text
KHÔNG overlap:
  Chunk A: [... Bảo hành 12 tháng.]
  Chunk B: [Không áp dụng cho lỗi do người dùng như rơi vỡ, vào nước.]

CÓ overlap (câu cuối của A lặp sang đầu B):
  Chunk A: [... Bảo hành 12 tháng.]
  Chunk B: [Bảo hành 12 tháng. Không áp dụng cho lỗi do người dùng như rơi vỡ...]
```

Hỏi *"rơi vỡ có được bảo hành không?"*: bản không overlap trúng chunk B nhưng **mất chủ ngữ "bảo hành"** → trả lời cụt/sai. Overlap kéo câu "Bảo hành 12 tháng." sang B → giữ liên kết.

**② Parent-child (small-to-big) — nhỏ để tìm, to để trả lời.** Index bằng **câu nhỏ** cho match chính xác, nhưng đưa cho LLM cả **đoạn cha lớn** để đủ ngữ cảnh — gỡ được thế kẹt "chunk nhỏ thì chính xác nhưng thiếu ngữ cảnh".

- **Tìm** bằng câu nhỏ: *"Đơn dưới 500k tính phí 30k toàn quốc."* trúng thẳng *"ship đơn 300k bao nhiêu?"*.
- **Trả lời** bằng cả mục cha *"Phí vận chuyển"* (gồm cả điều kiện miễn phí trên 500k) → không thiếu vế.

### Công thức chọn nhanh

1. Bắt đầu **recursive + overlap**, size ~300 token.
2. Docs có heading/cấu trúc → đổi sang **structure-aware**.
3. **Đo recall** trên bộ câu hỏi thật.
4. Chưa đạt → thử **parent-child**, chỉnh size/overlap, hoặc **semantic** cho văn bản tự do. Đừng optimize sớm khi baseline chưa đo.

**Bẫy thường gặp:**

- Cắt cứng theo số ký tự giữa câu → chunk vô nghĩa. Luôn ưu tiên ranh giới ngữ nghĩa (câu/đoạn/heading).
- Nhảy vào semantic/late/agentic chunking ngay từ đầu — đắt và chưa cần; baseline thường đã đủ.
- **Câu hỏi nối tiếp:** *"Chọn chunk size bằng cách nào?"* → Không có con số vàng; thử nhiều size và **đo bằng eval retrieval** (câu này có lấy đúng đoạn không).
- **Câu hỏi nối tiếp:** *"Semantic khác recursive chỗ nào?"* → Recursive cắt theo **quy tắc** (separator cố định); semantic cắt theo **độ đổi chủ đề** đo bằng embedding — tự nhiên hơn nhưng tốn compute và size không đều.

---

## 3. Embedding — biến text thành vector 🔥

**Định nghĩa ngắn:** **Embedding model** biến mỗi chunk (và câu hỏi) thành một **vector số** sao cho **gần nghĩa → gần nhau** trong không gian vector. Đây là thứ giúp search "theo ý nghĩa" thay vì khớp từ khóa.

**Giải thích sâu:**

- **Cùng một model cho cả index lẫn query — bắt buộc.** Embed tài liệu bằng model A mà embed câu hỏi bằng model B thì vector **không so sánh được**, retrieve ra rác.
- Chọn model theo 4 tiêu chí:
  - **Chất lượng** — tham khảo bảng xếp hạng **MTEB**; nhưng luôn test trên dữ liệu thật của bạn.
  - **Đa ngôn ngữ** — quan trọng với **tiếng Việt**: chọn model multilingual (vd `multilingual-e5`, `bge-m3`, OpenAI `text-embedding-3-large`).
  - **Chiều (dimension)** — vd 768 / 1536 / 3072. Cao hơn = giàu nghĩa hơn nhưng **tốn RAM và search chậm hơn**. Một số model cho cắt bớt chiều (Matryoshka) để đổi chất lượng lấy tốc độ.
  - **Context length của embedding** — chunk dài hơn giới hạn model sẽ bị cắt cụt khi embed → mất thông tin. Chunk size (mục 2) phải khớp giới hạn này.
- Ví dụ model hay dùng: OpenAI `text-embedding-3-small` (rẻ) / `-large` (mạnh), Google `text-embedding-004`, open-source `bge`, `e5`.

```ts
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const model = openai.embedding('text-embedding-3-small'); // DÙNG CHUNG index & query

// Ingest: embed nhiều chunk một lần (rẻ hơn gọi lẻ)
const { embeddings } = await embedMany({ model, values: chunks });

// Query: embed câu hỏi bằng ĐÚNG model đó
const { embedding: queryVec } = await embed({ model, value: question });
```

**Bẫy thường gặp:**

- **Đổi embedding model = phải re-embed lại TOÀN BỘ kho.** Không thể trộn vector cũ (model A) với vector mới (model B). Đây là chi phí ẩn khi "nâng cấp model".
- Chunk dài hơn context của embedding model → phần đuôi bị bỏ khi embed mà không báo lỗi → chunk "mất nghĩa" âm thầm.
- **Câu hỏi nối tiếp:** *"Tiếng Việt nên chọn embedding nào?"* → Model đa ngữ (`multilingual-e5`, `bge-m3`, hoặc OpenAI 3-large). Đừng dùng model chỉ train tiếng Anh — tiếng Việt sẽ embed kém, retrieve tệ.

---

## 4. Vector database — chọn cái nào? 🔥

**Định nghĩa ngắn:** Vector DB lưu embedding và tìm **k vector gần nhất** (ANN — approximate nearest neighbor) cực nhanh, thay vì so sánh tuần tự toàn bộ.

**Giải thích sâu:**

| Lựa chọn | Khi nào chọn |
|---|---|
| **pgvector** (Postgres) | Đã dùng Postgres, muốn 1 DB cho cả quan hệ + vector, đội nhỏ. Đây là lựa chọn của PoC. |
| **Pinecone / managed** | Không muốn tự vận hành, cần scale lớn, sẵn tiền |
| **Qdrant / Weaviate / Milvus** | Cần tính năng vector chuyên sâu, self-host, filter phức tạp |

- **Vì sao cần "index"?** Kho có thể hàng triệu vector — so câu hỏi với **từng** cái thì quá chậm. **ANN** (Approximate Nearest Neighbor = "tìm hàng xóm gần đúng") bỏ qua hầu hết vector, chỉ xét vùng có khả năng gần → nhanh gấp nhiều lần, đổi lại thỉnh thoảng bỏ sót vài kết quả (chấp nhận được cho search ngữ nghĩa).
- **HNSW, IVF là gì?** Chỉ là hai cách dựng "bản đồ đường tắt" giúp nhảy nhanh tới vùng gần. Nhớ gọn: **HNSW là loại phổ biến nhất — nhanh và chính xác, đổi lại tốn RAM.** Chỉnh tham số của nó thực chất là cân **3 thứ đối nghịch**: nhanh hơn ↔ ít bỏ sót hơn ↔ tốn ít RAM hơn — được cái này thường mất cái kia.
- **"Gần nhau" đo bằng cosine similarity:** xem hai vector có **cùng hướng** không. Càng cùng hướng càng gần nghĩa — **1 = trùng ý, 0 = chẳng liên quan**. Đây là thước đo mặc định cho text.
- **Metadata filtering — lọc bằng điều kiện thường, không phải vector.** Mỗi chunk lưu thêm nhãn (nguồn, phòng ban, ngày, ai được xem). Lúc search ép thêm điều kiện, vd "chỉ tìm trong tài liệu user này được phép đọc" — đúng dòng `WHERE metadata->>'team' = 'live-ops'` ở snippet trên. Hay bị bỏ quên nhưng cực cần cho production (phân quyền, lọc nhiễu).

```sql
-- Bảng lưu chunk + vector (pgvector)
CREATE TABLE docs (
  id        bigserial PRIMARY KEY,
  content   text,
  metadata  jsonb,               -- nguồn, heading, quyền xem...
  embedding vector(1536)         -- khớp dimension của embedding model
);

-- Index ANN (HNSW) để search nhanh theo cosine
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);

-- Query: top-5 gần nhất; <=> là toán tử cosine distance, $1 = vector câu hỏi
SELECT content, metadata, 1 - (embedding <=> $1) AS score
FROM docs
WHERE metadata->>'team' = 'live-ops'   -- metadata filter: chỉ tài liệu được phép
ORDER BY embedding <=> $1
LIMIT 5;
```

**Bẫy thường gặp:**

- Chọn Pinecone cho POC nhỏ trong khi đã có Postgres → pgvector đủ và đơn giản hơn nhiều. Đừng thêm hạ tầng khi chưa cần.
- **Câu hỏi nối tiếp:** *"HNSW là gì?"* → đồ thị "small-world" nhiều tầng cho ANN; nhanh và recall cao, đổi lại tốn RAM và build index lâu hơn.
- **Câu hỏi nối tiếp:** *"ANN khác brute-force chỗ nào?"* → ANN tìm **gần đúng** (bỏ qua phần lớn vector) nên nhanh hơn nhiều, đổi lại có thể bỏ sót vài kết quả — chấp nhận được cho search ngữ nghĩa.

---

## 5. Nâng chất lượng retrieval — hybrid, rerank & query 🔥

**Định nghĩa ngắn:** Vector search giỏi ngữ nghĩa nhưng **dở với từ khóa chính xác** (mã sản phẩm, tên riêng, số hiệu). Ba đòn nâng chất lượng: **hybrid** (ghép vector + keyword), **rerank** (xếp lại cho đúng), **query transformation** (sửa câu hỏi trước khi search).

**① Hybrid search:**

- Chạy song song **vector** (nghĩa) + **keyword/BM25** (từ khóa), rồi **hợp nhất** kết quả — thường bằng **RRF (Reciprocal Rank Fusion)** như trong PoC. Bắt được cả "ý gần nghĩa" lẫn "trùng mã chính xác".
- **RRF hoạt động sao?** Mỗi tài liệu nhận điểm theo **thứ hạng** ở từng danh sách (`1/(k+rank)`), cộng lại. Ưu điểm: không cần chuẩn hóa điểm số khác thang giữa hai hệ.

```ts
// Gộp nhiều danh sách xếp hạng (vd [vectorIds, keywordIds]) thành 1 điểm chung
function reciprocalRankFusion(rankings: string[][], k = 60): Map<string, number> {
  const scores = new Map<string, number>();
  for (const list of rankings) {
    list.forEach((id, rank) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1)); // rank 0-indexed
    });
  }
  return scores; // sort giảm dần → lấy top-k
}
```

**② Reranking:**

- Lấy top ~50 ứng viên rồi cho một **cross-encoder** (model chuyên chấm độ liên quan câu hỏi–đoạn) xếp lại, giữ top ~5 đưa vào LLM. Chính xác hơn nhiều so với chỉ cosine, đổi lại thêm latency/cost.
- Trình tự thực dụng: **retrieve rộng (recall cao) → rerank hẹp (precision cao) → generate**.

**③ Query transformation — sửa câu hỏi trước khi search:**

Câu hỏi người dùng thường ngắn, mơ hồ, hoặc dùng từ khác tài liệu → retrieve kém dù kho tốt. Biến đổi query trước:

- **Query rewriting:** LLM viết lại câu hỏi rõ ràng hơn, hoặc tách câu hỏi nhiều phần thành các câu con.
- **Multi-query:** sinh vài biến thể của câu hỏi, retrieve tất cả rồi gộp → **tăng recall** khi cách diễn đạt lệch nhau.
- **HyDE** (Hypothetical Document Embeddings): cho LLM viết một **câu trả lời giả định**, rồi embed *câu trả lời đó* để search (thay vì embed câu hỏi) — vì một "đoạn trả lời" nằm gần tài liệu hơn một "câu hỏi".

**Bẫy thường gặp:**

- Chỉ dựa vector rồi than "hỏi mã SKU không ra" — đó là lúc cần hybrid.
- Query transformation mỗi bước tốn **thêm một lần gọi LLM** (latency + cost) → chỉ thêm khi retrieval thật sự yếu, đừng bật mặc định.
- **Câu hỏi nối tiếp:** *"Retrieval yếu thì nâng theo thứ tự nào?"* → Rẻ→đắt: chỉnh chunking/embedding trước → thêm hybrid → thêm rerank → cuối cùng mới query transformation. Đo lại sau mỗi bước.

---

## 6. Đánh giá một hệ RAG 🔥

**Định nghĩa ngắn:** RAG có **2 tầng phải đo riêng**: **retrieval** (có lấy đúng đoạn không) và **generation** (câu trả lời có đúng & bám nguồn không).

**Giải thích sâu:**

- **Retrieval:** *recall@k* / *precision@k* — trong top-k có đoạn chứa đáp án không. Nếu tầng này hỏng thì generation vô nghĩa.
- **Generation:** **faithfulness/groundedness** (câu trả lời có đúng theo đoạn được đưa, không bịa ngoài nguồn), **answer relevance** (có trả lời đúng câu hỏi). Thường dùng **LLM-as-judge** + bộ câu hỏi vàng.
- Công cụ hay nhắc: **RAGAS**, hoặc tự viết eval set. Điểm chốt: **đo được thì mới cải tiến được**.

**Bẫy thường gặp:**

- Chỉ nhìn câu trả lời cuối mà không tách tầng → không biết lỗi do lấy sai đoạn hay do model diễn giải sai.
- **Câu hỏi nối tiếp:** *"Người dùng than trả lời sai, debug từ đâu?"* → Kiểm **retrieval trước**: đoạn đúng có nằm trong top-k không? Nếu không → sửa chunking/embedding/hybrid. Nếu có mà vẫn sai → sửa prompt/model.

---

## 7. Khi nào RAG *không* phải câu trả lời

- Câu hỏi cần **tổng hợp toàn bộ tài liệu** (ví dụ "tóm tắt cả 300 trang") → top-k đoạn không đủ; cần summarization theo cấp bậc (map-reduce), không phải RAG thuần.
- Dữ liệu **nhỏ và tĩnh**, vừa context window → cứ nhét thẳng vào prompt, khỏi dựng hạ tầng vector.
- Cần **suy luận trên dữ liệu có cấu trúc** (bảng, số liệu) → tốt hơn là để LLM sinh **SQL/tool call** truy vấn DB, chứ không embed.

> **Câu chốt phỏng vấn:** "RAG mạnh nhất ở câu hỏi *tra cứu có nguồn*. Em luôn tách và đo riêng retrieval với generation, vì phần lớn lỗi RAG nằm ở retrieval chứ không ở model."
