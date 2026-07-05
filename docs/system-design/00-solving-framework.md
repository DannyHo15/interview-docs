# 🛠 System Design — Khung giải 6 bước (Universal Solving Framework)

> **Mục đích:** Đây là khung **mặc định** áp dụng cho MỌI câu hỏi system design. Khi gặp đề nào, hãy đi đúng 6 bước này theo thứ tự. Khung dựa trên *System Design Interview* (Alex Xu) + *System Design Primer* (Donne Martin).

---

## ⏱ Phân bổ thời gian (cho 45 phút phỏng vấn)

| Bước | Nội dung | Thời gian |
|------|----------|-----------|
| 1 | Clarify requirements (làm rõ yêu cầu) | 3–5 phút |
| 2 | Back-of-the-envelope estimation | 3–5 phút |
| 3 | High-level design + API + Data model | 10–15 phút |
| 4 | Deep dive (thiết kế chi tiết) | 10–15 phút |
| 5 | Bottlenecks, scaling & trade-offs | 5–8 phút |
| 6 | Wrap-up, monitoring, follow-ups | 2–3 phút |

> 💡 **Quy tắc vàng:** Luôn **nói trước khi vẽ**. Communicate liên tục — interviewer đánh giá **quá trình tư duy**, không phải kết quả cuối cùng.

---

## Bước 1 — Clarify Requirements (Làm rõ yêu cầu)

**Đừng nhảy vào thiết kế ngay!** Hỏi lại interviewer để thu hẹp phạm vi (scope).

### 1a. Functional requirements (Yêu cầu chức năng — hệ thống LÀM GÌ)
- Liệt kê các tính năng cốt lõi (core features).
- Ví dụ URL shortener: *"Người dùng submit long URL → nhận short URL. Click short URL → redirect về long URL."*

### 1b. Non-functional requirements (Yêu cầu phi chức năng — hệ thống NHƯ THẾ NÀO)
Đây là phần interviewer muốn thấy bạn nghĩ tới. Các trục chính:

| Trục | Câu hỏi mẫu |
|------|-------------|
| **Scale** | Bao nhiêu user? Bao nhiêu QPS (queries/sec) read/write? |
| **Latency** | Cần real-time (p99 < 100ms) hay eventual? |
| **Availability** | 99.9% hay 99.99%? Có chấp nhận downtime để consistency? |
| **Consistency** | Strong consistency hay eventual consistency? (CAP) |
| **Durability** | Dữ liệu mất được không? |
| **Cost** | Budget có hạn không? |

### 1c. Xác định phạm vi
- Ai là user? (consumer / B2B / internal)
- Có cần auth không?
- Platform nào? (web / mobile / cả hai)

> ✅ **Checklist:** Đã rõ *ai dùng, dùng để làm gì, quy mô thế nào, ưu tiên gì (latency vs consistency)*.

---

## Bước 2 — Back-of-the-Envelope Estimation (Ước lượng quy mô)

Mục đích: biết được **order of magnitude** để chọn công nghệ và thiết kế. Không cần chính xác tuyệt đối.

### Các số cần ước lượng
- **Users:** MAU, DAU.
- **Traffic:** Read QPS, Write QPS (thường read >> write, vd 100:1).
- **Storage:** Dữ liệu tăng bao nhiêu GB/năm? → có cần shard không?
- **Bandwidth:** Bao nhiêu MB/s in/out?
- **Memory (cache):** Bao nhiêu RAM để cache hot data (theo quy tắc 80/20)?

### 📐 Số "tham chiếu" cần thuộc (Power-of-two & latency)
```
Power of two:
  2^10  = 1 Thousand   (~1 KB)
  2^20  = 1 Million    (~1 MB)
  2^30  = 1 Billion    (~1 GB)
  2^32  = ~4 Billion

Latency numbers every programmer should know (giây):
  L1 cache reference            0.5 ns
  Branch mispredict             5   ns
  Main memory reference        100   ns
  SSD random read           150,000 ns  = 150 µs
  Read 1MB sequentially      1,000,000 ns = 1 ms (SSD)
  Network within datacenter  500,000 ns = 0.5 ms
  WAN round-trip          150,000,000 ns = 150 ms
```

> 💡 **Quy tắc:** *1 ngày = 86,400s ≈ 10^5s*. Nên *1M reads/ngày ≈ 10 QPS* (có thể sai số 1 bậc, OK).

> ✅ **Checklist:** Đã có QPS read/write, storage/năm, bandwidth. Đã chọn số lượng server/order-of-magnitude hợp lý.

---

## Bước 3 — High-Level Design + API + Data Model

### 3a. Định nghĩa API
Viết rõ contract. REST hay gRPC? Ví dụ:
```
POST /api/v1/data/shorten   { long_url }      → { short_url }
GET  /:code                                    → 301 redirect
```

### 3b. Vẽ high-level architecture (các box)
Luôn bắt đầu từ **simple nhất** rồi thêm vào. Khối cơ bản:
- **Client** → **Load Balancer** → **API Gateway**
- → **Web/App servers** (stateless, horizontal scale)
- → **Database** (primary/replica), **Cache** (Redis/Memcached)
- → **CDN**, **Object storage** (S3), **Message queue** (Kafka)

```
[Client] → [CDN] → [Load Balancer] → [App Servers] → [DB (primary)]
                                                  ↘ [Cache] ← [DB replicas]
```

### 3c. Data model
- Các entity chính (User, URL, …).
- SQL hay NoSQL? (SQL khi cần transactions/relations; NoSQL khi scale write/schema flexible).
- Indexes cần thiết.

> ✅ **Checklist:** Có API rõ ràng, sơ đồ high-level, data model, đã chọn SQL/NoSQL có lý do.

---

## Bước 4 — Deep Dive (Thiết kế chi tiết)

Đây là phần **chấm điểm chính**. Interviewer thường sẽ chỉ vào 1–2 thành phần "thú vị" để bạn đào sâu.

### Các chủ đề deep-dive phổ biến (hãy chọn đúng cho đề)
- **ID generation:** auto-increment? UUID? Snowflake? base62 encode?
- **Sharding/Partitioning:** theo key nào? Hotspot? Resharding?
- **Caching strategy:** write-through / write-around / write-back? Eviction (LRU/LFU)? Cache stampede?
- **Consistency:** eventual vs strong, quorum, distributed transactions (2PC, Saga).
- **Async processing:** message queue, background workers.
- **Long-polling / WebSocket / SSE** cho real-time.
- **Rate limiting / Throttling** ở API gateway.

> 💡 **Mẹo:** Interviewer dẫn dắt → đi theo hướng đó. Nếu họ hỏi *"how would you scale the write path?"* → tập trung vào DB sharding + queue.

> ✅ **Checklist:** Đã giải quyết được 1–2 hard part có lý, có trade-off rõ ràng.

---

## Bước 5 — Bottlenecks, Scaling & Trade-offs

Sau khi có thiết kế, **tự phê bình** nó:

### Tìm SPOF (Single Point of Failure) & failure modes
- DB primary chết? → failover sang replica (active-passive/active-active).
- Cache cluster chết? → có fallback (query DB) hay thundering herd?
- Datacenter chết? → multi-region.

### Scaling strategies
| Pattern | Khi nào dùng |
|---------|-------------|
| **Horizontal scaling** | App servers stateless → thêm máy |
| **Sharding** | DB quá lớn cho 1 máy |
| **Read replicas** | Read-heavy workload |
| **Caching** | Lặp lại query nhiều, read-heavy |
| **CDN** | Serve static/media gần user |
| **Microservices** | Khi domain phức tạp, team lớn |

### Trade-offs — luôn nói "đánh đổi gì"
> *"Nếu ưu tiên **availability** ta phải chấp nhận **eventual consistency** (CAP). Nếu ưu tiên **strong consistency**, ta phải giảm availability khi có network partition."*

> ✅ **Checklist:** Đã chỉ ra SPOF, đã có plan cho từng failure, đã nêu trade-off rõ ràng.

---

## Bước 6 — Wrap-up, Monitoring & Follow-ups

### Monitoring / Observability
- **Metrics:** throughput, latency (p50/p95/p99), error rate.
- **Logging:** structured logs, centralized (ELK/Datadog).
- **Alerting:** alert khi SLO vi phạm.
- **Tracing:** distributed tracing (OpenTelemetry/Jaeger).

### Follow-up questions (interviewer có thể hỏi thêm)
- Làm sao migrate từ thiết kế cũ sang?
- Bao nhiêu máy chủ cần? (capacity planning)
- CI/CD, rollback plan?
- Bảo mật (authn/authz, encryption, rate limit, DDoS)?

> ✅ **Checklist:** Đã nêu monitoring, đã trả lời hết câu hỏi. Tóm tắt lại thiết kế trong 30s.

---

## 🎯 Cheatsheet: "Buzzwords" cần biết & khi nào dùng

| Concept | Khi nào nhắc |
|---------|--------------|
| **Load balancer** (L4/L7, consistent hashing) | Có nhiều server |
| **CDN** (CloudFront, Cloudflare) | Static content / media gần user |
| **Sharding** (range / hash / directory) | DB scale write & storage |
| **Replication** (master-slave, multi-master) | High availability, read scale |
| **Cache** (Redis, Memcached) | Read-heavy, hot data |
| **Message queue** (Kafka, RabbitMQ) | Decouple, async, buffering |
| **CAP theorem** | Bàn về consistency vs availability |
| **Consistent hashing** | Distribute data evenly, reshard ít move |
| **Rate limiter** (token bucket, leaky bucket) | Bảo vệ backend, fairness |
| **WebSocket / SSE** | Real-time push |
| **Idempotency** | Retry-safe APIs |
| **Database normalization vs denormalization** | Trade-off write vs read |
| **Object storage** (S3) | Files, images, video |
| **Reverse proxy / API Gateway** | Auth, rate limit, routing |

---

➡️ **Tiếp theo:** Xem [các bài deep-dive mẫu](/docs/system-design/questions/url-shortener) để xem framework này áp dụng vào bài thực tế, rồi tự luyện với các câu hỏi trong sidebar.