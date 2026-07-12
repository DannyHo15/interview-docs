# 🗃️ 02 — Xử lý dữ liệu lớn ở trình duyệt (Large Datasets)

> JD ghi rõ "làm việc tốt với large datasets và analytics UI". Đây là câu gần như chắc chắn bị đào sâu. Ký hiệu 🔥 = câu cực hay gặp.

---

## 0. Nguyên tắc vàng phải nói đầu tiên 🔥

Trước khi liệt kê kỹ thuật, hãy nêu nguyên tắc gốc — nó cho thấy bạn tư duy đúng:

> **"Trình duyệt không phải nơi xử lý dữ liệu lớn. Việc lọc, gom nhóm, tính toán nặng nên đẩy về backend/database. Frontend chỉ nên nhận dữ liệu đã được tổng hợp sẵn và lo phần hiển thị."**

Lý do:

1. Database có **index** và được tối ưu cho việc lọc/gom nhóm — nhanh hơn nhiều so với làm bằng JavaScript.
2. Gửi cả triệu dòng về trình duyệt tốn **băng thông** và **bộ nhớ**, và trình duyệt sẽ đơ khi xử lý.
3. Tách bạch trách nhiệm rõ ràng: backend lo dữ liệu, frontend lo giao diện.

Chỉ khi **buộc phải** xử lý dữ liệu lớn ở client (ví dụ dữ liệu đã tải về để tương tác offline, hoặc yêu cầu lọc tức thì không round-trip), mới dùng các kỹ thuật bên dưới.

---

## 1. Virtualization (windowing) cho bảng/danh sách dài 🔥

**Định nghĩa ngắn:** Chỉ **render những dòng đang nằm trong vùng nhìn thấy** của màn hình, thay vì render cả nghìn dòng. Khi người dùng cuộn, thay nội dung các dòng cho khớp vị trí mới.

**Giải thích sâu:**

- Một bảng 10.000 dòng nếu render hết sẽ tạo 10.000 hàng DOM, khiến trình duyệt chậm ngay từ lúc dựng. Với virtualization, tại một thời điểm chỉ có khoảng 20–30 dòng thực sự tồn tại trong DOM (số dòng vừa đủ lấp màn hình cộng một ít đệm).
- Kỹ thuật này giữ một vùng cuộn có **chiều cao giả** đúng bằng tổng số dòng, tạo cảm giác cuộn bình thường, nhưng chỉ vẽ phần đang thấy.
- Thư viện phổ biến: `@tanstack/react-virtual`, `react-window`.

**Bẫy thường gặp:**

- Virtualization khó hơn khi các dòng có **chiều cao khác nhau** (dynamic height) — cần đo hoặc ước lượng chiều cao. Đây là câu follow-up hay gặp.
- Nội dung ẩn không được trình duyệt tìm kiếm bằng `Ctrl+F` (vì không có trong DOM). Đó là đánh đổi cần biết.
- **Câu hỏi nối tiếp:** *"Có áp dụng cho chart được không?"* → Ý tưởng tương tự nhưng thường không cần: với chart, ta giảm dữ liệu bằng downsampling (mục 3) thay vì windowing.

---

## 2. Web Worker cho tính toán nặng 🔥

**Định nghĩa ngắn:** Web Worker là một **luồng chạy song song** tách khỏi luồng chính (main thread). Đẩy các phép tính nặng vào đó để giao diện không bị đơ.

**Giải thích sâu:**

- JavaScript trong trình duyệt chạy một luồng duy nhất. Nếu luồng đó bận tính toán nặng (ví dụ gom nhóm 500.000 điểm), thì mọi thao tác của người dùng — cuộn, gõ, bấm — đều bị chặn, gây "đơ".
- Web Worker chạy trên luồng riêng, nên khi nó tính, giao diện vẫn phản hồi mượt. Giao tiếp giữa luồng chính và worker qua cơ chế gửi tin nhắn (`postMessage`).
- Hợp cho: gom nhóm/tổng hợp dữ liệu lớn, phân tích, xử lý dữ liệu thô từ file (CSV lớn) mà không thể đẩy về backend.

**Bẫy thường gặp:**

- Gửi dữ liệu qua lại giữa luồng chính và worker có chi phí **sao chép**. Với dữ liệu rất lớn, chi phí này đáng kể; có thể dùng `Transferable` (chuyển quyền sở hữu bộ nhớ thay vì copy) để tránh.
- Đừng lạm dụng: nếu phép tính nhẹ, chi phí lập worker còn tốn hơn lợi ích. Chỉ dùng khi tính toán thực sự nặng và gây giật đo được.
- **Câu hỏi nối tiếp:** *"Sao không đẩy hết về backend?"* → Nên đẩy về backend là mặc định. Web Worker chỉ dùng khi buộc phải tính ở client (dữ liệu đã ở client, hoặc cần tương tác tức thì không muốn round-trip mạng).

---

## 3. Downsampling dữ liệu time-series 🔥

**Định nghĩa ngắn:** Khi có quá nhiều điểm để vẽ (ví dụ 1 triệu điểm trên màn hình rộng 1.000 pixel), **giảm số điểm** xuống mức đủ để mắt thấy đúng hình dạng, vì màn hình vốn không đủ pixel để hiển thị hết.

**Giải thích sâu:**

- Màn hình chỉ có chừng ấy pixel ngang. Vẽ 1 triệu điểm lên 1.000 pixel là vô nghĩa — nhiều điểm chồng lên cùng một pixel. Nên chỉ cần khoảng vài nghìn điểm là đã đủ độ chi tiết mắt phân biệt được.
- Cách giảm điểm ngây thơ (lấy mỗi điểm thứ N) có nhược điểm: **dễ bỏ sót các đỉnh nhọn** (spike) — mà trong giám sát mạng, spike chính là sự cố cần thấy.
- Thuật toán tốt hơn là **LTTB (Largest-Triangle-Three-Buckets)**: chia dữ liệu thành các nhóm, mỗi nhóm chọn điểm giữ được "hình dạng" của đường tốt nhất. Nó bảo toàn các đỉnh/đáy quan trọng dù giảm mạnh số điểm. Nhớ tên thuật toán này là một điểm cộng lớn khi phỏng vấn.
- **Nơi làm downsampling:** tốt nhất ở **backend/database** (gom theo khoảng thời gian), gửi về frontend đã gọn. Chỉ downsample ở client khi dữ liệu đã ở sẵn trên client.

**Bẫy thường gặp:**

- Downsample bằng cách lấy trung bình mỗi khoảng sẽ **làm phẳng các đỉnh** — che mất sự cố. Với giám sát, thường nên giữ cả **min và max** của mỗi khoảng để không mất đỉnh (ví dụ hiển thị dải min–max).
- **Câu hỏi nối tiếp:** *"Khi người dùng zoom vào thì sao?"* → Zoom vào một khoảng nhỏ thì query lại dữ liệu chi tiết của đúng khoảng đó (thường gọi thêm API), không giữ toàn bộ dữ liệu độ phân giải cao trong bộ nhớ.

---

## 4. Phân trang & tải theo nhu cầu (pagination, lazy load)

**Định nghĩa ngắn:** Không tải toàn bộ dữ liệu một lần. Tải từng trang, hoặc tải thêm khi người dùng cần (cuộn tới, mở rộng mục).

**Giải thích sâu:**

- **Offset pagination** (`LIMIT`/`OFFSET`): đơn giản, nhảy trang được, nhưng chậm dần khi offset lớn (database vẫn phải quét qua các dòng bị bỏ).
- **Cursor/keyset pagination**: dùng một mốc (ví dụ timestamp hoặc id của dòng cuối) để lấy trang tiếp theo. Nhanh và ổn định kể cả với dữ liệu rất lớn, hợp với luồng "tải thêm" liên tục — như log/sự kiện đổ về theo thời gian.
- Với dashboard giám sát, dữ liệu sự kiện (log lỗi CPE, cảnh báo) thường hợp với cursor pagination theo thời gian.

**Bẫy thường gặp:**

- Offset lớn (ví dụ trang 10.000) rất chậm — nếu thấy dữ liệu lớn và cần cuộn sâu, chọn cursor pagination.
- **Câu hỏi nối tiếp:** *"Khác nhau offset vs cursor?"* → Offset đếm số dòng bỏ qua (chậm khi sâu, có thể trùng/sót nếu dữ liệu thay đổi giữa chừng); cursor nhớ vị trí bằng một mốc (nhanh, ổn định, nhưng không nhảy tùy ý tới trang bất kỳ).

---

## 5. Giảm tải re-render trong React 🔥

**Định nghĩa ngắn:** Ngay cả khi dữ liệu đã gọn, React vẫn có thể chậm nếu render lại quá nhiều. Cần cắt bớt render thừa.

**Giải thích sâu:**

- **Ghi nhớ kết quả tính nặng** bằng `useMemo` (ví dụ lọc/sắp xếp một mảng lớn chỉ tính lại khi dữ liệu nguồn đổi, không tính lại mỗi lần render).
- **Chặn re-render component con** bằng `React.memo`: component chart chỉ render lại khi props của nó thực sự đổi, không bị kéo theo khi cha render vì lý do khác.
- **Tách nhỏ state:** đặt state cập nhật thường xuyên (ví dụ chuỗi dữ liệu real-time) càng gần nơi dùng càng tốt, để mỗi lần đổi không kéo cả trang render lại.
- **Cập nhật chart qua ref**: với chart real-time, giữ instance chart qua `useRef` và cập nhật bằng API mệnh lệnh của thư viện, tránh để React quản lý từng điểm dữ liệu.

**Bẫy thường gặp:**

- **Lạm dụng `useMemo`/`useCallback`** cũng có hại: mỗi cái đều tốn chi phí ghi nhớ và so sánh. Chỉ dùng cho tính toán thực sự nặng hoặc để giữ tham chiếu ổn định cho `React.memo`. Đây là câu bẫy kinh điển — trả lời "dùng cho mọi thứ cho chắc" là mất điểm.
- **Câu hỏi nối tiếp:** *"Làm sao biết chỗ nào chậm?"* → Đo trước, tối ưu sau. Dùng React DevTools Profiler để tìm component render nhiều/lâu, và Performance tab của trình duyệt để tìm tác vụ chặn luồng chính. (Đây chính là cách đã làm ở dự án tối ưu 8 giây xuống 1 giây.)

---

## 6. Bộ đệm server-state (React Query / TanStack Query)

**Định nghĩa ngắn:** Thư viện quản lý dữ liệu lấy từ server: tự lo cache, khử trùng lặp request, làm mới nền, và trạng thái loading/error.

**Giải thích sâu:**

- Với dashboard nhiều widget, mỗi widget tự fetch dữ liệu của mình với một **query key** riêng (ví dụ theo device ID). Nhờ đó khi dữ liệu một thiết bị đổi, chỉ widget của thiết bị đó cập nhật, không đụng các widget khác.
- Cache và **stale-while-revalidate** giúp chuyển tab/mở lại nhanh: hiện dữ liệu cũ ngay rồi làm mới ngầm.
- **Khử trùng lặp request**: nhiều widget cùng cần một nguồn dữ liệu sẽ chỉ tạo một request.

**Bẫy thường gặp:**

- Đừng nhét dữ liệu server vào global store (Redux/Zustand) rồi tự đồng bộ tay — dễ lỗi. Server-state để React Query lo; global store chỉ giữ UI state (bộ lọc, tab đang chọn, theme).
- **Câu hỏi nối tiếp:** *"Real-time thì cache cập nhật sao?"* → Khi nhận đẩy từ WebSocket/SSE, ghi thẳng vào cache theo query key tương ứng (ví dụ `queryClient.setQueryData`), chart sẽ tự cập nhật.

---

## Tóm tắt — thứ tự ưu tiên khi bị hỏi "dataset lớn làm sao?"

1. **Đẩy xử lý về backend** (lọc, gom nhóm, phân trang, downsample) — luôn nói câu này đầu tiên.
2. **Downsampling** cho time-series (nhắc thuật toán LTTB, giữ min/max để không mất đỉnh).
3. **Virtualization** cho bảng/danh sách dài.
4. **Pagination** (cursor cho dữ liệu lớn/cuộn sâu).
5. **Web Worker** khi buộc phải tính nặng ở client.
6. **Giảm re-render React** (`useMemo`, `React.memo`, cập nhật chart qua ref).
7. **Chart canvas** thay vì SVG khi nhiều điểm (xem [file 01](./01-charting-libraries.md)).

---

🔗 [Trước: 01 — Charting Libraries](./01-charting-libraries.md) · [Tiếp: 03 — SQL cho Dashboard](./03-sql-for-dashboards.md)
