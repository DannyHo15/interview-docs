# 🧠 System Design Interview — Bộ câu hỏi kinh điển

> Bộ tài liệu luyện phỏng vấn system design, **song ngữ Việt–Anh** (giải thích tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh).
> Mục tiêu: giúp bạn **tư duy theo khuôn mẫu** thay vì học thuộc từng câu trả lời.

---

## 📂 Cấu trúc thư mục

```
system_design/
├── README.md                  ← bạn đang ở đây (catalog câu hỏi)
├── 00-solving-framework.md    ← khung giải 6 bước (ĐỌC TRƯỚC)
└── questions/
    ├── 01-url-shortener.md       ✅ giải chi tiết mẫu
    ├── 02-twitter-newsfeed.md    ✅ giải chi tiết mẫu
    ├── 03-rate-limiter.md        ✅ giải chi tiết mẫu
    ├── 04-pastebin.md            📝 chỉ đề bài + checklist
    ├── 05-distributed-cache.md   📝 chỉ đề bài + checklist
    ├── 06-key-value-store.md     📝 chỉ đề bài + checklist
    ├── 07-message-queue.md       📝 chỉ đề bài + checklist
    ├── 08-search-autocomplete.md 📝 chỉ đề bài + checklist
    ├── 09-web-crawler.md         📝 chỉ đề bài + checklist
    ├── 10-chat-whatsapp.md       ✅ giải chi tiết mẫu
    ├── 11-notification-system.md ✅ giải chi tiết mẫu
    ├── 12-youtube-streaming.md   ✅ giải chi tiết mẫu
    ├── 13-google-drive.md        📝 chỉ đề bài + checklist
    ├── 14-uber-ride.md           📝 chỉ đề bài + checklist
    └── 15-leaderboard.md         📝 chỉ đề bài + checklist
```

- ✅ **Giải chi tiết mẫu**: giải đầy đủ 6 bước → dùng làm **khuôn mẫu** để bắt chước cách trình bày.
- 📝 **Stub**: chỉ đề bài + clarifying questions + trọng tâm → bạn **tự luyện** theo khung rồi đối chiếu.

---

## 🚀 Cách dùng hiệu quả

1. **Đọc [00-solving-framework.md](./00-solving-framework.md)** cho thuộc 6 bước.
2. **Đọc 3 bài ✅ mẫu** để thấy cách áp dụng khung vào thực tế.
3. **Tự giải 1 bài 📝**: mở một timer 45 phút, vẽ + nói (hoặc viết) ra, KHÔNG nhìn đáp án.
4. **So sánh** với keyword/trọng tâm đã gợi ý ở cuối mỗi file stub; tự đánh giá phần nào thiếu.
5. Lặp lại với các câu khó hơn.

---

## 📋 Catalog câu hỏi kinh điển (theo độ khó)

> 🔥 = cực kỳ phổ biến trong phỏng vấn. Mức độ chỉ là tương đối.

### 🟢 Easy — Nền tảng (warm-up)
| # | Câu hỏi | Trọng tâm chính | File |
|---|---------|-----------------|------|
| 1 | **Design a URL Shortener** (TinyURL/Bitly) | base62 encode, ID gen, redirect 301/302, cache | [01](./questions/01-url-shortener.md) ✅ |
| 2 | **Design Pastebin** | key-value, expiration, text storage | [04](./questions/04-pastebin.md) 📝 |
| 3 | **Design a Rate Limiter** | token/leaky bucket, sliding window, Redis | [03](./questions/03-rate-limiter.md) ✅ |
| 4 | **Design a Distributed Cache** (Memcached/Redis) | LRU, consistent hashing, cache invalidation | [05](./questions/05-distributed-cache.md) 📝 |
| 5 | **Design a Key-Value Store** (DynamoDB-style) | consistent hashing, replication, vector clock, quorum | [06](./questions/06-key-value-store.md) 📝 |
| 6 | **Design a Unique ID Generator** | Snowflake, UUID, snowflake 64-bit | *(trong README)* |
| 7 | **Design a Distributed Message Queue** (Kafka) | partition, offset, consumer group, durability | [07](./questions/07-message-queue.md) 📝 |

### 🟡 Medium — Ứng dụng phổ biến
| # | Câu hỏi | Trọng tâm chính | File |
|---|---------|-----------------|------|
| 8 | **Design Twitter / News Feed** 🔥 | fanout-on-write vs fanout-on-read, timeline cache | [02](./questions/02-twitter-newsfeed.md) ✅ |
| 9 | **Design Instagram** | image storage (S3+CDN), feed, pre-generation | *(trong README)* |
| 10 | **Design Search Autocomplete (Typeahead)** 🔥 | Trie, top-K, sharding by prefix | [08](./questions/08-search-autocomplete.md) 📝 |
| 11 | **Design a Web Crawler** | BFS queue, dedup (bloom filter), politeness, freshness | [09](./questions/09-web-crawler.md) 📝 |
| 12 | **Design a Chat System** (WhatsApp/Messenger) 🔥 | WebSocket, message ordering, delivery status, fanout | [10](./questions/10-chat-whatsapp.md) ✅ |
| 13 | **Design a Notification System** | multi-channel (push/sms/email), rate limit, fanout | [11](./questions/11-notification-system.md) ✅ |
| 14 | **Design YouTube / Netflix (streaming)** 🔥 | chunked upload, transcoding, CDN, adaptive bitrate | [12](./questions/12-youtube-streaming.md) ✅ |
| 15 | **Design Dropbox / Google Drive** | chunk sync, conflict resolution (OT/CRDT), block storage | [13](./questions/13-google-drive.md) 📝 |
| 16 | **Design Ticketmaster / Seat booking** | concurrency, locking, idempotent hold | *(trong README)* |
| 17 | **Design Quora / Reddit** | ranking, nested comments, vote aggregation | *(trong README)* |
| 18 | **Design a Leaderboard** | sorted set (Redis ZSET), top-K, sharding | [15](./questions/15-leaderboard.md) 📝 |
| 19 | **Design Google Maps / Yelp (Nearby)** | geohash, quadtree, proximity search | *(trong README)* |
| 20 | **Design an E-commerce site (Amazon)** | catalog, cart, checkout, inventory consistency | *(trong README)* |

### 🔴 Hard — Quy mô lớn / domain phức tạp
| # | Câu hỏi | Trọng tâm chính | File |
|---|---------|-----------------|------|
| 21 | **Design Uber / Ola (ride sharing)** 🔥 | geospatial index, dispatching, ETAs, surge pricing | [14](./questions/14-uber-ride.md) 📝 |
| 22 | **Design Google Search** | crawler → indexer → ranker, inverted index, PageRank | *(trong README)* |
| 23 | **Design a Distributed Database** (Cassandra/spanner) | partitioning, replication, consistency levels, gossip | *(trong README)* |
| 24 | **Design a CDN** | edge servers, cache key, cache invalidation, origin pull | *(trong README)* |
| 25 | **Design Google Docs (collaborative editing)** 🔥 | Operational Transform / CRDT, presence, undo | *(trong README)* |
| 26 | **Design a Metrics / Logging system** (Datadog) | ingestion at scale, time-series DB, sampling, TSDB | *(trong README)* |
| 27 | **Design a Payment system** (Stripe/PayPal) | idempotency, ledger, double-entry, reconciliation | *(trong README)* |
| 28 | **Design a Limit Order Book** (stock exchange) | in-memory matching engine, FIFO, lock-free | *(trong README)* |
| 29 | **Design a Distributed Task Scheduler** (Airflow/Temporal) | queue + worker pool, retry, cron, idempotency | *(trên README)* |
| 30 | **Design a Multi-region Read/Write system** | geo-replication, conflict resolution, latency | *(trong README)* |

---

## 🧩 Các chủ đề nền tảng (concept) nên ôn riêng

Nhiều câu hỏi thực ra là **tổ hợp** của các concept này. Ôn kỹ trước khi đi phỏng vấn:

- **Networking:** DNS, CDN, Load balancer (L4/L7), reverse proxy, API gateway.
- **Storage:** SQL vs NoSQL, indexes, sharding, replication (master-slave / multi-master), partitioning.
- **Caching:** cache-aside, write-through/write-back, eviction (LRU/LFU), cache stampede, cache invalidation (hardest problem).
- **Consistency:** CAP, PACELC, strong vs eventual, quorum (W+R>N), vector clocks, distributed consensus (Paxos/Raft).
- **Messaging:** pub/sub, message queue vs stream, exactly-once vs at-least-once, dead letter queue.
- **Scalability:** horizontal vs vertical, stateless services, consistent hashing, database scaling patterns.
- **Reliability:** idempotency, retries with backoff, circuit breaker, bulkhead, rate limiting.
- **Real-time:** polling, long-polling, WebSocket, SSE.
- **Estimation:** power-of-two, latency numbers, throughput/throughput math.

📚 **Tài liệu tham khảo nên đọc:**
- *System Design Interview* (Alex Xu) — Vol 1 & 2.
- *Designing Data-Intensive Applications* (Martin Kleppmann) — kinh điển, sâu.
- [System Design Primer](https://github.com/donnemartin/system-design-primer) (Donne Martin) — open source.
- [High Scalability](https://highscalability.com/) — case study hệ thống thật.

---

## ✍️ Ghi chú nhỏ cho người đi phỏng vấn

1. **Nói ra suy nghĩ** — silence là điểm trừ.
2. **Hỏi clarifying questions** trước khi thiết kế.
3. **Đi từ đơn giản đến phức tạp** — vẽ box thô trước rồi mới deep dive.
4. **Nêu trade-off rõ ràng** — không có giải pháp nào hoàn hảo.
5. **Biết giới hạn bản thân** — nếu không chắc 1 số, hãy nói *"Tôi sẽ verify, nhưng theo tôi hiểu…"* thay vì bịa.