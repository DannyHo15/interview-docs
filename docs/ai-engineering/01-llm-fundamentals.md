# 🧠 01 — LLM hoạt động thế nào (Fundamentals)

> Đây là gốc rễ. Trả lời sâu được phần này thì mọi câu về RAG, agent, cost đều dễ hơn. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. Token là gì? 🔥

**Định nghĩa ngắn:** LLM không đọc chữ theo ký tự hay từ, mà theo **token** — mảnh nhỏ của văn bản (thường ~4 ký tự tiếng Anh, hoặc một phần của từ). Ví dụ `"unhappiness"` có thể tách thành `un` + `happi` + `ness`.

**Giải thích sâu:**

- Mọi input/output đều được **tokenize** thành số nguyên trước khi vào model. Model dự đoán **token tiếp theo** dựa trên các token trước đó — nó chỉ là một máy đoán token cực giỏi.
- **Vì sao phải quan tâm:** giá tiền và giới hạn đều tính theo token, không theo từ. Tiếng Việt thường **tốn nhiều token hơn** tiếng Anh cho cùng nội dung (do tokenizer tối ưu cho tiếng Anh).
- Quy đổi nhớ nhanh: **1 token ≈ 4 ký tự ≈ 0.75 từ tiếng Anh**. 1.000 từ ≈ 1.300–1.500 token.

**Bẫy thường gặp:**

- Nói "một từ là một token" là **sai** — dấu câu, khoảng trắng, hậu tố đều có thể là token riêng.
- **Câu hỏi nối tiếp:** *"Vì sao model đếm số chữ trong câu hay sai?"* → Vì nó thấy token chứ không thấy ký tự; đếm ký tự là việc token hóa che mất.

---

## 2. Context window là gì? 🔥

**Định nghĩa ngắn:** **Context window** là **tổng số token tối đa** (input + output) mà model xử lý trong **một** lần gọi. Ví dụ 128k token nghĩa là toàn bộ prompt + câu trả lời phải nằm gọn trong 128k.

**Giải thích sâu:**

- LLM **không có trí nhớ giữa các request**. "Nhớ" trong chatbot thực chất là **gửi lại toàn bộ lịch sử hội thoại** mỗi lượt. Hết context window thì phải cắt bớt (truncate) hoặc tóm tắt (summarize).
- Context lớn ≠ luôn tốt: nhồi quá nhiều gây **"lost in the middle"** — model chú ý tốt phần đầu và cuối, dễ bỏ sót phần giữa. Đây là lý do RAG (chỉ đưa đúng đoạn liên quan) thường thắng "nhét cả tài liệu vào".
- Chi phí tăng theo lượng token đưa vào, nên context to = tiền nhiều và chậm hơn.

**Bẫy thường gặp:**

- Nghĩ "cứ tăng context là AI thông minh hơn" — thực tế tăng cost/latency và loãng tín hiệu.
- **Câu hỏi nối tiếp:** *"Hội thoại dài quá thì xử lý sao?"* → sliding window (giữ N lượt gần nhất) + tóm tắt các lượt cũ thành một đoạn ngắn, hoặc lưu ra ngoài rồi RAG lại khi cần.

---

## 3. Temperature, top-p — điều khiển tính ngẫu nhiên 🔥

**Định nghĩa ngắn:** Ở mỗi bước, model cho ra **phân phối xác suất** trên token tiếp theo. **Temperature** và **top-p** quyết định lấy mẫu từ phân phối đó "táo bạo" hay "an toàn" thế nào.

**Giải thích sâu:**

- **Temperature = 0** (hoặc gần 0): gần như luôn chọn token có xác suất cao nhất → **ổn định, ít sáng tạo, dễ lặp lại**. Dùng cho: trích xuất dữ liệu, phân loại, structured output, code.
- **Temperature cao (0.7–1.0)**: chọn đa dạng hơn → **sáng tạo, nhưng dễ lạc đề/bịa**. Dùng cho: brainstorm, viết marketing, đặt tên.
- **top-p (nucleus sampling)**: chỉ lấy mẫu trong nhóm token nhỏ nhất mà tổng xác suất ≥ p (ví dụ 0.9). Thường **chỉ chỉnh một trong hai**, không đồng thời vặn cả temperature lẫn top-p.

**Bẫy thường gặp:**

- Temperature = 0 **không đảm bảo hoàn toàn deterministic** trong thực tế (do tính toán số thực song song trên GPU) — nói "gần như" mới đúng.
- **Câu hỏi nối tiếp:** *"App RAG hỏi-đáp tài liệu nên để temperature bao nhiêu?"* → Thấp (0–0.3) để bám sát nguồn, giảm bịa.

---

## 4. Vì sao model "bịa" (hallucination)? 🔥

**Định nghĩa ngắn:** **Hallucination** là khi model tạo ra thông tin **nghe hợp lý nhưng sai/không có thật**. Đây là hệ quả tất yếu của cơ chế "đoán token tiếp theo", không phải bug.

**Giải thích sâu:**

- Model tối ưu để câu **trôi chảy và có vẻ đúng**, chứ không phải để **đúng sự thật**. Khi không biết, nó vẫn đoán tiếp thay vì nói "tôi không biết".
- Kiến thức nằm trong tham số (weights) và **đóng băng ở thời điểm train** (knowledge cutoff) → hỏi sự kiện mới hoặc dữ liệu nội bộ công ty là dễ bịa nhất.
- **Cách giảm** (không thể triệt tiêu 100%): (1) **RAG** — đưa nguồn thật vào context và yêu cầu chỉ trả lời dựa trên nguồn; (2) hạ temperature; (3) yêu cầu trích dẫn/nói "không biết" khi thiếu thông tin; (4) kiểm chứng đầu ra bằng bước khác.

**Bẫy thường gặp:**

- Hứa "hết hallucination" là sai — chỉ **giảm** được. Nói vậy trong phỏng vấn là điểm trừ.
- **Câu hỏi nối tiếp:** *"RAG có chống được hallucination không?"* → Giảm mạnh với câu hỏi có nguồn, nhưng nếu retrieve sai đoạn thì model vẫn bịa "một cách tự tin" trên đoạn sai → phải đo cả retrieval.

---

## 5. Embedding là gì? 🔥

**Định nghĩa ngắn:** **Embedding** biến một đoạn text thành **vector số** (ví dụ 768 hay 1536 chiều) sao cho **văn bản gần nghĩa → vector gần nhau** trong không gian đó.

**Giải thích sâu:**

- Đo "gần nhau" thường bằng **cosine similarity** (góc giữa hai vector). Gần 1 = rất giống nghĩa, gần 0 = không liên quan.
- Đây là nền tảng của **semantic search** và **RAG**: thay vì so khớp từ khóa, ta so khớp **ý nghĩa**. Hỏi "xe hơi tiết kiệm xăng" vẫn match tài liệu viết "ô tô ít hao nhiên liệu".
- Embedding model **khác** LLM sinh văn bản: nó chỉ xuất vector, nhỏ và rẻ hơn nhiều (ví dụ `text-embedding-004`, `text-embedding-3-small`).

**Bẫy thường gặp:**

- Trộn embedding từ **hai model khác nhau** → vô nghĩa, không so sánh được. Index và query phải cùng một embedding model.
- **Câu hỏi nối tiếp:** *"Vector lưu ở đâu?"* → vector database (pgvector, Pinecone, Qdrant...). Xem [03 — RAG](./03-rag.md).

---

## 6. Fine-tuning vs RAG vs Prompting — chọn cái nào? 🔥

**Định nghĩa ngắn:** Ba cách "dạy" model biết thứ nó chưa biết, theo thứ tự từ rẻ→đắt: **prompting** (nhét hướng dẫn/ví dụ vào prompt) → **RAG** (truy xuất kiến thức lúc chạy) → **fine-tuning** (train lại trên dữ liệu của bạn).

**Giải thích sâu:**

| Nhu cầu | Chọn | Vì sao |
|---|---|---|
| Kiến thức **thường xuyên thay đổi** (docs, giá, tồn kho) | **RAG** | Cập nhật = đổi dữ liệu, không train lại |
| Muốn model theo **định dạng/giọng văn** cố định, hoặc task hẹp lặp lại | **Fine-tuning** | Dạy *cách làm*, không phải *dữ kiện* |
| Chỉ cần **hướng dẫn hành vi** | **Prompting** | Rẻ nhất, đổi tức thì |

- Nguyên tắc thực dụng: **prompt trước, RAG khi cần dữ kiện, fine-tune là phương án cuối** vì tốn dữ liệu, tiền và phải train lại khi có model mới.
- Fine-tuning **dạy phong cách/format**, **không** phải cách nhồi kiến thức mới — nhồi kiến thức bằng fine-tune vừa đắt vừa dễ lỗi thời.

**Bẫy thường gặp:**

- Trả lời "cần model biết dữ liệu công ty → fine-tune" là **sai hướng** trong đa số case → nên RAG.
- **Câu hỏi nối tiếp:** *"Khi nào bắt buộc fine-tune?"* → Khi cần format rất đặc thù, latency cực thấp, hoặc domain ngôn ngữ mà prompting/RAG không đủ. Đào sâu ở [07 — Fine-tuning](./07-fine-tuning.md).
