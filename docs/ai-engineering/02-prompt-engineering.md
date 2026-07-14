# ✍️ 02 — Prompt Engineering

> "Cùng một model, prompt tốt và prompt tệ cho kết quả khác một trời một vực." Người phỏng vấn muốn thấy bạn biết **vì sao** một kỹ thuật hiệu quả, không chỉ copy mẹo. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. System prompt vs user prompt 🔥

**Định nghĩa ngắn:** **System prompt** đặt **vai trò, quy tắc, ràng buộc** cố định cho toàn hội thoại. **User prompt** là câu hỏi/yêu cầu cụ thể từng lượt.

**Giải thích sâu:**

- System prompt là nơi đặt: "Bạn là trợ lý pháp lý, chỉ trả lời dựa trên tài liệu được cung cấp, nếu không có thông tin thì nói *không biết*, luôn trả lời tiếng Việt."
- Nó có **trọng số ưu tiên cao hơn** user prompt về mặt hành vi — dùng để chặn việc user "lái" model ra ngoài phạm vi (một phần của chống prompt injection, xem [file 05](./05-evaluation-guardrails-production.md)).
- Trong API (OpenAI/Vercel AI SDK) đây là `role: "system"`.

**Bẫy thường gặp:**

- Nhét dữ liệu thay đổi liên tục vào system prompt → khó cache, khó quản. Ràng buộc thì để system, dữ kiện thì đưa qua context/RAG.
- **Câu hỏi nối tiếp:** *"System prompt có chống injection tuyệt đối không?"* → Không; user vẫn có thể tìm cách vượt, nên cần thêm guardrail ở tầng ngoài.

---

## 2. Zero-shot vs few-shot 🔥

**Định nghĩa ngắn:** **Zero-shot** = ra lệnh không kèm ví dụ. **Few-shot** = kèm vài ví dụ input→output mẫu để model bắt chước.

**Giải thích sâu:**

- Few-shot hiệu quả khi task cần **định dạng cụ thể** hoặc **quy ước riêng** mà lời văn khó tả hết. Ví dụ phân loại ticket: cho 3 ví dụ "câu → nhãn" thì model bắt đúng nhãn hơn hẳn.
- Đánh đổi: mỗi ví dụ **tốn token** (tiền + context). Nhiều ví dụ chất lượng cao > nhiều ví dụ cẩu thả.
- Ví dụ nên **đa dạng và bao các case biên**, không chỉ case dễ.

**Bẫy thường gặp:**

- Đưa ví dụ lệch (toàn nhãn "positive") → model thiên vị theo. Cân bằng ví dụ.
- **Câu hỏi nối tiếp:** *"Few-shot vs fine-tune?"* → Few-shot linh hoạt, đổi tức thì, không cần train; fine-tune rẻ hơn *khi chạy* nếu cùng một task lặp cực nhiều lần (không phải trả token ví dụ mỗi request).

---

## 3. Chain-of-Thought (CoT) 🔥

**Định nghĩa ngắn:** Yêu cầu model **suy nghĩ từng bước** trước khi kết luận ("hãy lập luận từng bước rồi mới trả lời") → cải thiện rõ ở task **suy luận, toán, logic nhiều bước**.

**Giải thích sâu:**

- CoT hoạt động vì model có thêm "không gian token" để triển khai lập luận trung gian thay vì nhảy thẳng tới đáp án — giống con người nháp ra giấy.
- Nhược điểm: dài hơn → tốn token và chậm. Với app cần đáp án ngắn gọn, có thể để model suy luận nội bộ rồi **chỉ xuất kết luận** (hoặc dùng model có "reasoning" sẵn).
- Biến thể: **self-consistency** (chạy nhiều lần, lấy đáp án đa số) tăng độ chính xác nhưng tốn tiền gấp bội.

**Bẫy thường gặp:**

- Ép CoT cho task đơn giản (phân loại 1 nhãn) → tốn token vô ích.
- **Câu hỏi nối tiếp:** *"CoT có làm model đúng hơn hay chỉ trông có vẻ đúng?"* → Cả hai; lập luận hiện ra giúp debug, nhưng lập luận nghe hợp lý vẫn có thể dẫn tới đáp án sai → vẫn phải đánh giá kết quả cuối.

---

## 4. Structured output (JSON) 🔥

**Định nghĩa ngắn:** Bắt model trả về đúng **schema** (JSON theo cấu trúc định trước) để code dùng được ngay, thay vì text tự do phải regex.

**Giải thích sâu:**

- Cách chắc ăn nhất: dùng tính năng **JSON mode / structured output / tool calling** của API + khai báo schema (thường bằng **Zod** trong Vercel AI SDK, hoặc JSON Schema). Model bị ép sinh ra JSON hợp lệ theo schema.
- So với "xin JSON trong prompt rồi tự parse": cách sau dễ lỗi (thiếu dấu ngoặc, thêm lời dẫn "Đây là JSON của bạn:"). Structured output ở tầng API đáng tin hơn nhiều.
- Vẫn nên **validate lại** phía server (Zod/`safeParse`) trước khi tin — schema đúng cú pháp không có nghĩa giá trị hợp lệ về nghiệp vụ.

**Bẫy thường gặp:**

- Tin tưởng output JSON mà không validate → crash khi model thỉnh thoảng lệch.
- **Câu hỏi nối tiếp:** *"Trong Vercel AI SDK làm sao?"* → `generateObject`/`streamObject` với `schema` là Zod; SDK lo phần ép định dạng và parse.

---

## 5. Prompt cho RAG — bám nguồn

**Định nghĩa ngắn:** Prompt cho hệ RAG phải **buộc model chỉ trả lời dựa trên đoạn context được cung cấp**, và nói "không tìm thấy" khi context không chứa câu trả lời.

**Giải thích sâu:**

- Mẫu điển hình: *"Chỉ dùng thông tin trong phần CONTEXT dưới đây để trả lời. Nếu CONTEXT không có, trả lời: 'Tôi không tìm thấy thông tin này trong tài liệu.' Không bịa."*
- Kèm yêu cầu **trích nguồn** (đánh số đoạn) giúp người dùng kiểm chứng và giảm bịa.
- Đặt context rõ ranh giới (dấu phân tách rõ) để model không nhầm hướng dẫn với dữ liệu.

**Bẫy thường gặp:**

- Không có câu "nói không biết" → model lấp chỗ trống bằng bịa.
- **Câu hỏi nối tiếp:** *"Nếu context mâu thuẫn nhau?"* → yêu cầu model nêu rõ mâu thuẫn và trích cả hai nguồn, thay vì tự chọn một cách im lặng.

---

## 6. Nguyên tắc viết prompt tốt (checklist nhanh)

- **Cụ thể hơn là dài dòng:** nói rõ vai trò, định dạng đầu ra, độ dài, ngôn ngữ.
- **Ràng buộc rõ ràng:** cái gì được/không được làm, nói "không biết" khi nào.
- **Đưa ví dụ** khi format quan trọng.
- **Chia nhỏ task phức tạp** thành các bước (prompt chaining) thay vì một prompt khổng lồ.
- **Đặt phần quan trọng ở đầu và cuối** (tránh "lost in the middle").
- **Lặp lại — đo — sửa:** prompt tốt là kết quả của việc thử và đánh giá, không phải viết một phát ăn ngay.

> **Câu chốt hay dùng khi phỏng vấn:** "Em coi prompt như một phần code — có version, có test/eval, và cải tiến dựa trên số liệu chứ không dựa vào cảm giác."
