# 🧮 03 — SQL cho Dashboard

> JD yêu cầu "kiến thức cơ bản về SQL và truy vấn dữ liệu". Không cần là chuyên gia DB, nhưng phải viết được các query tổng hợp cho dashboard và hiểu index. Ký hiệu 🔥 = câu cực hay gặp.

---

## 0. Bối cảnh: dữ liệu dashboard viễn thông trông thế nào

Hình dung một bảng đo lường (telemetry) — mỗi dòng là một lần đo từ một thiết bị CPE:

```
Bảng: cpe_metrics
┌────────────┬───────────┬──────────┬────────────┬─────────────┬─────────────────────┐
│ device_id  │ region    │ latency  │ throughput │ packet_loss │ measured_at         │
├────────────┼───────────┼──────────┼────────────┼─────────────┼─────────────────────┤
│ CPE-001    │ HCM-Q7    │ 12.5     │ 94.2       │ 0.1         │ 2026-07-12 08:00:00 │
│ CPE-001    │ HCM-Q7    │ 15.1     │ 91.0       │ 0.3         │ 2026-07-12 08:01:00 │
│ CPE-002    │ HCM-Q1    │ 40.2     │ 45.0       │ 2.1         │ 2026-07-12 08:00:00 │
└────────────┴───────────┴──────────┴────────────┴─────────────┴─────────────────────┘
```

Đa số câu hỏi SQL cho dashboard xoay quanh: **lọc → gom nhóm → tính tổng hợp → theo thời gian**.

---

## 1. Cấu trúc một câu SELECT và thứ tự thực thi 🔥

**Định nghĩa ngắn:** Một câu query đọc theo thứ tự viết, nhưng database **thực thi theo thứ tự khác**. Hiểu điều này giải thích được nhiều lỗi hay gặp.

```sql
SELECT   region, AVG(latency) AS avg_latency   -- 5. chọn cột & tính tổng hợp
FROM     cpe_metrics                            -- 1. lấy từ bảng nào
WHERE    measured_at >= '2026-07-12'            -- 2. lọc từng dòng (trước khi gom)
GROUP BY region                                 -- 3. gom nhóm
HAVING   AVG(latency) > 20                       -- 4. lọc sau khi gom
ORDER BY avg_latency DESC                        -- 6. sắp xếp
LIMIT    10;                                     -- 7. giới hạn số dòng
```

**Giải thích sâu — thứ tự thực thi thực tế:** `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.

- **`WHERE` lọc trên từng dòng gốc**, chạy **trước** khi gom nhóm.
- **`HAVING` lọc trên kết quả đã gom nhóm**, chạy **sau** `GROUP BY`. Dùng khi điều kiện lọc dựa vào giá trị tổng hợp (như `AVG(latency) > 20`).

**Bẫy thường gặp:**

- Không được đặt điều kiện trên hàm tổng hợp trong `WHERE` (ví dụ `WHERE AVG(latency) > 20` là **sai**) — phải dùng `HAVING`, vì lúc `WHERE` chạy thì chưa gom nhóm nên chưa có giá trị trung bình.
- **Câu hỏi nối tiếp:** *"`WHERE` với `HAVING` khác gì?"* → `WHERE` lọc dòng trước khi gom, `HAVING` lọc nhóm sau khi gom. Nếu lọc được bằng `WHERE` thì ưu tiên `WHERE` vì nó cắt bớt dữ liệu sớm hơn (nhanh hơn).

---

## 2. Hàm tổng hợp & GROUP BY 🔥

**Định nghĩa ngắn:** Gom nhiều dòng thành các nhóm rồi tính một giá trị đại diện cho mỗi nhóm. Đây là trái tim của mọi dashboard.

```sql
-- Latency trung bình, cao nhất, và số lần đo — theo từng khu vực
SELECT
  region,
  COUNT(*)        AS so_lan_do,
  AVG(latency)    AS latency_tb,
  MAX(latency)    AS latency_max,
  MAX(packet_loss) AS mat_goi_max
FROM cpe_metrics
WHERE measured_at >= '2026-07-12'
GROUP BY region;
```

**Giải thích sâu:**

- Các hàm tổng hợp cơ bản cần thuộc lòng: `COUNT` (đếm), `SUM` (tổng), `AVG` (trung bình), `MIN`/`MAX` (nhỏ/lớn nhất).
- **Quy tắc bắt buộc:** mọi cột trong `SELECT` mà không nằm trong hàm tổng hợp thì **phải có mặt trong `GROUP BY`**. Ví dụ trên, `region` phải nằm trong `GROUP BY`.
- Gom theo nhiều cột được: `GROUP BY region, device_id` cho ra một nhóm cho mỗi cặp (khu vực, thiết bị).

**Bẫy thường gặp:**

- `COUNT(*)` đếm tất cả dòng; `COUNT(cot)` **bỏ qua giá trị NULL** của cột đó; `COUNT(DISTINCT cot)` đếm số giá trị khác nhau. Ba cái này hay bị hỏi phân biệt.
- Các hàm tổng hợp **bỏ qua NULL** (trừ `COUNT(*)`). Ví dụ `AVG` tính trung bình chỉ trên các dòng có giá trị, không coi NULL là 0 — điều này có thể gây hiểu nhầm số liệu.
- **Câu hỏi nối tiếp:** *"Đếm số thiết bị khác nhau có lỗi hôm nay?"* → `SELECT COUNT(DISTINCT device_id) FROM cpe_metrics WHERE packet_loss > 1 AND measured_at >= '2026-07-12';`

---

## 3. Gom nhóm theo thời gian (time bucketing) 🔥

**Định nghĩa ngắn:** Dashboard time-series cần gom dữ liệu theo khoảng thời gian đều (mỗi giờ, mỗi phút) để vẽ đường xu hướng. Đây là dạng query đặc trưng nhất của role này.

```sql
-- Latency trung bình theo TỪNG GIỜ trong ngày (PostgreSQL)
SELECT
  date_trunc('hour', measured_at) AS gio,
  AVG(latency)                     AS latency_tb
FROM cpe_metrics
WHERE measured_at >= '2026-07-12'
GROUP BY date_trunc('hour', measured_at)
ORDER BY gio;
```

**Giải thích sâu:**

- `date_trunc('hour', measured_at)` cắt mốc thời gian về đầu giờ (ví dụ `08:37` → `08:00`), nên mọi lần đo trong cùng một giờ rơi vào cùng một nhóm. Đổi `'hour'` thành `'day'`, `'minute'` để đổi độ mịn.
- Đây chính là cách **downsampling ở tầng database** đã nhắc ở [file 02](./02-large-datasets.md): thay vì gửi cả triệu điểm về frontend, database gom sẵn thành 24 điểm (mỗi giờ một điểm), frontend chỉ việc vẽ.
- Mỗi database có cú pháp riêng: PostgreSQL dùng `date_trunc`; MySQL dùng `DATE_FORMAT` hoặc `FLOOR`; các database time-series chuyên dụng (TimescaleDB, InfluxDB) có hàm bucket riêng tối ưu hơn.

**Bẫy thường gặp:**

- Nếu một khoảng thời gian **không có dữ liệu** (thiết bị offline cả tiếng), query sẽ **không có dòng cho khoảng đó** — biểu đồ bị "nhảy cóc". Để có đủ mọi mốc thời gian, cần tạo dải thời gian đầy đủ rồi nối (LEFT JOIN) với dữ liệu — đây là câu follow-up nâng cao, biết là điểm cộng.
- **Câu hỏi nối tiếp:** *"Muốn giữ cả đỉnh nhọn khi gom theo giờ thì sao?"* → Lấy thêm `MAX(latency)` và `MIN(latency)` cho mỗi giờ, không chỉ `AVG`, để không che mất spike.

---

## 4. JOIN — nối bảng 🔥

**Định nghĩa ngắn:** Dữ liệu đo (metric) thường ở một bảng, thông tin thiết bị (model, firmware, chủ thuê bao) ở bảng khác. `JOIN` nối chúng lại theo khóa chung.

```sql
-- Nối bảng đo với bảng thông tin thiết bị để hiện tên model
SELECT
  d.model,
  AVG(m.latency) AS latency_tb
FROM cpe_metrics m
JOIN devices d ON d.device_id = m.device_id
WHERE m.measured_at >= '2026-07-12'
GROUP BY d.model;
```

**Giải thích sâu:**

- **`INNER JOIN`** (viết tắt `JOIN`): chỉ giữ các dòng **khớp ở cả hai bảng**. Nếu một lần đo không tìm thấy thiết bị tương ứng, dòng đó bị loại.
- **`LEFT JOIN`**: giữ **tất cả dòng của bảng bên trái**, bên phải không khớp thì để NULL. Dùng khi muốn "mọi thiết bị, kể cả thiết bị chưa có dữ liệu đo".
- Điều kiện nối đặt sau `ON`, thường là khóa ngoại (`device_id` ở đây).

**Bẫy thường gặp:**

- Quên điều kiện `ON` (hoặc nối sai khóa) sẽ tạo **tích Descartes** — mỗi dòng bảng này nhân với mọi dòng bảng kia, ra số dòng khổng lồ và sai. Đây là lỗi kinh điển.
- Chọn nhầm `INNER` khi cần `LEFT` sẽ **âm thầm mất dữ liệu** (mất các thiết bị không khớp) mà không báo lỗi — nguy hiểm vì khó phát hiện.
- **Câu hỏi nối tiếp:** *"`INNER` với `LEFT JOIN` khác gì?"* → INNER chỉ giữ dòng khớp cả hai bên; LEFT giữ hết bên trái, phần thiếu bên phải là NULL.

---

## 5. Window functions — nâng cao nhưng ghi điểm

**Định nghĩa ngắn:** Hàm cửa sổ tính toán trên một "cửa sổ" các dòng liên quan **mà vẫn giữ nguyên từng dòng** (khác `GROUP BY` gộp mất dòng). Rất mạnh cho phân tích: xếp hạng, so với dòng trước, trung bình trượt.

```sql
-- Xếp hạng thiết bị theo latency trong mỗi khu vực
SELECT
  device_id,
  region,
  latency,
  RANK() OVER (PARTITION BY region ORDER BY latency DESC) AS hang
FROM cpe_metrics;
```

**Giải thích sâu:**

- `OVER (...)` định nghĩa cửa sổ. `PARTITION BY region` chia dữ liệu theo khu vực (như GROUP BY nhưng không gộp dòng), `ORDER BY` quyết định thứ tự trong cửa sổ.
- Ứng dụng cho dashboard: **top N thiết bị lỗi nhiều nhất mỗi khu vực**, **trung bình trượt (moving average)** để làm mượt đường latency, **so sánh với lần đo trước** (`LAG`) để phát hiện đột biến.

**Bẫy thường gặp:**

- Khác biệt cốt lõi với `GROUP BY`: `GROUP BY` **giảm số dòng** (mỗi nhóm một dòng); window function **giữ nguyên số dòng**, chỉ thêm cột tính toán. Nắm ý này là đủ ghi điểm dù không thuộc cú pháp chi tiết.
- **Câu hỏi nối tiếp:** *"Nếu không thuộc window function thì sao?"* → Thành thật là được: "Em biết khái niệm và biết khi nào cần (top-N mỗi nhóm, moving average), còn cú pháp chi tiết em tra khi làm." Trung thực tốt hơn chém.

---

## 6. Index — vì sao query chậm/nhanh 🔥

**Định nghĩa ngắn:** Index là một cấu trúc phụ giúp database **tìm nhanh** các dòng thỏa điều kiện, thay vì quét toàn bộ bảng. Giống mục lục của một cuốn sách.

**Giải thích sâu:**

- Không có index, để tìm các dòng `WHERE device_id = 'CPE-001'`, database phải đọc **từng dòng** trong bảng (full table scan) — chậm khủng khiếp khi bảng lớn.
- Có index trên `device_id`, database tra thẳng tới đúng vùng dữ liệu — nhanh hơn nhiều bậc.
- Nên đánh index lên các cột **hay dùng trong `WHERE`, `JOIN`, và `ORDER BY`**. Với dữ liệu telemetry, hai cột hay được index nhất là `device_id` và `measured_at` (thường index chung theo cặp vì query hay lọc theo thiết bị + khoảng thời gian).

**Bẫy thường gặp:**

- Index **không miễn phí**: mỗi index làm chậm thao tác ghi (INSERT/UPDATE phải cập nhật cả index) và tốn dung lượng. Đừng đánh index bừa mọi cột.
- Index có thể **bị bỏ qua** nếu viết điều kiện làm biến đổi cột, ví dụ `WHERE DATE(measured_at) = '2026-07-12'` khiến index trên `measured_at` không dùng được. Nên viết `WHERE measured_at >= '2026-07-12' AND measured_at < '2026-07-13'` để tận dụng index.
- **Câu hỏi nối tiếp:** *"Làm sao biết query có dùng index không?"* → Dùng `EXPLAIN` (hoặc `EXPLAIN ANALYZE`) trước câu query — nó cho thấy database định quét toàn bảng hay dùng index. Biết `EXPLAIN` là điểm cộng rõ.

---

## 7. Ranh giới frontend / backend — câu "cửa" phải trả lời đúng 🔥

**Định nghĩa ngắn:** Với vai trò frontend, người phỏng vấn muốn nghe bạn hiểu **nên xử lý dữ liệu ở đâu**.

**Câu trả lời chuẩn:**

> "Em xử lý dữ liệu nặng — query, gom nhóm, phân trang, downsample — ở **backend/database**, nơi có index và được tối ưu cho việc đó. Frontend chỉ nhận dữ liệu đã tổng hợp qua API (REST/GraphQL) và lo phần hiển thị. Em biết SQL đủ để **đọc hiểu, viết query tổng hợp, và trao đổi với backend về hình dạng dữ liệu mình cần** cho từng chart — chứ không nhúng SQL vào client."

**Vì sao đây là đáp án đúng:**

1. Không để lộ cấu trúc/logic database ra client (an toàn).
2. Tận dụng index và tối ưu của database (nhanh).
3. Không kéo dataset khổng lồ về trình duyệt (nhẹ).
4. SQL với frontend là công cụ để **giao tiếp với backend**, không phải để chạy trong trình duyệt.

**Bẫy thường gặp:**

- Đừng thể hiện rằng bạn sẽ tải hết dữ liệu thô về rồi lọc bằng JavaScript — đó là dấu hiệu tư duy sai về hiệu năng.
- **Câu hỏi nối tiếp:** *"Vậy học SQL để làm gì nếu backend lo hết?"* → Để định nghĩa đúng dữ liệu cần cho mỗi chart, hiểu vì sao một endpoint chậm (thiếu index? query nặng?), và phối hợp với backend hiệu quả — đôi khi chính bạn viết cả script/endpoint đơn giản, đúng như JD mô tả ("phát triển API hoặc script phục vụ dashboard").

---

## Tóm tắt — cần thuộc lòng gì cho vòng SQL

1. **SELECT ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT** và thứ tự thực thi thực tế.
2. **Hàm tổng hợp**: `COUNT` / `SUM` / `AVG` / `MIN` / `MAX`, phân biệt `COUNT(*)` vs `COUNT(cot)` vs `COUNT(DISTINCT)`.
3. **Gom nhóm theo thời gian** (`date_trunc`) — dạng query đặc trưng của dashboard time-series.
4. **JOIN**: phân biệt `INNER` vs `LEFT`, luôn có điều kiện `ON`.
5. **Index**: hiểu nó tăng tốc đọc, làm chậm ghi; index `device_id` + `measured_at` cho telemetry.
6. **Ranh giới FE/BE**: xử lý nặng ở backend, frontend chỉ hiển thị.
7. (Bonus) **Window function** và **`EXPLAIN`** — biết khái niệm là ghi điểm.

---

🔗 [Trước: 02 — Large Datasets](./02-large-datasets.md) · [Về index Data Dashboard](./index.md)
