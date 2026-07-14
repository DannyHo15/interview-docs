# 🛠️ 04 — Agents & Tool Calling

> "AI agent" là buzzword bị lạm dụng. Người phỏng vấn muốn thấy bạn phân biệt được **agent thật** với **chatbot có vài API**, và hiểu function calling / MCP dưới nắp. Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. Tool / function calling là gì? 🔥

**Định nghĩa ngắn:** **Function calling** cho phép LLM **gọi hàm/API của bạn**: bạn khai báo danh sách tool (tên, mô tả, schema tham số); model tự quyết khi nào cần và trả về **tên tool + tham số** (JSON) để **code của bạn** thực thi.

**Giải thích sâu:**

- **Model không tự chạy code.** Nó chỉ **đề nghị** gọi `get_weather({city: 'Hanoi'})`. Runtime của bạn thực thi, lấy kết quả, **đưa lại vào context**, rồi model dùng kết quả để trả lời. Đây là mấu chốt nhiều người hiểu sai.
- Nhờ vậy LLM vượt giới hạn "chỉ sinh chữ": tra dữ liệu real-time, tính toán chính xác, thao tác hệ thống.
- Chất lượng gọi tool phụ thuộc **mô tả tool rõ ràng** — mô tả kém thì model chọn sai tool hoặc điền sai tham số.

**Bẫy thường gặp:**

- Nghĩ model tự chạy hàm → sai; **bạn** phải viết vòng lặp thực thi rồi feed kết quả trở lại.
- **Câu hỏi nối tiếp:** *"Trong Vercel AI SDK thế nào?"* → khai báo `tools` với `parameters` là Zod và một hàm `execute`; SDK tự lo vòng lặp gọi–thực thi–feed lại (đặt `maxSteps` để cho nhiều bước).

---

## 2. Agent khác chatbot/RAG ở đâu? 🔥

**Định nghĩa ngắn:** **Agent** = LLM được trao **tool + vòng lặp tự quyết nhiều bước** để đạt mục tiêu: nó **lập kế hoạch → gọi tool → quan sát kết quả → quyết bước tiếp** cho tới khi xong. Chatbot chỉ trả lời một lượt.

**Giải thích sâu:**

- Điểm khác cốt lõi là **vòng lặp và tính tự chủ**: agent tự chọn chuỗi hành động không định trước, còn workflow cứng thì bạn code sẵn các bước.
- Mẫu kinh điển **ReAct** = *Reason + Act*: model xen kẽ **suy luận** ("cần biết tồn kho trước") và **hành động** (gọi tool tồn kho), lặp lại.
- Đánh đổi: agent linh hoạt nhưng **khó đoán, dễ lặp vô hạn, tốn nhiều lần gọi model (đắt), khó debug**. → Sản xuất thật thường thích **workflow có kiểm soát** hơn agent tự do khi có thể.

**Bẫy thường gặp:**

- Gọi mọi thứ có API là "agent". Nếu các bước cố định và bạn code sẵn → đó là **workflow**, không phải agent.
- **Câu hỏi nối tiếp:** *"Khi nào dùng agent, khi nào workflow?"* → Bước **biết trước** → workflow (rẻ, ổn định, dễ test). Bước **phụ thuộc kết quả trung gian, không đoán trước** → agent. Nguyên tắc: **đơn giản nhất mà chạy được**.

---

## 3. MCP (Model Context Protocol) là gì? 🔥

**Định nghĩa ngắn:** **MCP** là **giao thức chuẩn** (Anthropic đề xuất) để LLM/agent kết nối tới **nguồn dữ liệu & công cụ bên ngoài** — ví như "cổng USB-C cho AI tool". PoC của bạn có một MCP server phơi kho tri thức thành tool cho Claude gọi trực tiếp.

**Giải thích sâu:**

- Trước MCP, mỗi app tự định nghĩa cách nối tool → mỗi tích hợp là code riêng (M app × N tool = bùng nổ). MCP chuẩn hóa: **server** phơi tools/resources theo giao thức chung, **client** (Claude Code, Claude Desktop...) gọi được ngay mà không cần code kết nối riêng.
- Giao tiếp qua **stdio** (local) hoặc **HTTP/SSE** (remote). Server khai báo tool → client (và LLM sau nó) khám phá và gọi.
- Lợi ích: **tái sử dụng** — viết MCP server một lần, mọi client hỗ trợ MCP đều dùng được.

**Bẫy thường gặp:**

- Nhầm MCP là "một loại model" hay "thay thế function calling". Nó là **lớp chuẩn hóa việc phơi tool**; function calling là cơ chế model quyết gọi tool. Chúng bổ trợ nhau.
- **Câu hỏi nối tiếp:** *"MCP so với việc tự viết REST tool?"* → REST cũng chạy, nhưng MCP cho bạn **cắm–chạy** với các client có sẵn (Claude Code/Desktop) mà không cần dán code tích hợp mỗi nơi.

---

## 4. Multi-agent — nhiều agent phối hợp

**Định nghĩa ngắn:** Chia bài toán cho **nhiều agent chuyên biệt** (ví dụ: một agent lập kế hoạch, các agent con thực thi song song, một agent tổng hợp) thay vì một agent làm tất.

**Giải thích sâu:**

- Mẫu phổ biến: **orchestrator–worker** (một điều phối, nhiều thợ) hoặc **pipeline** (chuyền tiếp). Lợi: chuyên môn hóa, chạy song song, mỗi agent context gọn hơn.
- Cái giá: **phối hợp phức tạp, cost nhân lên theo số agent, lỗi lan truyền, khó debug**. Nhiều bài toán một agent + tool tốt là đủ.
- Nguyên tắc: **đừng nhảy vào multi-agent** cho tới khi single-agent thật sự không tải nổi.

**Bẫy thường gặp:**

- Dựng multi-agent cho task mà một prompt tốt giải được → tự tăng cost và điểm hỏng.
- **Câu hỏi nối tiếp:** *"Các agent chia sẻ trạng thái sao?"* → qua bộ nhớ chung/hàng đợi tin nhắn/ranh giới sở hữu rõ ràng; nếu để chồng chéo trạng thái thì dễ đua nhau và mâu thuẫn.

---

## 5. An toàn khi cho agent hành động 🔥

**Định nghĩa ngắn:** Agent gọi tool = agent **tác động ra thế giới thật** (gửi mail, xóa dữ liệu, chi tiền). Phải có **rào chắn** trước hành động không thể hoàn tác.

**Giải thích sâu:**

- **Human-in-the-loop:** hành động rủi ro (xóa, gửi, thanh toán) phải **chờ người xác nhận**, không để agent tự bấm.
- **Quyền tối thiểu:** tool chỉ được cấp đúng quyền cần; tách rõ tool **đọc** (an toàn) và tool **ghi/xóa** (nguy hiểm).
- **Giới hạn vòng lặp:** đặt `maxSteps`/timeout/ngân sách token để agent không lặp vô hạn hay đốt tiền.
- **Cẩn thận tool nhận nội dung không tin cậy:** nếu tool đọc web/email, nội dung đó có thể chứa **prompt injection** lái agent làm bậy → xử lý như dữ liệu, không phải lệnh (xem [file 05](./05-evaluation-guardrails-production.md)).

**Bẫy thường gặp:**

- Cho agent tool xóa/gửi mà không có bước xác nhận → một lần model hiểu sai là mất dữ liệu thật.
- **Câu hỏi nối tiếp:** *"Chống agent bị injection lái tay?"* → tách kênh lệnh (system/user) với dữ liệu công cụ, chặn hành động nhạy cảm sau nội dung không tin cậy, luôn cần người duyệt bước không thể đảo ngược.

> **Câu chốt phỏng vấn:** "Em mặc định chọn workflow có kiểm soát; chỉ nâng lên agent khi các bước không đoán trước được. Và mọi hành động không thể hoàn tác đều phải qua human-in-the-loop."
