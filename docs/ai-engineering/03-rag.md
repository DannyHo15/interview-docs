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

**Bẫy thường gặp:**

- Cắt cứng theo số ký tự giữa câu → chunk vô nghĩa. Ưu tiên cắt theo ranh giới ngữ nghĩa.
- **Câu hỏi nối tiếp:** *"Chọn chunk size bằng cách nào?"* → Không có con số vàng; **thử nhiều size và đo bằng eval retrieval** (câu hỏi này lấy đúng đoạn không).

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
