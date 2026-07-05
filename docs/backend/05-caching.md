# 💾 05 — Caching (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Cache-aside vs Write-through vs Write-back? 🔥

**Định nghĩa các chiến lược ghi cache:**

| Chiến lược | Flow | Ưu | Nhược |
|-----------|------|-----|--------|
| **Cache-aside (Lazy loading)** | App đọc cache → miss → đọc DB → điền cache | Đơn giản, chỉ cache cái dùng | Cache có thể **stale**; **cache miss** chậm (3 round-trip) |
| **Write-through** | Ghi cache **và** DB cùng lúc (đồng bộ) | Cache luôn fresh | **Write latency** cao (2 write) |
| **Write-back (write-behind)** | Ghi cache **trước**, async **flush** DB sau | Write **rất nhanh** | Rủi ro **mất data** nếu cache chết trước khi flush |
| **Write-around** | Ghi thẳng DB, bỏ qua cache | Tránh cache bloat cho write-once | Read sau đó miss |

**Đào sâu — chọn khi nào:**
- **Cache-aside:** mặc định cho read-heavy (đa số app).
- **Write-through:** khi cần cache luôn fresh, write không quá nhạy cảm về latency.
- **Write-back:** khi cần **write throughput cực cao** (logging, IoT) + chấp nhận rủi ro nhỏ.
- Thường **kết hợp**: cache-aside cho read + write-through cho dữ liệu hot.

**Gotcha:**
- **Write-back** là **đánh đổi durability vs latency** — đảm bảo có **WAL/replication** cho cache nếu dùng.
- Follow-up: *"Cache-aside stale data?"* → cần **TTL** + **explicit invalidation** khi DB đổi.

---

## 2. Cache invalidation strategies? Tại sao "cache invalidation is hard"? 🔥

**Ngắn:** *"There are only two hard things in CS: cache invalidation and naming things."* — vì cache = **bản sao**; phải giữ nó **đồng bộ** với source-of-truth.

**Strategies:**
1. **TTL (Time To Live):** cache tự hết hạn sau N giây. Đơn giản nhất, chấp nhận stale trong TTL.
2. **Explicit invalidation:** khi DB update → **xóa/sửa** cache (event-driven).
3. **Write-through** (luôn fresh, xem câu 1).
4. **Versioning / generation key**: cache key kèm version (`user:123:v5`), đổi version = vô hiệu hết cache cũ.

**Đào sâu — các pitfall:**
- **Cache-DB race (read-then-write vs write-then-invalidate):**
  ```
  Thread A: đọc DB (giá cũ)
  Thread B: UPDATE DB + xóa cache
  Thread A: điền cache bằng giá cũ ❌ → cache stale mãi đến TTL
  ```
  Giải: **delay double delete** (xóa cache → update DB → delay → xóa cache lần 2).
- **Stale cache** khi multi-region: replication lag → cache ở region A thấy data cũ → dùng **global version** hoặc **lease**.

**Gotcha:**
- **Invalidation quá hăng** = cache trống liên tục = **thundering herd** (xem câu 4).
- Follow-up: *"Vậy đơn giản nhất là gì?"* → **TTL ngắn + idempotent recompute** — chấp nhận stale ngắn, đơn giản, ít bug.

---

## 3. Redis data structures & use cases? 🔥

**Ngắn:** Redis = **in-memory key-value store** với nhiều cấu trúc dữ liệu phong phú (không chỉ string).

| Cấu trúc | Use case kinh điển |
|----------|--------------------|
| **String** | Cache object, counter, token |
| **List** | Queue, recent activity, message backlog |
| **Hash** | Object có nhiều field (user profile) |
| **Set** | Unique items, tags, follower set |
| **Sorted Set (ZSET)** | **Leaderboard**, priority queue, time-series |
| **HyperLogLog** | Đếm distinct (cardinality) tiết kiệm memory (UV) |
| **Bitmap** | feature flag per user, daily active |
| **Stream** | message stream (giống Kafka nhẹ) |
| **Geo** | geospatial (nearby) |

**Đào sâu:**
- Redis **single-threaded** (command xử lý tuần tự) → **atomic** tự nhiên, không race condition giữa commands.
- **Pub/Sub** cho real-time notify (nhưng message không persist — nếu subscriber offline thì mất).
- **Persistence:** RDB (snapshot) + AOF (append log) — tuỳ chọn durability.
- **Redis Cluster**: sharding (16k slots) + replication.

**Gotcha:**
- Redis **không phải** chỉ là cache — còn là **message queue** (Stream), **leaderboard** (ZSET), **rate limiter** (Lua script), **distributed lock** (Redlock).
- **`KEYS *` = tai hoạ** (block Redis, scan cả keyspace) → dùng **`SCAN`** trong production.
- Follow-up: *"Redis vs Memcached?"* → Memcached đơn giản hơn (chỉ string), multi-thread, không persistence; Redis đa năng hơn.

---

## 4. Cache stampede / thundering herd? Cách giải? 🔥

**Ngắn:** Khi **hot key hết hạn (expire) cùng lúc** → hàng ngàn request cùng **miss cache** → đổ hết xuống DB → DB chết.

**Cách giải:**
1. **Request coalescing / lock:** request đầu tiên tới miss → **giành lock** đi DB, các request khác **đợi** kết quả → chỉ 1 query DB.
2. **Probabilistic early expiration (XFetch):** tái tạo cache **trước** khi hết hạn (một request ngẫu nhiên trigger refresh sớm) → tránh expire đồng loạt.
3. **Bloom filter / stale-while-revalidate:** trả cache cũ (stale) + refresh ngầm → không bao giờ miss trống.
4. **Locking with stale fallback:** nếu DB chậm, trả cache cũ thay vì đợi/timeout.

**Đào sâu:**
- Pattern **stale-while-revalidate (SWR)** = HTTP cache header quen thuộc, áp dụng cho app cache.
- **"Dogpile effect"** = tên khác của cache stampede.

**Gotcha:**
- Cũng xảy ra khi **cold start** (deploy mới, cache trống) → **warm up cache** trước khi mở traffic.
- Follow-up: *"Lock phân tán thì sao?"* → dùng Redis `SET NX` (distributed lock); cẩn thận lock expiry để tránh deadlock khi worker chết giữ lock.

---

## 5. LRU vs LFU eviction?

**Khi cache đầy**, phải **evict** bớt — chính sách nào?

| | LRU (Least Recently Used) | LFU (Least Frequently Used) |
|---|--------------------------|------------------------------|
| Tiêu chí | Xóa cái **lâu không dùng nhất** | Xóa cái **dùng ít lần nhất** |
| Cấu trúc | Doubly linked list + hash map (O(1)) | Counter + heap (phức tạp hơn) |
| Phù hợp | Pattern **temporal locality** (dùng gần đây sẽ dùng tiếp) | Data hot ổn định |
| Yếu điểm | **Scan** (đọc 1 lần lớn) đẩy hết cache cũ ra | **Bộ nhớ tần suất cũ** không quên item từng hot |

**Đào sâu:**
- Redis mặc định **no-eviction** (reject write khi đầy); tuỳ chọn `allkeys-lru`, `volatile-lru`, `allkeys-lfu`...
- **W-TinyLFU** (Caffeine) = kết hợp LRU + LFU + bộ lọc tần suất → chống scan tốt.

**Gotcha:**
- **Cache pollution:** key dùng 1 lần chiếm chỗ → đẩy data hot ra → LFU hoặc **admission filter** giải.
- Follow-up: *"Chọn chính sách nào?"* → đa số: **LRU** (đơn giản, hiệu quả cho đa số workload); analytics/hot-cold rõ → LFU.

---

## 6. TTL & Cache-aside flow?

**Cache-aside flow (read):**
```
get(key):
  v = cache.get(key)
  if v != null: return v          // hit
  v = db.query(key)               // miss → query DB
  if v: cache.set(key, v, ttl)    // điền cache với TTL
  return v
```

**TTL considerations:**
- **TTL quá dài** → stale lâu; **quá ngắn** → cache hit rate thấp (DB load cao).
- **Jitter TTL** (thêm random ±10%) → tránh **hàng loạt key hết hạn cùng lúc** → cache stampede.
- **Negative caching:** cache cả kết quả "not found" (short TTL) → chống truy vấn liên tục vào key không tồn tại.

**Gotcha:**
- **Cache hit rate** nên **> 90%** mới đáng; thấp hơn = review access pattern hoặc kích thước cache.
- Follow-up: *"Khi nào KHÔNG nên cache?"* → data thay đổi liên tục, write-heavy, hoặc data luôn unique (cache miss 100%) → cache vô dụng, tốn overhead.

---
🔗 [Quay lại README backend](./index.md)
