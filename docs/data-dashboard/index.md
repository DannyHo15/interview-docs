# 📊 Data Dashboard — Chiều sâu kỹ thuật

> Bộ tài liệu này bổ trợ cho phần **chiến lược phỏng vấn** ở [`cv/interview_prep_fpt_telecom.md`](../cv/interview_prep_fpt_telecom.md). File chiến lược dạy bạn **pitch thế nào**; bộ này dạy bạn **trả lời sâu thế nào** khi người phỏng vấn đào tiếp.

## Bối cảnh JD

Role này là **Front-End thuần, chuyên dashboard giám sát hạ tầng viễn thông** (CPE, Wi-Fi, network, QoE). Đọc kỹ JD, có **4 trụ cột kỹ thuật** mà bạn gần như chắc chắn bị hỏi đào sâu:

| Trụ cột JD | Câu hỏi hay bị đào | Đọc file |
|---|---|---|
| Trực quan hóa dữ liệu (chart time-series, bar, pie, heatmap) | "So sánh ECharts / Recharts / D3? Canvas hay SVG? Vẽ 100k điểm thì làm sao?" | [01 — Charting Libraries](./01-charting-libraries.md) |
| Xử lý dữ liệu lớn (data-heavy) | "Dataset 1 triệu dòng — làm sao không giật? Downsample thế nào?" | [02 — Large Datasets](./02-large-datasets.md) |
| Truy vấn dữ liệu, SQL cơ bản | "Viết query lấy latency trung bình theo giờ? GROUP BY? Index?" | [03 — SQL cho Dashboard](./03-sql-for-dashboards.md) |
| Giao diện phân tích (analytics UI) | "Thiết kế analytics UI thế nào? Filter/cross-filter? Trạng thái rỗng vs lỗi?" | [04 — Analytics UI](./04-analytics-ui.md) |

## Cách dùng bộ này

1. **Đọc file chiến lược trước** để nắm cách pitch và domain (CPE/Wi-Fi/QoE là gì).
2. **Đọc 4 file này** để có đạn dược trả lời follow-up kỹ thuật.
3. Mỗi câu vẫn theo cấu trúc quen thuộc: **Định nghĩa ngắn → Giải thích sâu → Bẫy & câu hỏi nối tiếp**.

## Liên quan

- [Frontend System Design — Real-time Dashboard](../frontend-system-design/04-dashboard.md) — bài thiết kế dashboard tổng quát.
- [Frontend — Performance](../frontend/03-performance.md) — tối ưu render React nói chung.
- [Backend — Databases](../backend/01-databases.md) — nền tảng SQL/index sâu hơn.
