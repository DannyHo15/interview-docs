# 04 — Conflict & Failure

> Câu hỏi về conflict và failure thường khó nhất vì dễ rơi vào đổ lỗi hoặc tự giảm giá trị. Cần trả lờí cân bằng: trung thực nhưng tích cực.

---

## 1. Conflict với teammate

### Khung trả lờí
1. **Context**: vấn đề kỹ thuật gì? (vd: chọn state management library).
2. **Hai bên**: mỗi ngườì ủng hộ giải pháp nào?
3. **Hành động**: bạn đã làm gì để hiểu quan điểm đối phương? Đưa data/prototype?
4. **Kết quả**: đạt được consensus? Compromise? Kết quả cuối cùng?

### Ví dụ
> "Chúng tôi tranh luận về việc dùng Redux hay Zustand. Tôi đề xuất làm một POC nhỏ so sánh bundle size, boilerplate, và dev experience trong 2 ngày. Kết quả Zustand đủ nhẹ cho project, chúng tôi chọn Zustand và team hài lòng."

---

## 2. Conflict với manager

### Nguyên tắc
- Tôn trọng authority.
- Trình bày ý kiến bằng data.
- Chấp nhận quyết định cuối cùng.

### Ví dụ
> "Manager muốn rush một feature, tôi lo ngại về technical debt. Tôi trình bày risk và đề xuất scope nhỏ hơn để vẫn kịp deadline. Cuối cùng chúng tôi compromise: ship MVP và lên lịch refactor ngay sprint sau."

---

## 3. Failure

### Khung trả lờí
1. **Chọn lỗi thực tế** nhưng không quá nghiêm trọng.
2. **Nhận trách nhiệm** cá nhân.
3. **Hành động khắc phục** ngay lập tức.
4. **Bài học** và **prevention** cho tương lai.

### Ví dụ
> "Tôi từng deploy một refactor mà không có integration test đầy đủ, dẫn đến regression ở payment flow. Tôi rollback ngay, viết test bù, và setup pre-deploy checklist. Từ đó team yêu cầu integration test cho mọi critical path trước khi merge."

---

## 4. Câu hỏi phổ biến

- "Tell me about a time you disagreed with a teammate."
- "Tell me about a conflict with your manager."
- "Tell me about a mistake you made."
- "Tell me about a project that failed."
- "Describe a time you received critical feedback."

---

## ⚠️ Điều KHÔNG nên làm

- Đổ lỗi cho ngườì khác.
- Chọn câu chuyện quá nhẹ ("tôi đi muộn 1 lần").
- Chọn câu chuyện quá nặng mà không có learning.
- Nói "tôi không có conflict nào".
