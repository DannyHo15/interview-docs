# 📊 04 — Giao diện phân tích số liệu (Analytics UI)

> JD ghi "large datasets **và analytics UI**". File 02 lo phần *dữ liệu* (hiệu năng), file này lo phần *giao diện* — thiết kế UI để người vận hành **đọc số và ra quyết định nhanh**. Đây là chỗ phân biệt "biết vẽ chart" với "hiểu làm dashboard". Ký hiệu 🔥 = câu hay gặp.

---

## 1. Giải phẫu một dashboard phân tích — phân tầng thông tin 🔥

**Định nghĩa ngắn:** Một analytics UI tốt không phải "nhiều chart", mà là **thông tin được xếp theo tầng** để mắt đi từ tổng quan xuống chi tiết.

**Giải thích sâu:**

- **Tầng 1 — KPI tổng (top).** Vài con số quan trọng nhất đặt trên cùng dạng thẻ (KPI card): tổng CPE online/offline, điểm QoE trung bình, số cảnh báo đang mở. Kèm **so sánh** (▲▼ so với hôm qua) thì số mới có nghĩa.
- **Tầng 2 — xu hướng & phân bố (giữa).** Time-series cho xu hướng theo thời gian, bar/heatmap cho phân bố theo khu vực/model.
- **Tầng 3 — chi tiết (dưới / drill-down).** Bảng dữ liệu thô, log sự kiện, danh sách thiết bị lỗi — nơi người dùng lần tới từng dòng.
- **Vị trí ưu tiên:** thứ quan trọng nhất đặt **trên–trái** (mắt người đọc theo hình F). Đừng để KPI sống còn nằm cuối trang.

**Bẫy thường gặp:**

- Nhồi 20 chart lên một màn "cho đầy" → không ai đọc được. Mỗi màn nên trả lời **một câu hỏi** ("mạng khu vực nào đang có vấn đề?").
- Số đứng một mình vô nghĩa — luôn kèm **mốc so sánh** (kỳ trước, mục tiêu, ngưỡng).
- **Câu hỏi nối tiếp:** *"Nhiều loại user (kỹ thuật viên vs quản lý) thì sao?"* → Quản lý cần tầng 1 (KPI tổng); kỹ thuật viên cần tầng 3 (drill-down). Tách view theo vai trò, hoặc cho drill-down từ tổng xuống chi tiết trong cùng UI.

---

## 2. Bộ lọc & cross-filtering 🔥

**Định nghĩa ngắn:** Analytics UI xoay quanh **lọc**: theo thời gian, khu vực, thiết bị. "Cross-filtering" = bấm vào một phần tử (một cột, một vùng bản đồ) thì các chart khác lọc theo luôn.

**Giải thích sâu:**

- **Bộ lọc toàn cục** (date range, khu vực) đặt ở đầu trang, áp cho mọi widget. Mỗi widget vẫn tự fetch theo filter đó (query key gồm cả filter — xem file 02 §6).
- **Cross-filter**: click cột "Quận 7" ở bar chart → time-series và bảng bên dưới tự lọc về Quận 7. Cực mạnh cho phân tích khám phá (exploratory).
- **Giữ trạng thái lọc trong URL** (query params): người dùng share link là người khác thấy đúng góc nhìn đó; refresh không mất filter. Đây là điểm ghi điểm về UX.

**Bẫy thường gặp:**

- Đừng nhét dữ liệu đã lọc vào state rồi tự đồng bộ tay giữa các widget — để **URL/filter state là nguồn sự thật duy nhất**, các widget đọc từ đó.
- Filter đổi mỗi keystroke mà bắn API ngay → **debounce** input (xem file 02).
- **Câu hỏi nối tiếp:** *"Filter nặng, kết quả về chậm, UI đứng hình?"* → Giữ dữ liệu cũ + overlay loading (stale-while-revalidate), đừng xóa trắng màn rồi mới load.

---

## 3. Drill-down & điều hướng phân tích

**Định nghĩa ngắn:** Cho người dùng đi từ **tổng hợp → chi tiết**: từ điểm QoE tổng → các metric thành phần → thiết bị cụ thể gây tụt điểm.

**Giải thích sâu:**

- Mỗi mức drill-down thêm một lớp ngữ cảnh — cần **breadcrumb** ("Toàn quốc › Miền Nam › Quận 7 › CPE-1234") để người dùng biết mình đang ở đâu và quay lại được.
- Drill-down thường **gọi API mới** cho đúng phạm vi (không giữ sẵn mọi mức chi tiết trong bộ nhớ — xem downsampling, file 02 §3).
- Giữ **ngữ cảnh lọc** khi drill: đang lọc "24h qua" thì drill xuống vẫn giữ nguyên khoảng thời gian.

**Bẫy thường gặp:**

- Drill-down mà mất filter/thời gian đang chọn → người dùng lạc. Luôn kế thừa ngữ cảnh.
- **Câu hỏi nối tiếp:** *"Drill sâu 4–5 tầng, back thế nào?"* → Trạng thái mỗi tầng nên nằm trong URL để dùng nút back của trình duyệt tự nhiên, không tự dựng lịch sử tay.

---

## 4. Trạng thái rỗng / loading / lỗi — thứ hay bị quên nhất 🔥

**Định nghĩa ngắn:** Analytics UI phải xử lý tử tế 4 trạng thái, không chỉ "happy path có dữ liệu".

**Giải thích sâu:**

- **Loading:** dùng **skeleton** (khung xám nhấp nháy giữ đúng layout) thay vì spinner giữa màn — giảm cảm giác chờ và tránh layout nhảy.
- **Rỗng khác nhau, thông điệp khác nhau:**
  - *Chưa có dữ liệu* ("thiết bị mới, chưa thu thập") → khác với
  - *Không có kết quả cho bộ lọc* ("không CPE nào lỗi trong 24h — tin tốt!") → gợi ý nới filter.
- **Lỗi:** báo rõ + nút thử lại, và **đừng để một widget lỗi làm sập cả dashboard** (bọc mỗi widget trong error boundary — widget hỏng thì chỉ ô đó báo lỗi).
- **Dữ liệu một phần:** vài widget xong trước thì hiện trước, đừng chặn cả trang chờ widget chậm nhất.

**Bẫy thường gặp:**

- Gộp "rỗng" và "lỗi" làm một → người dùng không biết là *không có gì* hay *hệ thống hỏng*. Với dashboard giám sát, phân biệt này quan trọng: "0 cảnh báo" (tốt) vs "không tải được cảnh báo" (nguy hiểm, đang mù).
- **Câu hỏi nối tiếp:** *"Số 0 hiển thị sao cho khỏi nhầm là mất kết nối?"* → Hiện rõ "0" kèm timestamp "cập nhật lúc HH:mm" để chứng minh dữ liệu là mới, không phải đứng hình.

---

## 5. Bảng phân tích: sort, filter, cấu hình cột

**Định nghĩa ngắn:** Tầng chi tiết của analytics UI thường là **bảng lớn** (data grid) — thiết bị, log, sự kiện. Cần thao tác được mà không giật.

**Giải thích sâu:**

- **Sort/filter nên làm ở server** khi dữ liệu lớn (gửi tham số về API), không tải hết về rồi sort ở client — nhất quán với nguyên tắc vàng file 02.
- **Header dính (sticky)** + **virtualization** (file 02 §1) cho bảng dài.
- **Cấu hình cột** (ẩn/hiện, đổi thứ tự) + nhớ lựa chọn của user — analytics UI thực chiến ai cũng cần.
- **Định dạng số**: canh phải cho số, phân tách hàng nghìn, kèm đơn vị (ms, Mbps, %), và **tô màu theo ngưỡng** (latency > 100ms đỏ) để mắt bắt bất thường ngay.

**Bẫy thường gặp:**

- Tô màu **chỉ** bằng màu → người mù màu không đọc được. Kèm icon/nhãn/hình, không dựa riêng vào màu (xem §7).
- **Câu hỏi nối tiếp:** *"Bảng 100k dòng cho sort được không?"* → Sort ở DB (có index trên cột sort), trả về trang đã sort; client chỉ hiển thị. Sort 100k dòng ở JS sẽ đơ.

---

## 6. Điều khiển thời gian & xuất dữ liệu

**Định nghĩa ngắn:** Analytics UI gần như luôn có **chọn khoảng thời gian** và thường cần **export**.

**Giải thích sâu:**

- **Preset thời gian** (24h / 7 ngày / 30 ngày / tùy chọn) nhanh hơn bắt user tự nhập ngày. Kèm **toggle độ chi tiết** (theo phút / giờ / ngày) — gắn với bucket/downsampling ở backend.
- **Export CSV/Excel** cho bảng, **PNG/SVG** cho chart — nhu cầu báo cáo rất thật ở tool nội bộ. Export lượng lớn nên làm ở server (stream file), không dồn ở client.
- **Saved views / shareable URL:** lưu bộ lọc + khoảng thời gian thành link hoặc "view đã lưu" để mở lại nhanh.

**Bẫy thường gặp:**

- Export "toàn bộ" mà build cả file trong bộ nhớ client → sập tab với dữ liệu lớn. Đẩy về server, trả link tải.
- **Câu hỏi nối tiếp:** *"Timezone khi chọn ngày?"* → Chốt rõ hiển thị theo giờ địa phương của user hay giờ hệ thống, và luôn lưu/truyền UTC (xem file 01 §5).

---

## 7. Trực quan cho phân tích: màu, ngưỡng, khả năng đọc

**Định nghĩa ngắn:** Analytics UI dùng màu để **truyền ý nghĩa** (tốt/xấu/ngưỡng), không phải trang trí.

**Giải thích sâu:**

- **Bảng màu nhất quán theo ngữ nghĩa:** xanh = khỏe, vàng = cảnh báo, đỏ = sự cố — dùng thống nhất toàn dashboard để không phải "dịch" lại ở mỗi chart.
- **An toàn cho người mù màu:** ~8% nam giới mù màu đỏ-lục. Đừng chỉ dùng đỏ/lục để phân biệt; thêm **icon, nhãn, hoặc hình dạng**. Ưu tiên palette colorblind-safe.
- **Dải ngưỡng trên chart** (vùng nền đỏ khi vượt SLA) giúp đọc "có vượt ngưỡng không" mà không cần nhìn trục.
- **Đừng lạm dụng màu:** dùng màu cho *bất thường*, để phần bình thường trung tính — mắt sẽ tự bị hút vào chỗ có vấn đề.

**Bẫy thường gặp:**

- Mỗi chart một bảng màu khác nhau → người đọc phải học lại nghĩa màu ở từng chỗ. Thống nhất bằng **design token** (xem file chiến lược §3.5).
- **Câu hỏi nối tiếp:** *"Làm sao người dùng thấy ngay chỗ có sự cố?"* → Nền trung tính, chỉ tô màu điểm bất thường + đẩy alert lên tầng 1; nguyên tắc "quản lý bằng ngoại lệ" (management by exception).

---

## Tóm tắt — nói gì khi bị hỏi "thiết kế analytics UI thế nào?"

1. **Phân tầng thông tin**: KPI tổng → xu hướng → drill-down chi tiết; quan trọng nhất trên–trái.
2. **Lọc là trung tâm**: filter toàn cục + cross-filter, trạng thái lọc giữ trong URL.
3. **Drill-down kế thừa ngữ cảnh**, có breadcrumb, mỗi tầng gọi API riêng.
4. **Xử lý đủ 4 trạng thái**: skeleton loading, phân biệt rỗng vs lỗi, error boundary từng widget.
5. **Bảng**: sort/filter ở server, virtualization, định dạng số + tô ngưỡng.
6. **Màu có ngữ nghĩa + colorblind-safe**, quản lý bằng ngoại lệ.

---

🔗 [Trước: 03 — SQL cho Dashboard](./03-sql-for-dashboards.md) · [Về index Data Dashboard](./index.md)
