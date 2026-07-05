# 🧠 Backend Interview — Bộ câu hỏi kinh điển

> Bộ tài liệu luyện phỏng vấn **backend engineering**, **song ngữ Việt–Anh** (giải thích tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh).
> Khác với [system design](../system-design/index.md) (thiết kế hệ thống lớn), phần này tập trung **kiến thức & concept** dạng *"giải thích X"*, *"khác biệt giữa A và B"*.

---

## 📂 Cấu trúc thư mục

```
backend/
├── README.md                       ← bạn đang ở đây (catalog + lộ trình ôn)
├── 01-databases.md                 ← SQL/NoSQL, ACID, index, transaction, isolation…
├── 02-concurrency.md               ← process/thread, race condition, deadlock, mutex…
├── 03-networking-http.md           ← TCP/UDP, HTTP/1-2-3, TLS, status code, CORS…
├── 04-api-design.md                ← REST/gRPC/GraphQL, idempotency, pagination…
├── 05-caching.md                   ← cache strategies, invalidation, Redis…
├── 06-security.md                  ← AuthN/AuthZ, JWT/Session/OAuth, OWASP Top 10…
├── 07-microservices-distributed.md ← saga, circuit breaker, service discovery…
└── 08-reliability-scalability.md   ← load balancing, retry, backpressure, idempotency…
```

---

## 📋 Catalog câu hỏi kinh điển (theo chủ đề)

### 🗄️ 1. Databases — [`01-databases.md`](./01-databases.md)
- SQL vs NoSQL? Khi nào dùng cái nào? 🔥
- Giải thích **ACID**? 🔥
- **Index** là gì? B-tree hoạt động thế nào? Khi nào tạo index? 🔥
- **Transaction isolation levels** (Read Uncommitted → Serializable) + các hiện tượng (dirty read, non-repeatable read, phantom)? 🔥
- **N+1 query problem** là gì? Cách giải? 🔥
- **Normalization vs Denormalization**? Trade-off?
- **CAP theorem**? 🔥
- **Optimistic vs Pessimistic locking**?
- **Sharding / Partitioning / Replication**?
- **Connection pool** là gì? Tại sao cần?

### ⚙️ 2. Concurrency — [`02-concurrency.md`](./02-concurrency.md)
- **Process vs Thread**? 🔥
- **Race condition** là gì? Cách phòng tránh? 🔥
- **Deadlock** là gì? 4 điều kiện Coffman? Cách phòng tránh? 🔥
- **Mutex vs Semaphore vs Monitor**?
- **Concurrency vs Parallelism**?
- **Async/await & Event loop** (Node/Bun) hoạt động thế nào? 🔥
- **Thread pool**? Cấu hình sao cho đúng?
- **Context switching** tốn kém thế nào?

### 🌐 3. Networking & HTTP — [`03-networking-http.md`](./03-networking-http.md)
- **TCP vs UDP**? 3-way handshake? 🔥
- **HTTP/1.1 vs HTTP/2 vs HTTP/3**? 🔥
- **HTTPS / TLS handshake** diễn ra thế nào? 🔥
- **HTTP status codes** quan trọng (200/301/302/304/400/401/403/404/429/5xx)? 🔥
- **CORS** là gì? Tại sao & cách xử lý? 🔥
- **WebSocket vs SSE vs Polling/Long-polling**?
- **Cookie / Session / Token** khác nhau thế nào?
- **Idempotency** trong HTTP? Phương thức nào idempotent?

### 🧩 4. API Design — [`04-api-design.md`](./04-api-design.md)
- **REST** principles? RESTful là gì? 🔥
- **REST vs GraphQL vs gRPC**? Khi nào dùng cái nào? 🔥
- Cách **versioning** API? 🔥
- **Pagination** (offset vs cursor)? Khi nào dùng cái nào? 🔥
- Thiết kế **idempotent API**? 🔥
- **Rate limiting** ở API layer?
- REST error handling & status code chuẩn?

### 💾 5. Caching — [`05-caching.md`](./05-caching.md)
- **Cache-aside vs Write-through vs Write-back (write-behind)**? 🔥
- **Cache invalidation** strategies? Tại sao "cache invalidation is hard"? 🔥
- **Redis** data structures & use cases? 🔥
- **Cache stampede / thundering herd**? Cách giải (bloom filter, request coalescing)? 🔥
- **LRU vs LFU** eviction?
- **TTL** & **cache-aside** flow?

### 🔐 6. Security — [`06-security.md`](./06-security.md)
- **Authentication vs Authorization**? 🔥
- **JWT vs Session cookie vs OAuth2**? 🔥
- **Hash password** đúng cách (bcrypt/argon2 + salt)? Tại sao không MD5/SHA? 🔥
- **OWASP Top 10**: SQL Injection, XSS, CSRF — giải thích & phòng tránh? 🔥
- **SQL Injection** phòng tránh thế nào (prepared statement)?
- **HTTPS/encryption** at rest vs in transit?
- **Rate limiting & DDoS** mitigation?

### 🏗️ 7. Microservices & Distributed — [`07-microservices-distributed.md`](./07-microservices-distributed.md)
- **Monolith vs Microservices**? Trade-off? 🔥
- **API Gateway** là gì? Tại sao cần?
- **Service discovery / registry** (Consul, Eureka)?
- **Distributed transactions**: **Saga** vs **2PC**? 🔥
- **Circuit breaker** (và Bulkhead, Retry)?
- **Eventual consistency** & khi nào chấp nhận?
- **Idempotency** trong hệ phân tán? 🔥
- **Message queue** patterns (CQRS, event sourcing — khái niệm)?

### 🛡️ 8. Reliability & Scalability — [`08-reliability-scalability.md`](./08-reliability-scalability.md)
- **Load balancing** algorithms (round-robin, least-conn, consistent hashing)? 🔥
- **Retry** với **exponential backoff + jitter**? 🔥
- **Circuit breaker** pattern?
- **Idempotency** & **retry-safe** operations?
- **Graceful degradation / fallback**?
- **Health check** (liveness vs readiness)?
- **Backpressure**?
- **SPOF** & **failover**?

---

## 🗺️ Lộ trình ôn (Study Roadmap)

### Level 1 — Must-know (ôn đầu tiên, 1–2 tuần)
`Databases` → `Networking/HTTP` → `API Design` → `Concurrency` → `Security (AuthN/AuthZ + OWASP)`
> Đây là thứ gần như **chắc chắn được hỏi** ở mọi vòng kỹ thuật.

### Level 2 — Senior (tuần 3–4)
`Caching` (sâu) → `Reliability/Scalability` → `Microservices/Distributed`
> Thường hỏi cho mid/senior, liên quan hệ thống thực tế.

### Level 3 — Bonus / theo stack
- Stack Node/Bun/TS (như project này): **Event loop, Streams, async pitfalls, GC**.
- Java/JVM: **GC algorithms, JVM memory model, thread model**.
- Go: **goroutine, channel, GMP scheduler**.

---

## ✍️ Mẹo trả lời câu hỏi concept backend

1. **Bắt đầu bằng 1 câu định nghĩa gọn** (elevator answer) → rồi mới đào sâu. Interviewer muốn xem bạn có hiểu bản chất không.
2. **So sánh = bảng/trade-off**: khi hỏi "A vs B", luôn nêu **khi nào dùng A, khi nào dùng B** + nhược điểm.
3. **Ví dụ cụ thể**: dùng trải nghiệm thực tế ("ở dự án cũ tôi gặp N+1 khi…") → điểm cộng lớn.
4. **Don't bullshit**: nếu không biết, nói *"Tôi chưa rành, nhưng theo tôi hiểu thì…"* rồi suy luận — tốt hơn bịa.
5. **Follow-up**: interviewer thường đào sâu ("vậy nếu… thì sao?") — chuẩn bị sẵn các gotcha (đã ghi cuối mỗi câu).

---

📚 **Tài liệu tham khảo:**
- *Designing Data-Intensive Applications* (Martin Kleppmann) — bắt buộc cho DB/distributed.
- *System Design Primer* — phần backend concepts.
- MDN / RFC cho HTTP chi tiết.
- OWASP Cheat Sheet Series cho security.
