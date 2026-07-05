# 02 — Design Twitter / News Feed 🔥 MẪU

> **Loại:** Medium · **Tần suất:** 🔥🔥🔥 (cùng nhóm với Instagram/Facebook feed).
> Áp dụng đúng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional
- User **post** một tweet (text, có thể kèm ảnh/video).
- User **follow** / unfollow người khác.
- **News feed (timeline):** hiển thị các tweet mới nhất từ những người user đang follow, sắp xếp theo thời gian.
- (Tuỳ) Search tweet, retweet, like.

### Non-functional
- **Low latency** khi load feed (< 200ms).
- **High availability** — feed phải luôn xem được (chấp nhận eventual consistency vài giây).
- **Fanout rất lớn** — người nổi tiếng (celebrity) có hàng triệu follower.
- Tỉ lệ **read:write ≈ 100:1** (đọc feed nhiều hơn đăng bài).

### Scope
- **DAU ~ 150M**, mỗi user đọc feed ~ 50 lần/ngày, đăng ~ 1 tweet/ngày.

---

## Bước 2 — Estimation

- **Write (post):** 150M DAU × 1 tweet = **150M tweets/ngày ≈ 1.7k QPS** (peak × 3 ≈ 5k QPS).
- **Read (feed):** 150M × 50 = **7.5B feed views/ngày ≈ 87k QPS** (peak × 3 ≈ 250k QPS).
- **Storage:** tweet ~ 1KB (text + metadata) → 150GB/ngày → **~50TB/năm**.
- **Fanout trung bình:** 1 user follow ~ 200 người; celebrity follow ~ 1M+.

> ✅ Kết luận: **read >> write**, feed generation là *bottleneck chính*. Phải chọn chiến lược **fanout** cẩn thận.

---

## Bước 3 — High-Level Design + API + Data Model

### API
```
POST /v1/tweets          { text, media? }         → 201 { tweet_id }
POST /v1/follow          { user_id }              → 200
GET  /v1/feed?cursor=...                          → 200 { tweets[] }
```

### Data Model
```
tweets      (tweet_id PK, user_id, content, media_url, created_at)
follows     (follower_id, followee_id)  index trên cả 2 cột
users       (user_id, ... )
timeline    (cache)  -- feed pre-computed
```

### Architecture
```
[Client] → [LB] → [API Server]
                ├─ POST /tweet  → Tweet Service → DB (tweets) ─┐
                │                                  [Fanout Worker] ← Kafka
                └─ GET /feed → Feed Service → [Timeline Cache (Redis)]
                                                  ↑ pre-filled by fanout
```

---

## Bước 4 — Deep Dive — TRỌNG TÂM: News Feed Generation

Đây là **phần chấm điểm chính**. Có 2 chiến lược, mỗi cái có trade-off rõ ràng:

### Chiến lược A — **Fanout-on-write** (push)
Khi user X post tweet → background worker **push** tweet vào timeline cache của **mỗi follower** (pre-compute).
- ✅ **Đọc cực nhanh** — feed chỉ cần `GET list` từ cache (O(1)).
- ❌ **Vấn đề celebrity:** nếu user có 100M follower → post 1 tweet phải ghi 100M lần → **hot-spot, write amplification khổng lồ**.
- ❌ User inactive vẫn bị tốn tài nguyên ghi.

### Chiến lược B — **Fanout-on-read** (pull)
Khi user Y load feed → query `tweets` của tất cả người Y follow, **sort, merge**, rồi cache kết quả.
- ✅ Không tốn tài nguyên cho user inactive.
- ✅ Không có vấn đề celebrity.
- ❌ **Đọc chậm** (phải merge nhiều nguồn), đặc biệt nếu follow nhiều người.

### ✅ Giải pháp lai (Hybrid) — thực tế Twitter/Facebook dùng
- **Người thường (follower < threshold, vd 100k):** fanout-on-write (push vào cache timeline).
- **Celebrity (follower lớn):** KHÔNG push. Khi user thường load feed → **merge** timeline cache của họ + **pull các tweet mới nhất của celebrity họ follow** → sort.
- → Vừa đọc nhanh vừa tránh hot-spot.

```
On post(tweet by user U):
  if followers(U) < THRESHOLD:
     for each follower f:  timeline_cache[f].prepend(tweet)   # push
  else:
     celebrity_tweets[U].prepend(tweet)                       # chỉ lưu 1 chỗ
On get_feed(user F):
  feed = timeline_cache[F]                                     # pre-filled
  for celeb c in following_celebs(F):
     feed.merge(celebrity_tweets[c])                          # pull celebrity
  return sort_by_time(feed)
```

### Chi tiết phụ trợ
- **Lưu trữ timeline cache:** Redis **sorted set** (ZSET) với score = timestamp → sort sẵn, cắt top 1000, evict cũ. TTL để dọn.
- **Pagination:** cursor-based (`created_at < X`), không offset (offset chậm & lệch khi có tweet mới).
- **Consistency:** tweet có thể trễ vài giây tới follower → chấp nhận được (eventual).
- **Reverse-chronological vs ranked feed:** nếu muốn xếp hạng (engagement-based) → cần ranking model, phức tạp hơn; interview thường chỉ cần reverse-chrono.

---

## Bước 5 — Bottlenecks, Scaling & Trade-offs

### Bottlenecks
- **Fanout write-amp cho celebrity** → giải bằng hybrid (đã nêu).
- **DB write (tweets) quá tải** → shard theo `user_id` (tweet của 1 user cùng shard). Dùng Snowflake tweet_id (timestamp-based) để sort/merge không cần query created_at.
- **Cache memory** cho 150M user × 1000 tweet × ~100B = **15TB+** Redis → shard cache cluster.

### Trade-offs chính
- **Push vs Pull vs Hybrid** — trade-off latency đọc ↔ write amp. *(Nêu rõ, đây là điểm ăn điểm.)*
- **Strong vs eventual consistency** — chấp nhận tweet trễ vài giây để scale.
- **Shard theo user_id vs tweet_id** — user_id tốt cho fanout (đọc tất cả tweet của 1 user), tweet_id tốt cho Snowflake sort.

---

## Bước 6 — Wrap-up

### Monitoring
- **Fanout lag** (khoảng cách giữa post-time và push đến cache) → alert nếu > vài giây.
- Feed load latency p99, cache hit rate.
- Queue depth (Kafka) của fanout workers.

### Follow-up
- **Caching tweet content** riêng để feed chỉ lưu tweet_id (tiết kiệm RAM).
- **De-dup** khi unfollow/refollow (dọn tweet cũ khỏi cache).
- **Tombstones** khi xóa tweet → ghi tombstone để xóa khỏi cache follower.
- **Search** (Elasticsearch) và **trending** (count top-K hashtag qua sliding window) — scope riêng.

---

## 📌 Takeaway gọn
> *"Feed là read-heavy → tôi dùng hybrid fanout: push (pre-compute timeline) cho người thường để đọc O(1), và pull-on-read cho celebrity để tránh write amplification. Timeline cache bằng Redis ZSET, sort theo Snowflake timestamp, cursor pagination. Trade-off cốt lõi là push vs pull và eventual consistency để scale."*

---
🔗 Quay lại [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)