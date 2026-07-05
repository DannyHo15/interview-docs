# 09 — Design a Web Crawler 📝 (tự luyện)

> **Loại:** Medium · Cổ điển, hỏi khi phỏng vấn search/big-data team.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Crawler cào (scrape) hàng tỷ trang web liên tục, trích link mới, download content cho search indexer. Polite, không cào trùng, cập nhật trang cũ.

## ❓ Clarifying questions nên hỏi
- **Scope:** cào cả web hay chỉ 1 domain?
- **Politeness:** tôn trọng `robots.txt`, rate limit per domain?
- **Freshness:** re-crawl bao lâu 1 lần?
- Lưu **HTML** hay chỉ trích **text/index**?
- Mục tiêu: search index hay archiving?

## 📐 Estimation hints
- Hàng tỷ trang → distributed, nhiều worker.
- Bandwidth + storage khổng lồ.

## 🎯 Trọng tâm / keywords
- **URL frontier (queue):** BFS queue chứa URL chờ cào; **priority** (trang quan trọng trước).
- **Politeness:** mỗi domain 1 queue riêng + rate limit (vd 1 req/giây/domain).
- **Dedup:** **Bloom filter** kiểm tra URL đã cào → tiết kiệm memory.
- **DNS cache** (DNS lookup là bottleneck).
- **Distributed workers** pull từ queue (Kafka), fetch, parse HTML, extract link, push link mới vào queue.
- **Content seen?** (hash HTML) để bỏ trang duplicate.
- **Robots.txt** parser + respect.
- **Freshness:** re-crawl theo lịch (scheduling) dựa trên tần thay đổi trang.
- **Storage:** raw HTML → object storage (S3); metadata → DB.

## ✅ Checklist tự đánh giá
- [ ] Đã thiết kế URL frontier + politeness?
- [ ] Đã dùng Bloom filter / hash dedup?
- [ ] Đã xử lý scale (distributed workers, queue)?
- [ ] Đã nói về freshness (re-crawl schedule)?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
