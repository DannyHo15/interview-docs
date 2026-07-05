# 01 — Design a URL Shortener (TinyURL / Bitly) ✅ MẪU

> **Loại:** Easy–Medium · **Tần suất:** 🔥🔥🔥 (gần như chắc chắn gặp dạng tương tự).
> Áp dụng đúng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional (làm gì)
- **Shorten:** nhận một `long_url` → trả về `short_url` (vd `https://tiny.url/abc123`).
- **Redirect:** khi user truy cập `short_url` → HTTP redirect về `long_url` gốc.
- (Tuỳ) **Custom alias:** user tự đặt short code (`/my-link`).
- (Tuỳ) **Analytics:** đếm số click, thời gian click.

### Non-functional (như thế nào)
- **High availability** — hệ thống không được chết (link chết = mất traffic khách hàng).
- **Low latency** — redirect phải nhanh (p99 < 50ms).
- **Read-heavy** — tỉ lệ read:write ≈ **100:1**.
- **Durability** — link không được mất (gần như read-only sau khi tạo).
- Short URL **không đoán được** (anti-enumeration) — tránh leak.

### Scope (chốt lại với interviewer)
- Khởi đầu: **100M shortenings/năm**, read 100:1.
- Short URL ngắn cỡ nào? → **7 ký tự** là đủ (xem estimation).

---

## Bước 2 — Estimation

**Giả định:** 100M new URLs/năm → ~`10^8/năm ≈ 3 URLs/giây` write. Read 100:1 → **300 reads/giây** (rất nhẹ, nhưng xét peak 10x → ~3000 RPS, vẫn nhỏ).

> 💡 Nếu interviewer cho quy mô lớn hơn (vd Bitly thật ~ 100M shortenings/tháng), nhân lên ~12–50x.

**Độ dài short code:**
- Base62 (`[a-zA-Z0-9]` = 62 ký tự). `62^6 ≈ 5.7 × 10^10` → 6 ký tự đủ cho hàng tỷ URL.
- Chọn **7 ký tự** cho thoải mái (~3.5 × 10^12) + khó brute-force.

**Storage:** mỗi record ~ 500 bytes (URL + metadata) → `100M × 500B = 50GB/năm`. Trong 10 năm = **500GB** → 1 máy DB chạy được, nhưng thiết kế shard-ready.

**Cache:** hot URLs (theo 80/20) → cache ~20% read traffic. Read 300M/năm → cache ~ size của các hot URL (~ vài GB RAM).

> ✅ Kết luận estimation: write nhẹ, read-heavy, DB vài trăm GB, cache vài GB → **architecture tập trung vào đọc nhanh + available**.

---

## Bước 3 — High-Level Design + API + Data Model

### API
```
POST /api/v1/data/shorten
  body: { long_url, custom_alias? }
  → 200 { short_url }

GET  /:short_code   →  HTTP 301 (hoặc 302) → Location: long_url
```

> ⚠️ **301 vs 302:**
> - **301 (Permanent):** browser cache → nhanh cho user, **nhưng mất analytics** (không qua server lần sau).
> - **302 (Temporary):** luôn qua server → **đếm được click**, chậm hơn chút. Bitly chọn 302 để thu analytics.

### Data Model
```
url_mappings
  hash (PK)        varchar(7)   -- short code
  original_url     text
  user_id          bigint
  created_at       timestamp
  expiration?      timestamp
  index on user_id, created_at
```

### Architecture (vẽ)
```
[Client] → [Load Balancer] → [API Server (stateless, N instances)]
                                  ├─ POST /shorten → write
                                  └─ GET /:code    → read
                              ↕
                     [Cache (Redis)  ← 90%+ hit]
                              ↕
                     [DB Primary]  →  [DB Replicas xN] (read scale)
```

---

## Bước 4 — Deep Dive

### 🔑 Phần cốt lõi #1: Sinh short code như thế nào?

**3 lựa chọn — mỗi cái có trade-off:**

| Cách | Ưu | Nhược |
|------|-----|--------|
| **a) Auto-increment ID + base62 encode** | Đơn giản, ngắn, unique chắc chắn | **Đoán được** (id tăng dần → lộ thông tin) |
| **b) Hash MD5(long_url) → lấy 7 ký tự** | Deterministic (cùng URL → cùng code, dedup) | Collision; 7 ký tự có thể trùng |
| **c) Snowflake ID (64-bit) + base62** | Không đoán được, distributed, sortable | Phức tạp hơn |

> **Giải pháp thực tế (Bitly-style):** dùng **key-generation service** (KGS) — một service riêng sinh sẵn batch các random key, lưu vào 2 bảng `used_keys` & `unused_keys`. App server xin 1 batch, đánh dấu used khi dùng. → **O(1) lookup, không collision, không đoán được.**

### 🔑 Phần cốt lõi #2: Read path — redirect nhanh

- Request đến → check **Redis cache** (key = short_code).
  - **Hit** → trả 302 ngay (~ 1ms).
  - **Miss** → query DB → fill cache → trả.
- DB read chia qua **read replicas** (read-heavy).
- **Cache stampede** khi hot URL vừa hết hạn → dùng **request coalescing** hoặc **lock** để chỉ 1 request đi DB.

### 🔑 Phần cốt lõi #3: Dedup — cùng long_url có tạo code mới không?
- Nếu muốn **cùng URL → cùng code** (tiết kiệm storage): check `original_url` index trước khi insert.
- Nếu muốn mỗi lần tạo là code mới (analytics riêng): bỏ qua.
- Thường: **dedup theo (user_id + long_url)**.

---

## Bước 5 — Bottlenecks, Scaling & Trade-offs

### SPOF & failure
- **DB primary chết** → promote replica (failover); hoặc dùng multi-AZ.
- **Cache cluster chết** → traffic đổ xuống DB → DB quá tải. **Mitigation:** graceful degradation + circuit breaker + tăng connection pool. Đặt TTL dài để giảm load.
- **KGS (key generator) chết** → app dùng batch còn dư (pre-fetched) để sống sót.

### Scaling
- **Stateless API servers** → scale ngang vô hạn qua LB.
- **Sharding DB** theo `hash` (short_code) khi vượt 1 máy — short code phân phối đều → **consistent hashing** để reshard ít move.
- **Multi-region** đặt cache/read replica gần user → giảm latency redirect toàn cầu.

### Trade-offs chính
- **301 vs 302:** performance (cache) ↔ analytics.
- **Deterministic hash vs random key:** dedup ↔ không đoán được.
- **Strong vs eventual consistency:** replication async → user tạo xong rồi read ngay trên replica có thể miss → cần **read-after-write** qua primary trong cửa sổ ngắn.

---

## Bước 6 — Wrap-up

### Monitoring
- **RED metrics:** Rate (QPS read/write), Errors (5xx, cache miss rate), Duration (p99 latency).
- Alert khi cache hit rate < 90% hoặc p99 latency tăng.
- **Analytics pipeline:** click events → Kafka → batch → warehouse (BigQuery/Snowflake) cho dashboard.

### Follow-up có thể hỏi
- Custom alias / vanity URL? → check trùng + reserved words.
- Expiration? → background job xóa mềm, TTL cache.
- Rate limit per-IP để chống spam shorten.
- Anti-abuse (phishing/malware URL) → check qua Google Safe Browsing API trước khi accept.

---

## 📌 Takeaway / câu "kể chuyện" gọn
> *"Tôi thiết kế read-heavy, low-latency: stateless API + Redis cache (90% hit) + DB primary/replica. Sinh short code bằng key-generation service để tránh collision và không đoán được. Redirect dùng 302 để thu analytics. Mở rộng bằng sharding theo short_code + multi-region cache. Trade-off chính là 301 vs 302 và dedup policy."*

---
🔗 Quay lại [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)