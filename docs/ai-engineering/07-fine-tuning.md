# 🎛️ 07 — Fine-tuning

> Chương [01](./01-llm-fundamentals.md) đã so sánh nhanh Fine-tuning vs RAG vs Prompting; chương này đào sâu riêng fine-tuning — vì khi phỏng vấn nói "em chọn RAG thay vì fine-tune", câu tiếp theo gần như chắc chắn là *"thế em hiểu fine-tune tới đâu?"*. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. Fine-tuning thực chất làm gì? 🔥

**Định nghĩa ngắn:** **Fine-tuning** = train tiếp một model đã có sẵn trên **tập ví dụ của bạn** (input → output mẫu), để chỉnh **trọng số** của nó nghiêng theo hành vi bạn muốn. Không train từ đầu — chỉ "uốn" model có sẵn.

**Giải thích sâu:**

- Kỹ thuật phổ biến nhất là **SFT (Supervised Fine-Tuning)**: đưa hàng trăm–nghìn cặp "hỏi → đáp chuẩn", model học bắt chước *cách trả lời* trong đó.
- Điểm phải khắc cốt ghi tâm: fine-tune dạy **hành vi** (format, giọng điệu, quy ước, cách suy nghĩ cho một task hẹp), **không phải cách tốt để nhồi kiến thức/dữ kiện**. Muốn model *biết* điều mới và cập nhật được → RAG. Muốn model *làm* theo kiểu mới → fine-tune.
- Ẩn dụ dễ nhớ khi phỏng vấn: **RAG = đưa sách mở cho nhân viên tra; fine-tune = đào tạo nghiệp vụ cho nhân viên**. Đào tạo xong không có nghĩa nhân viên thuộc nội dung sách mới nhất.

**Bẫy thường gặp:**

- "Cần model biết tài liệu công ty → fine-tune" là **sai hướng kinh điển**: dữ kiện nhồi qua fine-tune vừa đắt, vừa lỗi thời ngay khi tài liệu đổi, vừa không trích nguồn được.
- **Câu hỏi nối tiếp:** *"Fine-tune có làm model hết bịa không?"* → Không — nó đổi *phong cách* trả lời chứ không thêm cơ chế kiểm chứng sự thật. Thậm chí có thể bịa *tự tin hơn* vì đã học giọng chắc nịch.

---

## 2. Khi nào nên fine-tune? 🔥

**Định nghĩa ngắn:** Fine-tune là **phương án cuối** sau khi prompting + RAG đã đuối, hoặc khi bài toán lặp lại đủ lớn để khoản đầu tư train có lãi.

**Các tình huống fine-tune thắng:**

| Tình huống | Ví dụ cụ thể | Vì sao prompt/RAG đuối |
|---|---|---|
| **Format/quy ước rất đặc thù** | Xuất báo cáo theo template nội bộ 30 quy tắc | Prompt 30 quy tắc = dài, model vẫn quên lệch |
| **Giọng thương hiệu cố định** | Chatbot luôn xưng hô + văn phong đúng brand | Few-shot ăn token mỗi request, vẫn trôi giọng |
| **Task hẹp lặp cực nhiều** | Phân loại 5 triệu ticket/tháng vào 40 nhãn nội bộ | Fine-tune model **nhỏ** thay model lớn + prompt dài → rẻ và nhanh hơn hẳn ở quy mô đó |
| **Cắt latency/cost ở quy mô lớn** | Thay "model lớn + prompt 3k token" bằng "model nhỏ đã tune + prompt 200 token" | Prompt dài trả tiền mỗi request; fine-tune trả một lần |
| **Ngôn ngữ/domain hẹp** | Thuật ngữ y khoa, pháp lý tiếng Việt chuyên sâu | Prompting không sửa được "phản xạ" ngôn ngữ nền |

**Quy tắc quyết định (nói được trong phỏng vấn là ăn điểm):**

1. **Prompt trước** — rẻ nhất, đổi tức thì. Đo bằng eval.
2. Thiếu **dữ kiện** → **RAG**. Thiếu **hành vi/format** → cân nhắc fine-tune.
3. Chỉ fine-tune khi: (a) eval chứng minh prompt+RAG chưa đạt, **và** (b) task đủ ổn định + volume đủ lớn để bù chi phí train/duy trì.

**Bẫy thường gặp:**

- Fine-tune khi mới thử 2–3 prompt — chưa vắt hết đồ rẻ đã mua đồ đắt.
- **Câu hỏi nối tiếp:** *"Fine-tune và RAG có loại trừ nhau không?"* → Không, **kết hợp** rất phổ biến: fine-tune cho *giọng + format*, RAG cho *dữ kiện* — ví dụ bot CSKH tune giọng brand, còn giá/chính sách lấy qua RAG.

---

## 3. Full fine-tune vs LoRA/QLoRA 🔥

**Định nghĩa ngắn:** **Full fine-tune** cập nhật **toàn bộ** trọng số — đắt, cần nhiều GPU. **LoRA** (Low-Rank Adaptation) đóng băng model gốc, chỉ train thêm các **ma trận nhỏ gắn kèm (adapter)** — rẻ hơn hàng chục lần mà chất lượng thường đủ dùng.

**Giải thích sâu:**

- Trực giác LoRA: thay vì sửa cả tỷ tham số, ta học một "**bản vá**" nhỏ (vài chục triệu tham số) đè lên. Lúc chạy: model gốc + adapter. Một model gốc có thể cắm **nhiều adapter** cho nhiều task — không phải chứa N bản model.
- **QLoRA** = LoRA trên model đã **quantize 4-bit** → train được model lớn trên 1 GPU consumer. Đây là lý do fine-tune open-source (Llama, Qwen...) trở nên đại trà.
- **Managed fine-tuning** (OpenAI/Google): upload data JSONL, họ lo train + hosting — không cần GPU, nhưng bị khóa vào provider và model họ cho phép. **Open-source + LoRA**: chủ động model/dữ liệu (quan trọng khi data nhạy cảm không được rời hạ tầng), đổi lại tự lo GPU, serving, upgrade.
- Ngoài SFT còn nghe nhắc: **RLHF/DPO** (tinh chỉnh theo *sở thích* — câu nào người dùng thích hơn — thay vì đáp án đúng tuyệt đối). Biết khái niệm là đủ cho phỏng vấn application engineer.

**Bẫy thường gặp:**

- Nghĩ fine-tune bắt buộc cần cụm GPU — LoRA/QLoRA hoặc managed API đã hạ rào cản từ lâu.
- **Câu hỏi nối tiếp:** *"LoRA có kém full fine-tune không?"* → Với đa số task hành vi/format, chênh lệch nhỏ hơn nhiều so với chênh lệch chi phí; full fine-tune chỉ đáng khi cần dịch chuyển sâu (domain rất xa) và có ngân sách.

---

## 4. Dữ liệu training — phần quyết định 🔥

**Định nghĩa ngắn:** Chất lượng fine-tune = chất lượng data. **Vài trăm ví dụ tốt > vài chục nghìn ví dụ rác.**

**Ví dụ — data SFT dạng JSONL (format OpenAI):**

```json
{"messages": [{"role": "system", "content": "Bạn là CSKH của FShop, xưng 'em', gọi khách là 'anh/chị'."}, {"role": "user", "content": "ship đơn 300k bao nhiêu"}, {"role": "assistant", "content": "Dạ đơn dưới 500k phí ship là 30k toàn quốc anh/chị nhé. Trên 500k em miễn phí ship ạ."}]}
{"messages": [{"role": "system", "content": "Bạn là CSKH của FShop, xưng 'em', gọi khách là 'anh/chị'."}, {"role": "user", "content": "hàng lỗi đổi dc k"}, {"role": "assistant", "content": "Dạ được anh/chị nhé — mình đổi trả trong 30 ngày kể từ ngày nhận, sản phẩm còn nguyên tem và hóa đơn ạ."}]}
```

**Nguyên tắc chuẩn bị data:**

- **Giống production:** ví dụ phải phủ đúng phân phối câu hỏi thật (cả viết tắt, sai chính tả, câu cụt như "ship đơn 300k bao nhiêu") — đừng chỉ toàn câu văn mẫu đẹp.
- **Đầu ra là chuẩn vàng:** mỗi `assistant` message là câu trả lời bạn **muốn** model nói, đã duyệt kỹ — model sẽ nhân bản cả cái hay lẫn cái dở trong đó.
- **Đa dạng + phủ case biên:** câu từ chối, câu "không biết", câu khách cáu — nếu không có, model gặp là "trôi" về hành vi gốc.
- **Làm sạch PII** trước khi train — dữ liệu khách hàng nằm vào trọng số là **không gỡ ra được** (khác RAG chỉ cần xóa document).
- Số lượng khởi điểm thực dụng: **50–100 ví dụ đã thấy khác biệt** với managed API; vài trăm–nghìn cho kết quả ổn định.

**Bẫy thường gặp:**

- Gom log chat cũ đổ thẳng vào train — nhân bản luôn lỗi của agent cũ + rò PII.
- **Câu hỏi nối tiếp:** *"Lấy đâu ra data nếu chưa có?"* → **Distillation**: dùng model lớn + prompt xịn sinh đáp án mẫu, người duyệt lại, rồi train model nhỏ trên đó — mua chất lượng model lớn với giá model nhỏ (lưu ý điều khoản provider về việc này).

---

## 5. Quy trình thực tế & vòng đời 🔥

**Định nghĩa ngắn:** Fine-tune không phải "train xong là xong" — nó là **vòng đời**: baseline → data → train → **eval** → deploy → theo dõi → re-tune.

**Quy trình chuẩn (kể được là chứng minh đã làm thật):**

```text
1. Baseline:  đo prompt tốt nhất hiện có trên EVAL SET (chương 05) — mốc so sánh
2. Data:      gom + duyệt ví dụ chuẩn vàng, tách riêng 10–20% làm validation
3. Train:     managed API (upload JSONL) hoặc LoRA (open-source)
4. Eval:      chạy CÙNG eval set → so với baseline; thắng rõ mới đi tiếp
5. Deploy:    A/B với baseline trên traffic thật, theo dõi metric + cost
6. Vòng đời:  data thật mới về → bổ sung tập train → re-tune định kỳ
```

**Chi phí ẩn phải nói khi phỏng vấn (đây là chỗ tách senior):**

- **Model gốc ra bản mới** → bản fine-tune của bạn **không tự lên đời**; muốn hưởng model mới phải re-tune + re-eval từ đầu. Prompt/RAG thì gần như đổi tên model là xong.
- **Catastrophic forgetting:** tune quá tay vào task hẹp → model "quên" bớt năng lực tổng quát (yếu đi ở câu hỏi ngoài task). Phòng bằng data đa dạng + không train quá nhiều epoch + eval cả câu ngoài task.
- **Overfitting:** thuộc lòng ví dụ train, gặp biến thể lạ là gãy — validation set để bắt đúng bệnh này.
- Ai đó phải **own** pipeline data + lịch re-tune — chi phí vận hành dài hạn, không phải one-off.

**Bẫy thường gặp:**

- Train xong chỉ thử vài câu thấy "ngon" rồi ship — không so baseline trên eval set thì không biết có đáng công không (và có regression không).
- **Câu hỏi nối tiếp:** *"Model tune xong tệ hơn mong đợi, kiểm gì trước?"* → Kiểm **data** trước (lỗi format, ví dụ mâu thuẫn, thiếu case), rồi mới tới hyperparameter (epoch, learning rate). 90% vấn đề nằm ở data.

---

> **Câu chốt phỏng vấn:** "Em coi fine-tuning là công cụ dạy **hành vi** — format, giọng, task hẹp — không phải cách nhồi kiến thức; kiến thức em để RAG lo. Em chỉ fine-tune khi eval chứng minh prompt+RAG chưa đạt và volume đủ lớn để bù chi phí vòng đời: data, re-tune khi model gốc lên đời, và người own pipeline."
