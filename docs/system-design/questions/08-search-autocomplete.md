# 08 — Design Search Autocomplete (Typeahead) 🔥 📝 (tự luyện)

> **Loại:** Medium · Hỏi rất thường ("Google suggest khi gõ").
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Khi user gõ từng ký tự vào ô search → gợi ý top 10 từ/cụm từ phổ biến khớp prefix. Kết quả < 50ms.

## ❓ Clarifying questions nên hỏi
- Gợi ý theo **toàn hệ thống** hay **cá nhân hoá** (lịch sử user)?
- Có kèm **số lần tìm** (để rank phổ biến) không?
- Nguồn dữ liệu: từ search log real-time?
- Số lượng query unique / alphabet scale?

## 📐 Estimation hints
- Latency < 50ms → phải serve từ **memory**, không query DB.
- Update top-K định kỳ (vd mỗi几分钟).

## 🎯 Trọng tâm / keywords
- **Trie (prefix tree)** — cấu trúc cốt lõi để tìm theo prefix.
- Mỗi node lưu **top-K** suggestion → không cần sort lúc query (pre-compute).
- **Sharding:** theo prefix chữ cái đầu (`a*`, `b*`...) để chia tải.
- **Data pipeline:** search log → Kafka → aggregate count → build/update Trie.
- **Caching** kết quả ở client (browser) + CDN/edge cho query phổ biến.
- **Personalization:** layer riêng dùng lịch sử user.
- **Trending / decay:** giảm weight query cũ (time decay) để gợi ý "hot".
- Memory optimisation: **DAWG / FST** (finite state transducer) nén.

## ✅ Checklist tự đánh giá
- [ ] Đã chọn Trie + giải thích top-K per node?
- [ ] Đã thiết kế pipeline update (log → aggregate → trie)?
- [ ] Đã nói sharding để scale memory?
- [ ] Đã xử lý latency (< 50ms, serve from memory)?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
