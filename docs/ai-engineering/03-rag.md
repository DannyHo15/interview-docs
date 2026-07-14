# 📚 03 — RAG (Retrieval-Augmented Generation)

> RAG là câu hỏi trung tâm của mọi phỏng vấn AI Solution. Bạn có [PoC RAG + MCP chạy được](../poc-ai-builder/index.md) — hãy dùng nó làm ví dụ thật khi trả lời. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. RAG là gì và giải quyết vấn đề gì? 🔥

**Định nghĩa ngắn:** **RAG** = trước khi hỏi LLM, ta **truy xuất** (retrieve) các đoạn tài liệu liên quan từ kho riêng, rồi **nhét vào context** để model trả lời dựa trên chúng. "Đưa sách mở cho model tra" thay vì bắt nó nhớ.

**Giải thích sâu:**

- Giải 2 vấn đề lớn của LLM thuần: (1) **không biết dữ liệu riêng/mới** (knowledge cutoff), (2) **hay bịa**. RAG đưa nguồn thật vào → trả lời cập nhật và có thể trích dẫn.
- Luồng chuẩn: **chunk** tài liệu → **embed** thành vector → lưu **vector DB**. Lúc hỏi: **embed câu hỏi** → tìm k đoạn gần nhất → **nhét vào prompt** → LLM trả lời + trích nguồn.
- Cập nhật kiến thức = **thêm/sửa tài liệu**, không cần train lại model → rẻ và nhanh, đây là lý do RAG thắng fine-tune cho dữ liệu hay đổi.

**Bẫy thường gặp:**

- Nghĩ RAG là một model — không, nó là **kiến trúc** ghép retrieval + generation.
- **Câu hỏi nối tiếp:** *"RAG có làm hết hallucination?"* → Giảm mạnh nhưng nếu **retrieve sai đoạn**, model vẫn bịa trên đoạn sai. Chất lượng RAG = chất lượng retrieval trước tiên.

---

## 2. Chunking — cắt tài liệu thế nào? 🔥

**Định nghĩa ngắn:** **Chunking** là cắt tài liệu dài thành các đoạn nhỏ để embed và truy xuất. Kích thước & cách cắt ảnh hưởng trực tiếp tới chất lượng.

**Giải thích sâu:**

- **Quá to** (cả trang): vector loãng nghĩa, nhét vào context tốn token và kéo theo nhiễu. **Quá nhỏ** (một câu): mất ngữ cảnh, câu trả lời bị đứt mạch.
- Thực dụng: **~200–500 token/chunk**, kèm **overlap** (~10–20%) để câu bị cắt ngang không mất nghĩa ở ranh giới.
- **Ngắt theo cấu trúc** tốt hơn ngắt theo độ dài cứng: theo đoạn văn, theo heading Markdown, theo mục — giữ trọn ý.
- Lưu kèm **metadata** (nguồn, tiêu đề, trang, ngày) để lọc và trích dẫn.

**Các cách chunking phổ biến:**

| Cách | Size ổn định? | Giữ ngữ nghĩa? | Chi phí | Khi nào dùng |
|---|---|---|---|---|
| **Fixed-size** (cắt cố định N token/ký tự) | ✅ | ❌ | Rẻ | Baseline, văn bản đồng nhất |
| **Recursive** (đa tầng separator `\n\n` → `\n` → `. ` → space) | ✅ | Trung bình | Rẻ | Default, đa số trường hợp; mặc định LangChain |
| **Structure-aware** (theo heading Markdown / thẻ HTML / AST code) | ❌ | ✅ | Rẻ | Docs có cấu trúc — thường cho retrieval tốt nhất |
| **Sentence-based** (nhóm N câu/chunk) | ✅ | Trung bình | Rẻ | FAQ, văn bản ngắn |
| **Semantic** (embed từng câu → cắt khi similarity giảm đột ngột) | ❌ | ✅✅ | Vừa | Văn bản tự do, dài; tôn trọng ranh giới chủ đề |
| **Late chunking** (embed cả doc bằng long-context model rồi mới cắt) | — | ✅✅ | Cao | Cần giữ context toàn cục cho từng chunk |
| **Agentic** (LLM tự quyết chỗ cắt) | ❌ | ✅✅✅ | Đắt | PoC, dữ liệu phức tạp; hiếm dùng production |

- **Fixed-size** + **overlap** là điểm khởi đầu phổ biến nhất; **recursive** và **structure-aware** thường là nâng cấp đầu tiên.
- **Semantic chunking** không cho size cố định — phải có fallback để chunk không quá lớn cho context window.
- **Late chunking** giữ được "vị trí trong tài liệu" mà chunk lẻ thiếu, nhưng cần embedding model hỗ trợ context dài (vd Jina v3).

**Ví dụ minh họa — cùng một tài liệu, ba kiểu cắt:**

Giả sử có tài liệu chính sách ngắn:

```markdown
# Chính sách đổi trả
Khách được đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.
Sản phẩm phải còn nguyên tem và hóa đơn.

# Phí vận chuyển
Đơn trên 500k được miễn phí ship.
Đơn dưới 500k tính phí 30k toàn quốc.
```

**(a) Fixed-size** (cắt cứng ~60 ký tự, không quan tâm nghĩa):

```text
Chunk 1: "# Chính sách đổi trả\nKhách được đổi trả trong vòng 30 ngày kể từ"
Chunk 2: " ngày nhận hàng.\nSản phẩm phải còn nguyên tem và hóa đơn.\n\n# Phí"
Chunk 3: " vận chuyển\nĐơn trên 500k được miễn phí ship.\nĐơn dưới 500k tính..."
```

→ Hỏng: "30 ngày kể từ **ngày nhận hàng**" bị cắt đôi giữa chunk 1 và 2; chunk 2 trộn cả hai chủ đề (đổi trả + phí ship). Hỏi *"đơn 400k phí ship bao nhiêu?"* dễ match nhầm chunk 2.

**(b) Structure-aware** (mỗi heading = 1 chunk):

```text
Chunk 1  (metadata: heading="Chính sách đổi trả"):
  "Khách được đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.
   Sản phẩm phải còn nguyên tem và hóa đơn."

Chunk 2  (metadata: heading="Phí vận chuyển"):
  "Đơn trên 500k được miễn phí ship. Đơn dưới 500k tính phí 30k toàn quốc."
```

→ Mỗi chunk trọn **một ý**, kèm metadata heading để lọc và trích nguồn. Hỏi phí ship → trúng thẳng chunk 2. Đây thường là kết quả retrieval tốt nhất cho docs có cấu trúc.

**(c) Semantic** (đo similarity giữa các câu, cắt khi chủ đề đổi): "tem/hóa đơn" gần nghĩa "đổi trả" nên gom chung; tới câu "miễn phí ship" thì similarity **tụt** → cắt. Kết quả gần giống (b) nhưng **không cần** tài liệu có sẵn heading — đổi lại tốn compute để embed từng câu.

**Ví dụ vì sao cần overlap:**

Đoạn gốc: *"…Bảo hành 12 tháng. Không áp dụng cho lỗi do người dùng như rơi vỡ, vào nước."*

```text
KHÔNG overlap:
  Chunk A: [... Bảo hành 12 tháng.]
  Chunk B: [Không áp dụng cho lỗi do người dùng như rơi vỡ, vào nước.]

CÓ overlap (lặp lại câu cuối của A ở đầu B):
  Chunk A: [... Bảo hành 12 tháng.]
  Chunk B: [Bảo hành 12 tháng. Không áp dụng cho lỗi do người dùng như rơi vỡ...]
```

→ Hỏi *"rơi vỡ có được bảo hành không?"*: bản không overlap retrieve chunk B nhưng **mất chủ ngữ "bảo hành"** → model dễ trả lời cụt/sai. Overlap kéo câu "Bảo hành 12 tháng." sang B → giữ liên kết ngữ nghĩa.

**Ví dụ parent-child (small-to-big):**

- **Index** bằng câu nhỏ để match chính xác: câu *"Đơn dưới 500k tính phí 30k toàn quốc."* trúng thẳng câu hỏi *"ship đơn 300k bao nhiêu?"*.
- **Trả cho LLM** cả **mục cha "Phí vận chuyển"** (gồm cả điều kiện miễn phí trên 500k) → câu trả lời đủ ngữ cảnh, không thiếu vế. Nhỏ để tìm, to để trả lời.

**Mẹo khi chọn:**

- Không có cách "đúng nhất" — chọn theo dữ liệu + bài toán. Bắt đầu recursive → đo recall → mới optimize.
- **Parent-child / small-to-big**: chunk nhỏ để match chính xác khi retrieve, nhưng **trả context lớn (parent)** cho LLM → gỡ được tradeoff chunk-size. Phổ biến trong production.
- **Chunk size + overlap cần tune** dựa trên metric (context precision/recall), đừng đoán con số.

**Bẫy thường gặp:**

- Cắt cứng theo số ký tự giữa câu → chunk vô nghĩa. Ưu tiên cắt theo ranh giới ngữ nghĩa.
- Áp semantic/late chunking cho mọi thứ ngay từ đầu — đắt và chưa cần; baseline thường đã đủ.
- **Câu hỏi nối tiếp:** *"Chọn chunk size bằng cách nào?"* → Không có con số vàng; **thử nhiều size và đo bằng eval retrieval** (câu hỏi này lấy đúng đoạn không).
- **Câu hỏi nối tiếp:** *"Semantic chunking khác gì recursive?"* → Recursive cắt theo **quy tắc** (separator), còn semantic cắt theo **độ đổi chủ đề** thực tế đo bằng embedding — tự nhiên hơn nhưng tốn compute và size không đều.

---

## 3. Vector database — chọn cái nào? 🔥

**Định nghĩa ngắn:** Vector DB lưu embedding và tìm **k vector gần nhất** (ANN — approximate nearest neighbor) cực nhanh, thay vì so sánh tuần tự toàn bộ.

**Giải thích sâu:**

| Lựa chọn | Khi nào chọn |
|---|---|
| **pgvector** (Postgres) | Đã dùng Postgres, muốn 1 DB cho cả quan hệ + vector, đội nhỏ. Đây là lựa chọn của PoC. |
| **Pinecone / managed** | Không muốn tự vận hành, cần scale lớn, sẵn tiền |
| **Qdrant / Weaviate / Milvus** | Cần tính năng vector chuyên sâu, self-host, filter phức tạp |

- Bên trong dùng **index ANN** như **HNSW** (đồ thị nhiều tầng, truy vấn nhanh, chính xác cao) hoặc IVF. Đánh đổi: **tốc độ ↔ độ chính xác (recall) ↔ bộ nhớ**.
- Đo "gần nhau" bằng **cosine similarity** (phổ biến nhất cho text).

**Bẫy thường gặp:**

- Chọn Pinecone cho POC nhỏ trong khi đã có Postgres → pgvector đủ và đơn giản hơn nhiều. Đừng thêm hạ tầng khi chưa cần.
- **Câu hỏi nối tiếp:** *"HNSW là gì?"* → đồ thị "small-world" nhiều tầng cho ANN; nhanh và recall cao, đổi lại tốn RAM và build index lâu hơn.

---

## 4. Nâng chất lượng retrieval — hybrid & rerank 🔥

**Định nghĩa ngắn:** Vector search giỏi ngữ nghĩa nhưng **dở với từ khóa chính xác** (mã sản phẩm, tên riêng, số hiệu). **Hybrid** ghép vector + keyword; **rerank** sắp xếp lại kết quả cho đúng hơn.

**Giải thích sâu:**

- **Hybrid search:** chạy song song **vector** (nghĩa) + **keyword/BM25** (từ khóa), rồi **hợp nhất** kết quả — thường bằng **RRF (Reciprocal Rank Fusion)** như trong PoC. Bắt được cả "ý gần nghĩa" lẫn "trùng mã chính xác".
- **Reranking:** lấy top ~50 ứng viên rồi cho một **cross-encoder** (model chuyên chấm độ liên quan câu hỏi–đoạn) xếp lại, giữ top ~5 đưa vào LLM. Chính xác hơn nhiều so với chỉ cosine, đổi lại thêm latency/cost.
- Trình tự thực dụng: **retrieve rộng (recall cao) → rerank hẹp (precision cao) → generate**.

**Bẫy thường gặp:**

- Chỉ dựa vector rồi than "hỏi mã SKU không ra" — đó là lúc cần hybrid.
- **Câu hỏi nối tiếp:** *"RRF hoạt động sao?"* → mỗi tài liệu nhận điểm theo **thứ hạng** ở từng danh sách (1/(k+rank)), cộng lại; không cần chuẩn hóa điểm số khác thang giữa hai hệ.

---

## 5. Đánh giá một hệ RAG 🔥

**Định nghĩa ngắn:** RAG có **2 tầng phải đo riêng**: **retrieval** (có lấy đúng đoạn không) và **generation** (câu trả lời có đúng & bám nguồn không).

**Giải thích sâu:**

- **Retrieval:** *recall@k* / *precision@k* — trong top-k có đoạn chứa đáp án không. Nếu tầng này hỏng thì generation vô nghĩa.
- **Generation:** **faithfulness/groundedness** (câu trả lời có đúng theo đoạn được đưa, không bịa ngoài nguồn), **answer relevance** (có trả lời đúng câu hỏi). Thường dùng **LLM-as-judge** + bộ câu hỏi vàng.
- Công cụ hay nhắc: **RAGAS**, hoặc tự viết eval set. Điểm chốt: **đo được thì mới cải tiến được**.

**Bẫy thường gặp:**

- Chỉ nhìn câu trả lời cuối mà không tách tầng → không biết lỗi do lấy sai đoạn hay do model diễn giải sai.
- **Câu hỏi nối tiếp:** *"Người dùng than trả lời sai, debug từ đâu?"* → Kiểm **retrieval trước**: đoạn đúng có nằm trong top-k không? Nếu không → sửa chunking/embedding/hybrid. Nếu có mà vẫn sai → sửa prompt/model.

---

## 6. Khi nào RAG *không* phải câu trả lời

- Câu hỏi cần **tổng hợp toàn bộ tài liệu** (ví dụ "tóm tắt cả 300 trang") → top-k đoạn không đủ; cần summarization theo cấp bậc (map-reduce), không phải RAG thuần.
- Dữ liệu **nhỏ và tĩnh**, vừa context window → cứ nhét thẳng vào prompt, khỏi dựng hạ tầng vector.
- Cần **suy luận trên dữ liệu có cấu trúc** (bảng, số liệu) → tốt hơn là để LLM sinh **SQL/tool call** truy vấn DB, chứ không embed.

> **Câu chốt phỏng vấn:** "RAG mạnh nhất ở câu hỏi *tra cứu có nguồn*. Em luôn tách và đo riêng retrieval với generation, vì phần lớn lỗi RAG nằm ở retrieval chứ không ở model."
