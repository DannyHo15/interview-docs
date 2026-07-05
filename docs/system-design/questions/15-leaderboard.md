# 15 — Design a Leaderboard 📝 (tự luyện)

> **Loại:** Easy–Medium · Hỏi dạng *"top K player globally / per game"*.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Bảng xếp hạng điểm số của hàng triệu player. Truy vấn: top 10 toàn cầu, "xếp hạng của tôi là bao nhiêu". Cập nhật điểm real-time.

## ❓ Clarifying questions nên hỏi
- **Global** hay **per-game / per-region** leaderboard?
- Cần **top-N** và **rank của tôi**?
- Số player (1M? 100M?), **update frequency**?
- Score chỉ tăng (game) hay tăng/giảm tùy ý?
- Cần **time-windowed** (top tuần này) hay all-time?

## 📐 Estimation hints
- Update QPS có thể rất cao (mỗi kill/win → update).
- Phải in-memory để đọc top-N trong ms.

## 🎯 Trọng tâm / keywords
- **Redis Sorted Set (ZSET)** — cấu trúc lý tưởng: `ZADD board score member`, `ZREVRANGE 0 9` (top 10), `ZREVRANK member` (rank của tôi). O(log N).
- **Scaling:** khi 1 leaderboard quá lớn → **shard theo khoảng điểm** (fixed buckets) hoặc consistent hashing theo player_id; merge top-N từ các shard.
- **"Rank của tôi"** trên shard: cần cộng dồn rank từ các shard có score cao hơn → cồng kềnh; hoặc lưu thêm reverse index.
- **Time-windowed (top tuần):** Redis **rollup** định kỳ (cron) hoặc **rolling ZSET** với decay.
- **Write-heavy:** batch update / pipeline để giảm round-trip Redis.
- **Persistence:** snapshot Redis → DB để rebuild khi crash.

## ✅ Checklist tự đánh giá
- [ ] Đã chọn ZSET + giải thích O(log N)?
- [ ] Đã xử lý shard khi quá lớn?
- [ ] Đã xử lý "rank của tôi" hiệu quả?
- [ ] Đã nói về time-windowed leaderboard?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
